const winston = require("winston");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const prisma = new PrismaClient();

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

const requestLogger = async (req, res, next) => {
  const startTime = Date.now();

  next();

  process.nextTick(async () => {
    const userId = req.user?.userId || null;
    const logMessage = `${req.method} ${req.url} - ${req.ip} - ${
      req.get("User-Agent") || "Unknown"
    } - User: ${userId || "anonymous"}`;
    logger.info(logMessage);

    try {
      await prisma.log.create({
        data: {
          method: req.method,
          url: req.url,
          userAgent: req.get("User-Agent") || null,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userId: userId,
        },
      });
    } catch (error) {
      logger.error(`Failed to save log to database: ${error.message}`);
    }

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      logger.info(
        `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - User: ${
          userId || "anonymous"
        }`
      );
    });
  });
};

module.exports = {
  requestLogger,
  logger,
};
