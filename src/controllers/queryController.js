const { PrismaClient } = require("@prisma/client");
const { logger } = require("../middleware/logger");

const prisma = new PrismaClient();

/**
 * Get all records with optional filtering
 */
const getAllRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, minAge, maxAge, email } = req.query;

    // Build filter conditions
    const where = {};

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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get records and total count
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

/**
 * Get a single record by ID
 */
const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.record.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
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

/**
 * Get database statistics
 */
const getStats = async (req, res) => {
  try {
    const [totalRecords, totalLogs, recentRecords] = await Promise.all([
      prisma.record.count(),
      prisma.log.count(),
      prisma.record.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        totalLogs,
        recentRecords,
        lastUpdated: new Date().toISOString(),
      },
    });
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
