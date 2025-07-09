const { PrismaClient } = require("@prisma/client");
const { logger } = require("../middleware/logger");

const prisma = new PrismaClient();

const getAllRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, minAge, maxAge, email } = req.query;

    const where = {
      userId: req.user?.userId || "unknown", // Only show user's own data
    };

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (minAge || maxAge) {
      where.age = {};
      if (minAge) where.age.gte = parseInt(minAge);
      if (maxAge) where.age.lte = parseInt(maxAge);
    }

    if (email) {
      where.email = {
        contains: email,
        mode: "insensitive",
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [records, totalCount] = await Promise.all([
      prisma.record.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.record.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    logger.info(
      `Retrieved ${records.length} records (page ${page} of ${totalPages})`
    );

    res.json({
      success: true,
      data: records,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: take,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    logger.error(`Error fetching records: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch records",
      details: error.message,
    });
  }
};

const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.record.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user?.userId || "unknown", // Only allow access to user's own data
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Record not found or access denied",
      });
    }

    logger.info(`Retrieved record with ID: ${id}`);

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error(`Error fetching record by ID: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch record",
      details: error.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const userId = req.user?.userId || "unknown";

    if (req.isAuthenticated || req.user) {
      const [userRecords, userRecentRecords, userLogs, userAvgAge] =
        await Promise.all([
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
          prisma.log.count({
            where: { userId },
          }),
          prisma.record.aggregate({
            _avg: { age: true },
            where: {
              userId,
              age: { not: null },
            },
          }),
        ]);

      logger.info(`User-specific stats access by user: ${userId}`);

      res.json({
        success: true,
        data: {
          totalRecords: userRecords,
          recentRecords: userRecentRecords,
          totalLogs: userLogs,
          averageAge: userAvgAge._avg.age
            ? Math.round(userAvgAge._avg.age * 100) / 100
            : null,
          userId: userId,
          lastUpdated: new Date().toISOString(),
          message: "Your personal data statistics",
        },
      });
    } else {
      logger.info(`Unauthenticated stats access - showing placeholder data`);

      res.json({
        success: true,
        data: {
          totalRecords: 0,
          recentRecords: 0,
          totalLogs: 0,
          message: "Authenticate to view your personal statistics",
        },
      });
    }
  } catch (error) {
    logger.error(`Error fetching stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
};

module.exports = {
  getAllRecords,
  getRecordById,
  getStats,
};
