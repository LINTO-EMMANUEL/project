import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import models
import PlateRecord from "../models/PlateRecord.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype.startsWith("image/") &&
      file.mimetype !== "application/octet-stream"
    ) {
      return cb(new Error("Invalid file type. Only images are allowed"), false);
    }
    cb(null, true);
  },
});

/**
 * Utility function to run Python license plate detection script
 */
async function runLicensePlateDetection(
  imagePath,
  confidence = 0.25,
  ocr = true
) {
  // Default timeout for license plate scripts (60s)
  const SCRIPT_TIMEOUT = 60_000;
  return new Promise((resolve, reject) => {
    const scriptPath = ocr
      ? path.join(__dirname, "../ml/license_plate_full_service.py")
      : path.join(__dirname, "../ml/detect_license_plate.py");

    const args = [scriptPath, imagePath, confidence.toString()];
    if (ocr) {
      args.push("auto"); // OCR method
    }

    const pythonProcess = spawn("python", args);

    let output = "";
    let error = "";
    let resultStarted = false;
    let resultJson = "";
    let timer = null;

    // start timeout
    timer = setTimeout(() => {
      try {
        if (!pythonProcess.killed) pythonProcess.kill("SIGTERM");
      } catch (e) {}
      reject(
        new Error(`License plate script timed out after ${SCRIPT_TIMEOUT}ms`)
      );
    }, SCRIPT_TIMEOUT);

    pythonProcess.stdout.on("data", (data) => {
      const dataStr = data.toString();

      if (dataStr.includes("RESULT_START")) {
        resultStarted = true;
        return;
      }

      if (dataStr.includes("RESULT_END")) {
        resultStarted = false;
        try {
          if (timer) clearTimeout(timer);
          const result = JSON.parse(resultJson);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse result: ${parseError.message}`));
        }
        return;
      }

      if (resultStarted) {
        resultJson += dataStr;
      } else {
        output += dataStr;
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
      console.error(`[License Plate] Python stderr:`, data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (timer) clearTimeout(timer);
      console.log(`[License Plate] Process exited with code: ${code}`);
      if (code !== 0 && !resultJson) {
        console.error(`[License Plate] Full stderr:`, error);
        console.error(`[License Plate] Full stdout:`, output);
        reject(
          new Error(
            `Detection script failed with code ${code}: ${error || output}`
          )
        );
      }
    });

    pythonProcess.on("error", (err) => {
      if (timer) clearTimeout(timer);
      console.error(`[License Plate] Process error:`, err);
      reject(new Error(`Failed to start detection process: ${err.message}`));
    });
  });
}

/**
 * Utility function to run detection and cropping (like show_detected_plate.py)
 */
async function runDetectionAndCropping(imagePath, confidence = 0.25) {
  // Default timeout for cropping script
  const SCRIPT_TIMEOUT = 60_000;
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../ml/detect_and_crop_service.py");
    const args = [scriptPath, imagePath, confidence.toString()];

    console.log(`[License Plate] Running: python ${args.join(" ")}`);
    console.log(
      `[License Plate] Image path exists: ${fsSync.existsSync(imagePath)}`
    );

    // Set working directory to backend folder where the script expects to run
    const options = {
      cwd: path.join(__dirname, ".."),
    };

    const pythonProcess = spawn("python", args, options);

    let output = "";
    let error = "";
    let resultStarted = false;
    let resultJson = "";
    let timer = null;

    // start timeout
    timer = setTimeout(() => {
      try {
        if (!pythonProcess.killed) pythonProcess.kill("SIGTERM");
      } catch (e) {}
      reject(new Error(`Cropping script timed out after ${SCRIPT_TIMEOUT}ms`));
    }, SCRIPT_TIMEOUT);

    pythonProcess.stdout.on("data", (data) => {
      const dataStr = data.toString();

      if (dataStr.includes("RESULT_START")) {
        resultStarted = true;
        return;
      }

      if (dataStr.includes("RESULT_END")) {
        resultStarted = false;
        try {
          if (timer) clearTimeout(timer);
          const result = JSON.parse(resultJson);
          resolve(result);
        } catch (parseError) {
          console.error(`[License Plate] Parse error:`, parseError);
          reject(
            new Error(`Failed to parse cropping result: ${parseError.message}`)
          );
        }
        return;
      }

      if (resultStarted) {
        resultJson += dataStr;
      } else {
        output += dataStr;
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
      console.error(`[License Plate] Python stderr:`, data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (timer) clearTimeout(timer);
      console.log(`[License Plate] Process exited with code: ${code}`);
      if (code !== 0 && !resultJson) {
        console.error(`[License Plate] Full stderr:`, error);
        console.error(`[License Plate] Full stdout:`, output);
        reject(
          new Error(
            `Detection and cropping script failed with code ${code}: ${
              error || output
            }`
          )
        );
      }
    });

    pythonProcess.on("error", (err) => {
      if (timer) clearTimeout(timer);
      console.error(`[License Plate] Process error:`, err);
      reject(
        new Error(
          `Failed to start detection and cropping process: ${err.message}`
        )
      );
    });
  });
}

/**
 * Save image buffer to temporary file
 */
async function saveImageToTemp(buffer, originalname = "image.jpg") {
  const tempDir = path.join(__dirname, "../temp");

  // Ensure temp directory exists
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const timestamp = Date.now();
  const fileName = `temp_${timestamp}_${originalname}`;
  const filePath = path.join(tempDir, fileName);

  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Clean up temporary file
 */
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
  }
}

/**
 * @route GET /api/license-plate/records
 * @description Get all license plate records
 */
router.get("/records", async (req, res) => {
  try {
    const { limit = 100, offset = 0, status } = req.query;

    const query = status ? { status } : {};
    const records = await PlateRecord.find(query)
      .sort({ detectionTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await PlateRecord.countDocuments(query);

    res.json({
      success: true,
      records,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching license plate records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch license plate records",
    });
  }
});

/**
 * @route POST /api/license-plate/detect
 * @description Detect license plates in an image (detection only)
 */
router.post("/detect", upload.single("image"), async (req, res) => {
  let tempImagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Get confidence threshold from request
    const confidence = parseFloat(req.body.confidence) || 0.25;

    let buffer = req.file.buffer;
    if (req.body.isBase64) {
      buffer = Buffer.from(req.file.buffer.toString(), "base64");
    }

    // Save image to temporary file
    tempImagePath = await saveImageToTemp(buffer, req.file.originalname);

    // Run license plate detection (without OCR)
    const result = await runLicensePlateDetection(
      tempImagePath,
      confidence,
      false
    );

    // Add metadata
    result.processing_info = {
      confidence_threshold: confidence,
      image_size: buffer.length,
      processing_time: new Date().toISOString(),
    };

    res.json(result);
  } catch (error) {
    console.error("License plate detection error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to detect license plates",
    });
  } finally {
    // Cleanup temporary file
    if (tempImagePath) {
      await cleanupTempFile(tempImagePath);
    }
  }
});

/**
 * @route POST /api/license-plate/detect-and-crop
 * @description Detect license plates, annotate image, and crop license plates
 */
router.post("/detect-and-crop", upload.single("image"), async (req, res) => {
  let tempImagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Get confidence threshold from request
    const confidence = parseFloat(req.body.confidence) || 0.25;

    let buffer = req.file.buffer;
    if (req.body.isBase64) {
      buffer = Buffer.from(req.file.buffer.toString(), "base64");
    }

    // Save image to temporary file
    tempImagePath = await saveImageToTemp(buffer, req.file.originalname);
    console.log(`[License Plate] Saved temp image to: ${tempImagePath}`);

    // Run detection and cropping using our Python script
    const result = await runDetectionAndCropping(tempImagePath, confidence);

    // Add metadata
    result.processing_info = {
      confidence_threshold: confidence,
      image_size: buffer.length,
      processing_time: new Date().toISOString(),
    };

    res.json(result);

    // Cleanup temp file after response is sent
    setTimeout(async () => {
      await cleanupTempFile(tempImagePath);
    }, 1000);
  } catch (error) {
    console.error("License plate detection and cropping error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to detect and crop license plates",
    });

    // Cleanup on error
    if (tempImagePath) {
      await cleanupTempFile(tempImagePath);
    }
  }
});

/**
 * @route POST /api/license-plate/detect-with-ocr
 * @description Detect license plates and extract text using OCR
 */
router.post("/detect-with-ocr", upload.single("image"), async (req, res) => {
  let tempImagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Get parameters from request
    const confidence = parseFloat(req.body.confidence) || 0.25;
    const ocrMethod = req.body.ocrMethod || "auto";
    const saveRecord = req.body.saveRecord !== "false"; // Default to true

    let buffer = req.file.buffer;
    if (req.body.isBase64) {
      buffer = Buffer.from(req.file.buffer.toString(), "base64");
    }

    // Save image to temporary file
    tempImagePath = await saveImageToTemp(buffer, req.file.originalname);

    // Run license plate detection with OCR
    const result = await runLicensePlateDetection(
      tempImagePath,
      confidence,
      true
    );

    // Add metadata
    result.processing_info = {
      confidence_threshold: confidence,
      ocr_method: ocrMethod,
      image_size: buffer.length,
      processing_time: new Date().toISOString(),
    };

    // Save successful detections to database if requested
    if (
      saveRecord &&
      result.success &&
      result.best_results &&
      result.best_results.length > 0
    ) {
      try {
        const savedRecords = [];

        for (const plate of result.best_results) {
          const plateRecord = new PlateRecord({
            licensePlateText: plate.license_plate_text,
            detectionConfidence: plate.detection_confidence,
            ocrConfidence: plate.ocr_confidence,
            detectionTime: new Date(),
            bbox: plate.bbox,
            status: "detected",
            metadata: {
              ocr_method: ocrMethod,
              confidence_threshold: confidence,
              image_size: buffer.length,
            },
          });

          const saved = await plateRecord.save();
          savedRecords.push(saved);
        }

        result.saved_records = savedRecords;
      } catch (dbError) {
        console.warn("Failed to save plate records to database:", dbError);
        result.database_warning = "Failed to save records to database";
      }
    }

    res.json(result);
  } catch (error) {
    console.error("License plate detection with OCR error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to detect and read license plates",
    });
  } finally {
    // Cleanup temporary file
    if (tempImagePath) {
      await cleanupTempFile(tempImagePath);
    }
  }
});

/**
 * @route POST /api/license-plate/save-record
 * @description Manually save a license plate record
 */
router.post("/save-record", async (req, res) => {
  try {
    const {
      licensePlateText,
      detectionConfidence,
      ocrConfidence,
      bbox,
      metadata,
    } = req.body;

    if (!licensePlateText) {
      return res.status(400).json({
        success: false,
        message: "License plate text is required",
      });
    }

    const record = new PlateRecord({
      licensePlateText,
      detectionConfidence: detectionConfidence || 0,
      ocrConfidence: ocrConfidence || 0,
      detectionTime: new Date(),
      bbox: bbox || {},
      status: "manual",
      metadata: metadata || {},
    });

    const savedRecord = await record.save();

    res.status(201).json({
      success: true,
      record: savedRecord,
    });
  } catch (error) {
    console.error("Error saving license plate record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save license plate record",
    });
  }
});

/**
 * @route PUT /api/license-plate/records/:id
 * @description Update a license plate record
 */
router.put("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const record = await PlateRecord.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "License plate record not found",
      });
    }

    res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("Error updating license plate record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update license plate record",
    });
  }
});

/**
 * @route DELETE /api/license-plate/records/:id
 * @description Delete a license plate record
 */
router.delete("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PlateRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "License plate record not found",
      });
    }

    res.json({
      success: true,
      message: "License plate record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting license plate record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete license plate record",
    });
  }
});

/**
 * @route GET /api/license-plate/search
 * @description Search license plate records by text
 */
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Search for license plates containing the query text
    const records = await PlateRecord.find({
      licensePlateText: { $regex: q, $options: "i" },
    })
      .sort({ detectionTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      query: q,
      results: records.length,
      records,
    });
  } catch (error) {
    console.error("Error searching license plate records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search license plate records",
    });
  }
});

export default router;
