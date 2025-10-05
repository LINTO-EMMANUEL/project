import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: Number,
  type: { type: String, enum: ["credit", "debit"], required: true },
  description: String,
});

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Use String for userId to match frontend
  balance: { type: Number, default: 0 },
  transactions: [transactionSchema],
});

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
