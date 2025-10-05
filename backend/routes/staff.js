import express from "express";
import Staff from "../models/staff.js";

const router = express.Router();

// Middleware to prevent caching
const preventCaching = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

// Apply prevent caching middleware to all routes
router.use(preventCaching);

// Get all staff members
router.get("/", async (req, res) => {
  try {
    const staffMembers = await Staff.find()
      .populate("login", "email status role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      staff: staffMembers,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff data",
    });
  }
});

// Get staff by login ID
router.get("/:loginId", async (req, res) => {
  try {
    const staff = await Staff.findOne({ login: req.params.loginId }).populate(
      "login",
      "email status role"
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    res.json({
      success: true,
      staff: staff,
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
