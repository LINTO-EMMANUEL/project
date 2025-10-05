import express from "express";
import VehicleRecord from "../models/vehicleRecord.js";

const router = express.Router();

// Add new record
router.post("/", async (req, res) => {
  try {
    const { vehicleType, vehicleClass, confidence, slotNumber } = req.body;

    const record = new VehicleRecord({
      vehicleType,
      vehicleClass,
      confidence,
      slotNumber,
      entryTime: new Date(),
      status: "active",
    });

    await record.save();
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error("Error creating vehicle record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle record",
    });
  }
});

// ======================== GET ALL RECORDS ========================
router.get("/", async (req, res) => {
  try {
    const records = await VehicleRecord.find().sort({ entryTime: -1 });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch records",
    });
  }
});

// ======================== UPDATE RECORD ========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { exitTime } = req.body;

  try {
    const record = await VehicleRecord.findById(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    record.exitTime = exitTime;
    record.status = "inactive"; // Mark as inactive on exit
    await record.save();

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update record",
    });
  }
});

// ======================== DELETE RECORD ========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const record = await VehicleRecord.findById(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    await record.remove();
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete record",
    });
  }
});

export default router;
