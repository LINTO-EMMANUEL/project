import mongoose from "mongoose";

const getISTTime = () => {
  const date = new Date();
  // Convert to IST (UTC+5:30)
  return new Date(date.getTime() + 330 * 60000); // Adding 5:30 hours in milliseconds
};

const plateRecordSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    entryTime: {
      type: Date,
      default: getISTTime,
      required: true,
      index: true,
      get: function (date) {
        if (!date) return null;
        const istDate = new Date(date.getTime() + 330 * 60000);
        return istDate.toISOString();
      },
    },
    exitTime: {
      type: Date,
      default: null,
      get: function (date) {
        if (!date) return null;
        const istDate = new Date(date.getTime() + 330 * 60000);
        return istDate.toISOString();
      },
    },
  },
  {
    toJSON: { getters: true },
  }
);

export default mongoose.model("PlateRecord", plateRecordSchema);
