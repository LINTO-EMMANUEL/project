import mongoose from "mongoose";

const vehicleRecordSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    enum: ["car", "truck", "bus", "motorcycle"],
  },
  vehicleClass: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  slotNumber: {
    type: String,
  },
  entryTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  exitTime: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
  imageUrl: {
    type: String,
  },
});

export default mongoose.model("VehicleRecord", vehicleRecordSchema);
