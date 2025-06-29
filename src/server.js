require("dotenv").config();
const express = require("express");
const path = require("path");
const { requestLogger, logger } = require("./middleware/logger");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

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

app.use(express.static(path.join(__dirname, "../public")));
app.use("/api", routes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/upload.html"));
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
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

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Frontend: http://localhost:${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);

  if (process.env.NODE_ENV === "development") {
    logger.info("Running in development mode");
  }
});

module.exports = app;
