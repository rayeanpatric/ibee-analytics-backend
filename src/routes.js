const express = require("express");
const { upload, uploadCSV } = require("./controllers/uploadController");
const {
  getAllRecords,
  getRecordById,
  getStats,
} = require("./controllers/queryController");
const { askAI, getAIHistory } = require("./controllers/aiController");
const {
  authenticate,
  optionalAuth,
  getAuthInfo,
} = require("./middleware/auth");

const router = express.Router();

// Authentication info route (public)
router.get("/auth/info", getAuthInfo);

// Public routes (no authentication required)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    authentication: "Required for data operations",
  });
});

// Data query routes (with optional authentication - more data for authenticated users)
router.get("/data/stats", optionalAuth, getStats);

// Protected routes (authentication required)
router.post("/upload", authenticate, upload, uploadCSV);
router.get("/data", authenticate, getAllRecords);
router.get("/data/:id", authenticate, getRecordById);

// AI assistant routes (authentication required for AI features)
router.post("/ask-ai", authenticate, askAI);
router.get("/ai/history", authenticate, getAIHistory);

module.exports = router;
