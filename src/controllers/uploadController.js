const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { validateRows } = require("../utils/csvValidator");
const { logger } = require("../middleware/logger");

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".csv");
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    logger.info(`Processing CSV file: ${req.file.filename}`);

    const results = [];
    const filePath = req.file.path;

    const stream = fs
      .createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Validate all rows
          const validation = validateRows(results);

          logger.info(
            `CSV validation: ${validation.summary.valid} valid, ${validation.summary.invalid} invalid out of ${validation.summary.total} rows`
          );

          let insertedCount = 0;
          if (validation.validRows.length > 0) {
            const recordsWithUserId = validation.validRows.map((record) => ({
              ...record,
              userId: req.user?.userId || "unknown",
            }));

            const createResult = await prisma.record.createMany({
              data: recordsWithUserId,
            });
            insertedCount = createResult.count;

            logger.info(
              `Inserted ${insertedCount} records for user ${
                req.user?.userId || "unknown"
              }`
            );
          }

          fs.unlink(filePath, (err) => {
            if (err) logger.error(`Error deleting file: ${err.message}`);
          });

          res.json({
            success: true,
            summary: {
              totalRows: validation.summary.total,
              validRows: validation.summary.valid,
              invalidRows: validation.summary.invalid,
              insertedRecords: insertedCount,
            },
            invalidRows: validation.invalidRows,
            message: `Successfully processed ${insertedCount} records`,
          });
        } catch (error) {
          logger.error(`Error processing CSV: ${error.message}`);

          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) logger.error(`Error deleting file: ${err.message}`);
            });
          }

          res.status(500).json({
            success: false,
            error: "Error processing CSV file",
            details: error.message,
          });
        }
      })
      .on("error", (error) => {
        logger.error(`Error reading CSV file: ${error.message}`);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(500).json({
          success: false,
          error: "Error reading CSV file",
          details: error.message,
        });
      });
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Upload failed",
      details: error.message,
    });
  }
};

module.exports = {
  upload: upload.single("csvFile"),
  uploadCSV,
};
