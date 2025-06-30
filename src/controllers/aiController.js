const Groq = require("groq-sdk");
const { PrismaClient } = require("@prisma/client");
const { logger } = require("../middleware/logger");

const prisma = new PrismaClient();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "sk-your-groq-api-key-here"
    ) {
      return res.status(500).json({
        success: false,
        error:
          "Groq API key not configured. Please set GROQ_API_KEY in your .env file",
      });
    }

    logger.info(
      `AI query received from user ${req.user?.userId}: ${question.substring(
        0,
        100
      )}...`
    );

    const userId = req.user?.userId || "unknown";
    const [totalRecords, recentRecords, avgAge] = await Promise.all([
      prisma.record.count({
        where: { userId },
      }),
      prisma.record.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.record.aggregate({
        _avg: {
          age: true,
        },
        where: {
          userId,
          age: {
            not: null,
          },
        },
      }),
    ]);

    const sampleRecords = await prisma.record.findMany({
      where: { userId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        name: true,
        age: true,
        email: true,
      },
    });

    const contextMessage = `You are an AI assistant analyzing this user's uploaded CSV data. Here's their personal data summary:
    
Your Data Overview:
- Your total records: ${totalRecords}
- Records you uploaded in last 24 hours: ${recentRecords}
- Average age in your data: ${
      avgAge._avg.age ? Math.round(avgAge._avg.age * 100) / 100 : "N/A"
    }

Sample of Your Recent Records:
${sampleRecords
  .map(
    (record) =>
      `- ${record.name}, Age: ${record.age || "N/A"}, Email: ${
        record.email || "N/A"
      }`
  )
  .join("\n")}

Please answer questions about this user's personal data only. The analysis should be focused on their uploaded data, not global data. If the question is not related to their data, politely redirect to their data-related topics.`;

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: contextMessage,
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = completion.choices[0].message.content;

    logger.info(
      `AI response generated for query: ${question.substring(0, 50)}...`
    );

    res.json({
      success: true,
      data: {
        question,
        answer,
        context: {
          totalRecords,
          recentRecords,
          averageAge: avgAge._avg.age
            ? Math.round(avgAge._avg.age * 100) / 100
            : null,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`AI query error: ${error.message}`);

    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error:
          "Invalid Groq API key. Please check your GROQ_API_KEY in .env file",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again later",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to process AI query",
      details: error.message,
    });
  }
};

const getAIHistory = async (req, res) => {
  res.json({
    success: true,
    message: "AI conversation history feature not implemented yet",
    data: [],
  });
};

module.exports = {
  askAI,
  getAIHistory,
};
