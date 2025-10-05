import { useEffect, useState } from "react";
import UserNavbar from "../components/UserNavbar";
import "../styles/user-wallet.css"; // <-- Ensure your wallet CSS is imported

const SIDEBAR_WIDTH = 240;

const UserWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [amount, setAmount] = useState(""); // Add this state for custom amount

  const userId = localStorage.getItem("userId") || "12345"; // Use logged-in user's ID if available

  // Ensure Razorpay script is loaded before using window.Razorpay
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch wallet data on load
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!userId) {
        setApiError("User ID not found. Please log in again.");
        return;
      }

      try {
        console.log("Fetching wallet data for user:", userId);
        const res = await fetch("http://localhost:5000/api/wallet/" + userId);

        // Log the raw response for debugging
        console.log("Wallet API Response:", {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
        });

        let data;
        try {
          data = await res.json();
          console.log("Wallet API Data:", data);
        } catch (parseError) {
          console.error("Failed to parse wallet response:", parseError);
          throw new Error("Invalid response from server");
        }

        if (!res.ok) {
          throw new Error(data?.error || `Server error: ${res.status}`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setBalance(data?.balance ?? 0);
        setTransactions(
          Array.isArray(data?.transactions) ? data.transactions : []
        );
        setApiError(null);
      } catch (error) {
        console.error("Wallet fetch error:", error);
        setApiError(
          error.message === "Failed to fetch"
            ? "Could not connect to the server. Please check your internet connection."
            : error.message || "Failed to fetch wallet data"
        );
        setBalance(0);
        setTransactions([]);
      }
    };

    fetchWalletData();
  }, []);

  // Handle Razorpay Payment
  const handleAddBalance = async () => {
    if (!amount || isNaN(amount) || Number(amount) < 1) {
      setApiError("Please enter a valid amount greater than ₹0");
      return;
    }

    try {
      setApiError(null);
      console.log("Creating order for amount:", amount);

      // Create order
      const orderRes = await fetch(
        "http://localhost:5000/api/wallet/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, userId }),
        }
      );

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const order = await orderRes.json();
      console.log("Order created:", order);

      // Initialize Razorpay payment
      const options = {
        key: "rzp_test_RAfJcsI6Bk73Sh",
        amount: order.amount,
        currency: order.currency,
        name: "Smart Park",
        description: "Wallet Recharge",
        order_id: order.id,
        handler: async (response) => {
          try {
            // On successful payment
            const verifyRes = await fetch(
              "http://localhost:5000/api/wallet/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  amount,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            const data = await verifyRes.json();
            setBalance(data.balance);
            setTransactions(data.transactions);
            setApiError(null);
          } catch (err) {
            console.error("Payment verification failed:", err);
            setApiError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        setApiError(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      setApiError(err.message || "Failed to setup payment");
    }
  };

  return (
    <div
      className="wallet-main-bg"
      style={{ display: "flex", minHeight: "100vh", background: "#b3d8e3ff" }}
    >
      {/* Sidebar column */}
      <div
        style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          flexShrink: 0,
          display: "flex",
          background: "#89d3e1ff",
        }}
      >
        <UserNavbar />
      </div>
      {/* Content column */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          background: "#192d43ff",
        }}
      >
        <div
          className="wallet-content bg-dark rounded shadow p-4"
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "2rem 0",
            background: "rgba(246, 237, 237, 1)2a",
            borderRadius: "15px",
          }}
        >
          <h1 className="wallet-title text-white" style={{ color: "white" }}>
            Wallet
          </h1>

          {apiError && (
            <div className="error-message">
              <p>{apiError}</p>
              <button
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="payment-methods-section mb-4">
            <h2>Payment Methods</h2>
            <div className="payment-method-card">
              <div className="upi-icon">UPI</div>
              <div>
                <p className="method-name">UPI</p>
                <p className="method-description">UPI Payment</p>
              </div>
            </div>
          </div>

          <div className="balance-section mb-4">
            <h2>Balance</h2>
            <div className="balance-card">
              <div>
                <p className="balance-label">Current Balance</p>
                <p className="balance-amount">₹{balance}</p>
              </div>
            </div>
            <div className="add-balance mt-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                placeholder="Enter amount"
                className="amount-input form-control d-inline-block w-auto me-2"
              />
              <button
                onClick={handleAddBalance}
                className="add-button btn btn-primary"
              >
                Add Balance
              </button>
            </div>
          </div>

          <div className="transactions-section">
            <h2>Transaction History</h2>
            <div className="table-responsive">
              <table className="transactions-table table table-dark table-striped">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell">Date</th>
                    <th className="table-cell">Amount</th>
                    <th className="table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    [...transactions].reverse().map((t, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-cell">
                          {t.date
                            ? new Date(t.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td
                          className={
                            t.type === "debit" ? "text-danger" : "text-success"
                          }
                        >
                          {t.type === "debit" ? "-" : "+"} ₹{t.amount}
                        </td>
                        <td className="table-cell">{t.description || "N/A"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        No transactions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWallet;
