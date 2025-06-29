const winston = require("winston");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const prisma = new PrismaClient();

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/api.log"),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * Request logging middleware
 * Logs each request to file and optionally to database
 */
const requestLogger = async (req, res, next) => {
  const startTime = Date.now();

  // Log basic request info
  const logMessage = `${req.method} ${req.url} - ${req.ip} - ${
    req.get("User-Agent") || "Unknown"
  }`;
  logger.info(logMessage);

  // Store log in database (optional - can be disabled for performance)
  try {
    await prisma.log.create({
      data: {
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent") || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
      },
    });
  } catch (error) {
    logger.error(`Failed to save log to database: ${error.message}`);
  }

  // Log response time after request completes
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = {
  requestLogger,
  logger,
};
