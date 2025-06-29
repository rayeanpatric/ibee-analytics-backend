require("dotenv").config();
const express = require("express");
const path = require("path");
const { requestLogger, logger } = require("./middleware/logger");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// CORS (for development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api", routes);

// Root route - serve the upload page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/upload.html"));
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: "The requested endpoint does not exist",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Frontend available at: http://localhost:${PORT}`);
  logger.info(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);

  if (process.env.NODE_ENV === "development") {
    logger.info("🛠️  Running in development mode");
  }
});

module.exports = app;
