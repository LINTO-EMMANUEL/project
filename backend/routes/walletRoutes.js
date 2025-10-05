import express from "express";
import Razorpay from "razorpay";
import Wallet from "../models/Wallet.js";

const router = express.Router();

// Use Razorpay test keys for test mode
const razorpay = new Razorpay({
  key_id: "rzp_test_RAfJcsI6Bk73Sh",
  key_secret: "H1wRI448reVeGvgzPkseSd1N",
});

// Get wallet by userId (string)
router.get("/:userId", async (req, res) => {
  try {
    if (!req.params.userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const wallet = await Wallet.findOne({ userId: req.params.userId });
    if (!wallet) {
      // Create wallet if not found
      try {
        const newWallet = new Wallet({
          userId: req.params.userId,
          balance: 0,
          transactions: [],
        });
        await newWallet.save();
        console.log("Created new wallet for user:", req.params.userId);
        return res.json(newWallet);
      } catch (createErr) {
        console.error("Error creating wallet:", createErr);
        return res.status(500).json({ error: "Failed to create wallet" });
      }
    }
    res.json(wallet);
  } catch (err) {
    console.error("Error in wallet route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add balance (demo, not real payment)
router.post("/add", async (req, res) => {
  const { userId, amount } = req.body;
  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, transactions: [] });
    }
    wallet.balance += amount;
    wallet.transactions.push({
      amount,
      type: "credit",
      description: "Added via demo",
    });
    await wallet.save();
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ balance: 0, transactions: [] });
  }
});

// Create order endpoint
router.post("/create-order", async (req, res) => {
  const { amount, userId } = req.body;
  try {
    if (!amount || !userId) {
      return res.status(400).json({ error: "Missing amount or userId" });
    }

    console.log("Creating Razorpay order with:", {
      amount,
      userId,
      key_id: razorpay.key_id,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in paisa, must be integer
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      throw new Error("Failed to create Razorpay order");
    }

    console.log("Order created successfully:", order);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({
      error: "Failed to create order",
      details: err.message,
    });
  }
});

// Verify payment endpoint
router.post("/verify", async (req, res) => {
  const {
    userId,
    amount,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, transactions: [] });
    }

    // Convert amount to number and add to existing balance
    const numericAmount = Number(amount);
    wallet.balance = Number(wallet.balance) + numericAmount;

    wallet.transactions.push({
      amount: numericAmount,
      type: "credit",
      description: `Added via Razorpay (${razorpay_payment_id})`,
      date: new Date(),
    });

    await wallet.save();
    res.json(wallet);
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
