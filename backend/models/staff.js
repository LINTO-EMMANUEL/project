import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    login: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Login", // Reference to the Login table
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone_no: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "staff",
  }
);

export default mongoose.model("Staff", StaffSchema);
