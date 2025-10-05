import express from "express";
import User from "../models/user.js";
import Login from "../models/login.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/register/user", async (req, res) => {
  try {
    const { name, vehicleNumber, vehicleType, phone_no, email, password } =
      req.body;

    // First create login entry
    const loginData = new Login({
      email,
      password,
      role: "user",
      status: "pending",
    });
    const savedLogin = await loginData.save();

    // Then create user with login reference
    const userData = new User({
      name,
      vehicleNumber,
      vehicleType,
      phone_no,
      status: "pending",
      login: savedLogin._id,
    });
    const savedUser = await userData.save();

    res.status(201).json({
      message: "User registered successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // If login was created but user creation failed, cleanup the login
    if (error.code === 11000) {
      try {
        // Delete the login if it was created
        if (error._message === "User validation failed") {
          await Login.findOneAndDelete({ email: req.body.email });
        }
        return res.status(400).json({
          message: error.keyPattern?.email
            ? "Email already exists"
            : "Vehicle number already exists",
        });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      message: error.message || "Registration failed",
    });
  }
});

// Get user by login ID
router.get("/:loginId", async (req, res) => {
  try {
    const user = await User.findOne({ login: req.params.loginId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().populate("login");

    res.json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Add user status update endpoint
router.put("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating user ${id} status to ${status}`);

    // First update the login status
    const login = await Login.findByIdAndUpdate(id, { status }, { new: true });

    if (!login) {
      return res.status(404).json({
        success: false,
        message: "User login not found",
      });
    }

    // Then update the user status
    const user = await User.findOneAndUpdate(
      { login: id },
      { status },
      { new: true }
    );

    if (!user) {
      console.log(
        `User details not found for login ID ${id}, but login updated`
      );
    } else {
      console.log(`Updated user ${user.name} status to ${status}`);
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: login,
    });
  } catch (error) {
    console.error(`Error updating user status:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user status",
      error: error.message,
    });
  }
});

export default router;
