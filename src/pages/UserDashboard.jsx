import React, { useEffect } from "react";
import UserNavbar from "../components/UserNavbar";
import "../styles/userDashboard.css"; // Import CSS file

// ParkingCostsCard component
const ParkingCostsCard = () => {
  return (
    <div className="parking-card">
      <h2 className="parking-card-title">Monthly Parking Costs</h2>
      <div className="parking-card-inner">
        <h3 className="parking-subtitle">Parking Expenses</h3>
        <p className="parking-amount">$150</p>
        <p className="parking-change">This Month +10%</p>
        <div className="parking-bars">
          <div className="bar-container">
            <div className="bar h-12"></div>
            <span className="bar-label">Jan</span>
          </div>
          <div className="bar-container">
            <div className="bar h-6"></div>
            <span className="bar-label">Feb</span>
          </div>
          <div className="bar-container">
            <div className="bar h-20"></div>
            <span className="bar-label">Mar</span>
          </div>
          <div className="bar-container">
            <div className="bar h-14"></div>
            <span className="bar-label">Apr</span>
          </div>
          <div className="bar-container">
            <div className="bar h-12"></div>
            <span className="bar-label">May</span>
          </div>
          <div className="bar-container">
            <div className="bar h-16"></div>
            <span className="bar-label">Jun</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard component
const Dashboard = () => {
  const expenseHistory = [
    { month: "January", year: 2024, total: "$120" },
    { month: "February", year: 2024, total: "$130" },
    { month: "March", year: 2024, total: "$140" },
    { month: "April", year: 2024, total: "$150" },
    { month: "May", year: 2024, total: "$160" },
  ];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome back, Clara! Here’s a snapshot of your parking activity.
      </p>
      <ParkingCostsCard />
      <div className="expense-history">
        <h2 className="expense-history-title">Monthly Expense History</h2>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Year</th>
              <th>Total Expenses</th>
            </tr>
          </thead>
          <tbody>
            {expenseHistory.map((exp, index) => (
              <tr key={index}>
                <td>{exp.month}</td>
                <td>{exp.year}</td>
                <td>{exp.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// UserDashboard component
const UserDashboard = () => {
  useEffect(() => {
    history.pushState(null, document.title, window.location.href);

    const onPopState = () => {
      if (localStorage.getItem("isUserLoggedIn") === "true") {
        try {
          window.open("", "_self");
          window.close();
          setTimeout(() => {
            if (!window.closed) {
              window.location.href = "about:blank";
            }
          }, 300);
        } catch (err) {
          window.location.href = "about:blank";
        }
      } else {
        window.location.href = "/login";
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isUserLoggedIn");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  return (
    <div className="user-dashboard">
      <UserNavbar onLogout={handleLogout} />
      <Dashboard />
    </div>
  );
};

export default UserDashboard;
