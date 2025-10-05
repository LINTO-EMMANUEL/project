import express from "express";
import ParkingSlot from "../models/ParkingSlot.js";

const router = express.Router();

// Get parking slot statistics
router.get("/stats", async (req, res) => {
  try {
    // Get all slots to ensure accurate counting
    const allSlots = await ParkingSlot.find();

    // Count slots by their status
    const totalSlots = allSlots.length;
    const available = allSlots.filter(
      (slot) => slot.status === "available"
    ).length;
    const occupied = allSlots.filter(
      (slot) => slot.status === "occupied"
    ).length;
    const maintenance = allSlots.filter(
      (slot) => slot.status === "maintenance"
    ).length;

    // Log for debugging
    console.log("Total slots:", totalSlots);
    console.log("Slots by status:", {
      available,
      occupied,
      maintenance,
    });
    console.log(
      "All slots:",
      allSlots.map((slot) => ({
        number: slot.slotNumber,
        status: slot.status,
      }))
    );

    // Get count by vehicle type
    const twoWheelers = await ParkingSlot.countDocuments({
      slotType: "2-wheeler",
    });
    const fourWheelers = await ParkingSlot.countDocuments({
      slotType: "4-wheeler",
    });

    res.json({
      total: totalSlots,
      byStatus: {
        available,
        occupied,
        maintenance,
      },
      byType: {
        twoWheelers,
        fourWheelers,
      },
    });
  } catch (err) {
    console.error("Error fetching parking slot statistics:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch parking slot statistics" });
  }
});

// Get all slots
router.get("/", async (req, res) => {
  try {
    const slots = await ParkingSlot.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec();

    res.json({
      success: true,
      slots: slots.map((slot) => ({
        id: slot.slotNumber,
        location: slot.direction, // Use direction as location
        slotType: slot.slotType,
        direction: slot.direction,
        status: slot.status,
        vehicleId: slot.currentVehicle,
        createdAt: slot.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch slots",
    });
  }
});

// Get all available locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await ParkingSlot.distinct("location");
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
    });
  }
});

// Add new slot
router.post("/", async (req, res) => {
  try {
    const { slotNumber, slotType, direction, status } = req.body;

    // Validate required fields
    if (!slotNumber || !slotType || !direction) {
      return res.status(400).json({
        success: false,
        message: "Slot Number, Slot Type, and Direction are required fields",
      });
    }

    // Check if slot number already exists
    const existingSlot = await ParkingSlot.findOne({ slotNumber });
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: "A slot with this number already exists",
      });
    }

    const slot = new ParkingSlot({
      slotNumber,
      slotType,
      direction,
      status: status || "available",
    });

    await slot.save();
    res.status(201).json({ success: true, slot });
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(500).json({
      success: false,
      message: `Failed to create slot: ${error.message}`,
      error: error.message,
    });
  }
});

// Delete a slot
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await ParkingSlot.findOneAndDelete({ slotNumber: id });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    res.json({
      success: true,
      message: "Parking slot deleted successfully",
    });
  } catch (error) {
    console.error("Delete slot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete parking slot",
    });
  }
});

// Update parking slot
router.put("/:slotNumber", async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const updateData = req.body;

    const slot = await ParkingSlot.findOneAndUpdate(
      { slotNumber: slotNumber },
      updateData,
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    res.json({
      success: true,
      slot: slot,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parking slot",
    });
  }
});

export default router;
