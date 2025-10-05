import React, { useEffect, useState } from "react";
import "../styles/admin-dashboard.css";
import AdminNavbar from "../components/AdminNavbar";
import { useNavigate } from "react-router-dom";

// --- Reusable Components ---

const StatCard = ({ title, value, change, isPositive }) => (
  <div className="stat-card">
    <p className="stat-title">{title}</p>
    <p className="stat-value">{value}</p>
    <p className={`stat-change ${isPositive ? "positive" : "negative"}`}>
      {change}
    </p>
  </div>
);

const LineChart = () => (
  <div className="chart-placeholder">
    {/* This is a simplified SVG to mimic the line chart's appearance */}
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="line-chart-svg"
    >
      <path d="M 0 25 C 10 10, 20 15, 30 30 S 50 10, 60 20 S 80 35, 90 25, 100 20" />
    </svg>
    <div className="chart-labels">
      <span>Week 1</span>
      <span>Week 2</span>
      <span>Week 3</span>
      <span>Week 4</span>
    </div>
  </div>
);

const BarChart = () => (
  <div className="chart-placeholder">
    <div className="bar-chart-container">
      <div className="bar" style={{ height: "60%" }}></div>
      <div className="bar" style={{ height: "75%" }}></div>
      <div className="bar" style={{ height: "90%" }}></div>
    </div>
    <div className="chart-labels">
      <span>Location A</span>
      <span>Location B</span>
      <span>Location C</span>
    </div>
  </div>
);

// --- Main Content Area ---

const MainContent = () => {
  return (
    <main className="main-content">
      <header className="main-header">
        <h1>Dashboard Overview</h1>
        <p>Monitor key metrics and manage your parking system effectively.</p>
      </header>

      <section className="stats-grid">
        <StatCard
          title="Total Parking Sessions"
          value="12,345"
          change="+10%"
          isPositive={true}
        />
        <StatCard
          title="Total Revenue"
          value="$56,789"
          change="+15%"
          isPositive={true}
        />
        <StatCard
          title="Average Occupancy Rate"
          value="75%"
          change="-5%"
          isPositive={false}
        />
        <StatCard
          title="Active Users"
          value="250"
          change="+8%"
          isPositive={true}
        />
      </section>

      <h2 className="section-title">Parking Sessions</h2>
      <section className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <p className="chart-title">Parking Sessions Over Time</p>
            <p className="chart-value">1,234</p>
            <p className="chart-change">
              Last 30 Days <span className="positive">+5%</span>
            </p>
          </div>
          <LineChart />
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <p className="chart-title">Parking Sessions by Location</p>
            <p className="chart-value">567</p>
            <p className="chart-change">
              Last 30 Days <span className="negative">-2%</span>
            </p>
          </div>
          <BarChart />
        </div>
      </section>

      <h2 className="section-title">Recent Activities</h2>
      <section className="activities-table-container">
        <table className="activities-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sophia Turner</td>
              <td>Booked parking session at Location A</td>
              <td>2024-01-15 10:00 AM</td>
            </tr>
            {/* Add more activity rows here */}
          </tbody>
        </table>
      </section>
    </main>
  );
};

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const preventBack = () => {
      if (localStorage.getItem("isAdminLoggedIn") !== "true") {
        window.location.replace("/login");
        return;
      }
    };

    // Check on mount
    preventBack();

    // Handle page visibility change
    document.addEventListener("visibilitychange", preventBack);

    // Handle page show (back/forward cache)
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        preventBack();
      }
    });

    // Prevent back button
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", () => {
      window.history.pushState(null, "", window.location.pathname);
      preventBack();
    });

    // Handle storage changes (if logged out in another tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "isAdminLoggedIn" && e.newValue !== "true") {
        window.location.replace("/login");
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", preventBack);
      window.removeEventListener("pageshow", preventBack);
      window.removeEventListener("popstate", preventBack);
      window.removeEventListener("storage", preventBack);
    };
  }, []);

  // Callback function to update parent component when sidebar collapses
  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  useEffect(() => {
    const checkAuth = () => {
      if (localStorage.getItem("isAdminLoggedIn") !== "true") {
        window.location.replace("/login");
        return false;
      }
      return true;
    };

    // Initial auth check
    if (!checkAuth()) return;

    // Prevent caching
    if (
      window.performance &&
      window.performance.navigation.type ===
        window.performance.navigation.TYPE_BACK_FORWARD
    ) {
      checkAuth();
    }

    // Disable browser caching for this page
    window.onpageshow = function (event) {
      if (event.persisted) {
        checkAuth();
      }
    };

    // Prevent back navigation
    history.pushState(null, "", window.location.href);

    const onPopState = () => {
      history.pushState(null, "", window.location.href);
      checkAuth();
    };

    window.addEventListener("popstate", onPopState);

    // Clear any page cache when component unmounts
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (!localStorage.getItem("isAdminLoggedIn")) {
        window.location.replace("/login");
      }
    };
  }, []);

  return (
    <div
      className="admin-dashboard-root"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <AdminNavbar onToggle={handleSidebarToggle} />
      <div
        className="content-wrapper"
        style={{
          marginTop: "60px", // Add margin to account for the Navbar height
          marginLeft: sidebarCollapsed ? "80px" : "260px",
          transition: "margin-left 0.3s ease",
          width: "calc(100% - " + (sidebarCollapsed ? "80px" : "260px") + ")",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <MainContent />
      </div>
    </div>
  );
};

export default AdminDashboard;
