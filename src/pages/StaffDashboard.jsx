import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import StaffNavbar from "../components/StaffNavbar";
import "../styles/staffDashboard.css";
import { handleSecureLogout } from "../utils/authUtils";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [parkingStats, setParkingStats] = useState({
    available: 0,
    occupied: 0,
    maintenance: 0,
    total: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth check and prevent back navigation after logout
  useEffect(() => {
    const checkAuth = () => {
      const isStaffLoggedIn = localStorage.getItem("isStaffLoggedIn");
      const userRole = localStorage.getItem("userRole");
      const staffId = localStorage.getItem("staffId");

      if (isStaffLoggedIn !== "true" || userRole !== "staff" || !staffId) {
        console.log("Not logged in as staff, redirecting to login");
        localStorage.removeItem("isStaffLoggedIn");
        localStorage.removeItem("staffId");
        localStorage.removeItem("userRole");
        window.location.replace("/login");
        return false;
      }
      return true;
    };

    const initialCheck = checkAuth();
    if (!initialCheck) return;

    const preventCaching = () => {
      window.history.pushState(null, "", window.location.href);
      checkAuth();
    };

    window.addEventListener("popstate", preventCaching);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        preventCaching();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkAuth();
      }
    });

    window.addEventListener("storage", (e) => {
      if (e.key === "isStaffLoggedIn" && e.newValue !== "true") {
        window.location.replace("/login");
      }
    });

    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("popstate", preventCaching);
      document.removeEventListener("visibilitychange", checkAuth);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch parking slot statistics
        const statsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/parking-slots/stats`,
          {
            credentials: "include",
          }
        );
        if (!statsResponse.ok) throw new Error("Failed to fetch parking stats");
        const statsData = await statsResponse.json();
        setParkingStats({
          available: statsData.available || 0,
          occupied: statsData.occupied || 0,
          maintenance: statsData.maintenance || 0,
          total: statsData.total || 0,
        });

        // Fetch recent vehicle entries
        const entriesResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/vehicle-records?limit=5`,
          {
            credentials: "include",
          }
        );
        if (!entriesResponse.ok)
          throw new Error("Failed to fetch vehicle records");
        const entriesData = await entriesResponse.json();
        setRecentEntries(entriesData.records || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="staff-dashboard-container">
      <StaffNavbar onToggle={handleSidebarToggle} />

      <div
        className={`main-content ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="dashboard-header">
          <h1>Staff Portal</h1>
          <p>Manage parking operations efficiently</p>
        </div>

        {/* Parking Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon available">
              <span className="material-icons">local_parking</span>
            </div>
            <div className="stat-info">
              <h3>Available Slots</h3>
              <p className="stat-value">{parkingStats.available}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon occupied">
              <span className="material-icons">time_to_leave</span>
            </div>
            <div className="stat-info">
              <h3>Occupied Slots</h3>
              <p className="stat-value">{parkingStats.occupied}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon maintenance">
              <span className="material-icons">construction</span>
            </div>
            <div className="stat-info">
              <h3>In Maintenance</h3>
              <p className="stat-value">{parkingStats.maintenance}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total">
              <span className="material-icons">summarize</span>
            </div>
            <div className="stat-info">
              <h3>Total Slots</h3>
              <p className="stat-value">{parkingStats.total}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions and Staff Info */}
        <div className="dashboard-content">
          <div className="left-column">
            <div className="quick-actions card">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <Link to="/vehicle-entry" className="action-btn">
                  <span className="material-icons">directions_car</span>
                  <span>Manage Vehicle Records</span>
                </Link>
                <Link to="/slots" className="action-btn">
                  <span className="material-icons">local_parking</span>
                  <span>Manage Parking Slots</span>
                </Link>
                <Link to="/enhanced-camera-entry" className="action-btn">
                  <span className="material-icons">camera_alt</span>
                  <span>Camera Monitoring</span>
                </Link>
              </div>
            </div>

            <div className="recent-entries card">
              <div className="section-header">
                <h2>Recent Vehicle Entries</h2>
                <Link to="/vehicle-entry" className="view-all">
                  View all entries{" "}
                  <span className="material-icons">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <p className="loading-text">Loading...</p>
              ) : recentEntries.length === 0 ? (
                <p className="no-entries">No recent entries</p>
              ) : (
                <div className="entries-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Vehicle Type</th>
                        <th>Vehicle Class</th>
                        <th>Slot</th>
                        <th>Entry Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEntries.map((entry) => (
                        <tr key={entry._id}>
                          <td>{entry.vehicleType}</td>
                          <td>{entry.vehicleClass || "Unknown"}</td>
                          <td>{entry.slotNumber || "N/A"}</td>
                          <td>{formatDate(entry.entryTime)}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                entry.exitTime ? "completed" : "active"
                              }`}
                            >
                              {entry.exitTime ? "Completed" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="right-column">
            <div className="staff-info card">
              <h2>Staff Information</h2>
              <div className="staff-details">
                <div className="staff-avatar">
                  {localStorage.getItem("staffName")?.charAt(0) || "A"}
                </div>
                <div className="staff-text">
                  <h3>{localStorage.getItem("staffName") || "Ajay"}</h3>
                  <p>
                    {localStorage.getItem("staffEmail") ||
                      "aj@gmail.com"}
                  </p>
                </div>
                <div className="staff-meta">
                  <p>ID: {localStorage.getItem("staffId") || "id: 668158854388e0b36fa1"}</p>
                  <p>Role: Staff</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;