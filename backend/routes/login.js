import express from "express";
import mongoose from "mongoose";
const router = express.Router();

// Models import
import Login from "../models/login.js";
import User from "../models/user.js";
import Staff from "../models/staff.js";

// ======================== USER LOGIN ========================
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await Login.findOne({ email });
    console.log("Found user:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Simple password comparison (consider using bcrypt in production)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let extraData = {};

    // If it's a staff member, get their staff details
    if (user.role === "staff") {
      const staffDetails = await Staff.findOne({ login: user._id });
      if (staffDetails) {
        extraData = {
          name: staffDetails.name,
          staffId: staffDetails._id,
        };
      }
    }

    // Admin can always log in
    if (user.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: "approved",
        },
      });
    }

    // Check approval status for non-admin users
    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        ...extraData, // Include any extra data like staffId
      },
    });
  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ======================== SIMPLE REGISTRATION ========================
router.post("/register", async (req, res) => {
  const { email, password, role = "user", status = "active" } = req.body;
  try {
    const exists = await Login.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const user = new Login({ email, password, role, status });
    await user.save();
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================== USER REGISTRATION WITH VEHICLE ========================
router.post("/register/user", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, name, vehicleNumber, vehicleType, phone_no } =
      req.body;

    const exists = await Login.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const login = new Login({
      email,
      password,
      role: "user",
      status: "pending",
    });
    await login.save({ session });

    const user = new User({
      name,
      vehicleNumber,
      vehicleType,
      phone_no,
      status: "pending",
      login: login._id, // ✅ consistent field name
    });
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please login.",
      redirectUrl: "/login",
      user,
      login,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
});

// ======================== STAFF REGISTRATION ========================
router.post("/register/staff", async (req, res) => {
  const { email, password, name, address, phone_no, qualification } = req.body;
  try {
    const exists = await Login.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const login = new Login({
      email,
      password,
      role: "staff",
      status: "pending",
    });
    await login.save();

    const staff = new Staff({
      login: login._id, // ✅ changed log_id -> login
      name,
      address,
      phone_no,
      qualification,
      status: "pending",
    });
    await staff.save();

    res.status(201).json({
      success: true,
      message: "Staff registered successfully. Please login.",
      redirectUrl: "/login",
      staff,
      login,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ======================== GET ALL USERS ========================
router.get("/", async (req, res) => {
  try {
    const users = await Login.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================== UPDATE USER STATUS ========================
router.put("/status/:id", async (req, res) => {
  try {
    let { id } = req.params;
    const { status } = req.body;

    console.log(`Processing status update for ID ${id} to: ${status}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Try finding directly in Login first
    let login = await Login.findById(id);

    // If not found, maybe frontend sent User._id -> try lookup
    if (!login) {
      const userDoc = await User.findById(id);
      if (userDoc) {
        login = await Login.findById(userDoc.login);
        id = userDoc.login; // reassign to correct login id
      }
    }

    // If still not found, maybe staff._id was sent
    if (!login) {
      const staffDoc = await Staff.findById(id);
      if (staffDoc) {
        login = await Login.findById(staffDoc.login);
        id = staffDoc.login;
      }
    }

    if (!login) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update login status
    login.status = status;
    await login.save();

    // Also update related User/Staff document
    if (login.role === "user") {
      await User.findOneAndUpdate({ login: id }, { status });
    } else if (login.role === "staff") {
      await Staff.findOneAndUpdate({ login: id }, { status });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        _id: login._id,
        email: login.email,
        role: login.role,
        status: login.status,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
});

// ======================== DELETE USER ========================
// Delete user endpoint with transaction support
router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Find the login first
    const login = await Login.findById(id).session(session);
    if (!login) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Login not found",
      });
    }

    // Delete associated user or staff based on role
    if (login.role === "user") {
      await User.findOneAndDelete({ login: id }).session(session);
    } else if (login.role === "staff") {
      await Staff.findOneAndDelete({ login: id }).session(session);
    }

    // Delete the login
    await Login.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

// Export the router only once
export default router;
