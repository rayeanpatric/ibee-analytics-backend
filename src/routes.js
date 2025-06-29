const express = require("express");
const { upload, uploadCSV } = require("./controllers/uploadController");
const {
  getAllRecords,
  getRecordById,
  getStats,
} = require("./controllers/queryController");
const { askAI, getAIHistory } = require("./controllers/aiController");

const router = express.Router();

// Upload routes
router.post("/upload", upload, uploadCSV);

// Data query routes
router.get("/data", getAllRecords);
router.get("/data/stats", getStats);
router.get("/data/:id", getRecordById);

// AI assistant routes
router.post("/ask-ai", askAI);
router.get("/ai/history", getAIHistory);

// Health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
