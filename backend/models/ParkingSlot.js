import mongoose from "mongoose";

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true,
  },
  direction: {
    type: String,
    required: true,
  },
  slotType: {
    type: String,
    enum: ["2-wheeler", "4-wheeler"],
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "occupied", "maintenance"],
    default: "available",
  },
  currentVehicle: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ParkingSlot", parkingSlotSchema);
