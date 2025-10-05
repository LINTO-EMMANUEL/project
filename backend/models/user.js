import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      unique: true,
    },
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: ["2-wheeler", "4-wheeler"], // Only allow 2-wheeler or 4-wheeler
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"], // Status validation
      default: "pending",
    },
    login: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Login", // Reference to the Login table
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Add index on login reference
UserSchema.index({ login: 1 });

/**
 * Registers a new user in the database.
 * @param {Object} userData - The user data to be saved.
 * @returns {Promise<Object>} - The saved user document.
 * @throws {Error} - If there is an error during registration.
 */
export const registerUser = async (userData) => {
  try {
    // Ensure the login ID exists in the Login table
    const Login = mongoose.model("Login");
    const loginExists = await Login.findById(userData.login);

    if (!loginExists) {
      throw new Error(
        "Invalid login ID. Please ensure the login entry exists."
      );
    }

    // Ensure the status in the Login table matches the user status
    if (loginExists.status !== userData.status) {
      throw new Error(
        `Status mismatch: Login status is '${loginExists.status}', but user status is '${userData.status}'.`
      );
    }

    // Log the user data for debugging
    console.log("Registering user with data:", userData);

    // Create and save the user
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    console.error("Error during user registration:", error.message);
    if (error.code === 11000) {
      // Handle duplicate key error (e.g., unique constraint violation)
      throw new Error(
        "Vehicle number already exists. Please use a unique vehicle number."
      );
    }
    throw new Error(`User registration failed: ${error.message}`);
  }
};

export default mongoose.model("User", UserSchema);
