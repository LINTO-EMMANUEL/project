import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import loginRoutes from "./routes/login.js";
import parkingSlotsRoutes from "./routes/parkingSlots.js";
import staffRoutes from "./routes/staff.js";
import userRoutes from "./routes/users.js";
import walletRoutes from "./routes/walletRoutes.js";
import vehicleDetectionRoutes from "./routes/vehicleDetection.js";
import licensePlateDetectionRoutes from "./routes/licensePlateDetection.js";
import os from "os";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Update CORS configuration to allow all origins in development
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://your-production-domain.com"]
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3000",
          "http://localhost:5000",
        ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
};

// Middleware configuration
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.options("*", cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(limiter);

// Optimized debug middleware
app.use((req, res, next) => {
  // Only log non-health check endpoints
  if (req.path !== "/health") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check - moved before other routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Configure multer for vehicle detection
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Mount login routes BEFORE other routes
app.use("/api/login", loginRoutes);

// Debug middleware for login requests
app.use((req, res, next) => {
  if (req.path.includes("/api/login")) {
    console.log("Login request:", {
      method: req.method,
      path: req.path,
      body: req.body,
    });
  }
  next();
});

// Routes
app.use("/api/parking-slots", parkingSlotsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);

// Use vehicle detection routes
app.use("/api/vehicle-detection", vehicleDetectionRoutes);

// Use license plate detection routes
app.use("/api/license-plate", licensePlateDetectionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Server error. Please try again later.",
  });
});

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    process.exit(1);
  }
};

// Initialize server only after DB connection
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, "0.0.0.0", () => {
    const addresses = Object.values(os.networkInterfaces())
      .flat()
      .filter((details) => details?.family === "IPv4" && !details.internal)
      .map((details) => details.address);

    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Network access:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    addresses.forEach((addr) =>
      console.log(`   Network: http://${addr}:${PORT}`)
    );
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });

  // Handle server errors
  server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
};

// Start server with error handling
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Handle process termination
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
