import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleSecureLogout } from "../utils/authUtils";
import { Home, Car, Settings, Video, LogOut } from "lucide-react";
import "../styles/navbar.css";

const StaffNavbar = ({ onToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setCollapsed(!collapsed);
    if (onToggle) onToggle(!collapsed);
  };

  const handleLogout = () => {
    handleSecureLogout(navigate);
  };

  return (
    <div
      className="sidebar"
      style={{
        width: collapsed ? "80px" : "250px",
        transition: "width 0.3s ease",
      }}
    >
      {/* Profile Section */}
      <div className="profile-section">
        <img
          src="/src/assets/placeholder.svg"
          alt="Staff Profile"
          className="profile-image"
          width="40"
          height="40"
        />
        {!collapsed && <span className="profile-name">Staff Portal</span>}
      </div>

      {/* Navigation */}
      <nav className="nav-menu">
        <Link to="/staff_dashboard" className="nav-link">
          <Home size={20} /> {!collapsed && <span>Dashboard</span>}
        </Link>
        <Link to="/vehicle-records" className="nav-link">
          <Car size={20} /> {!collapsed && <span>Vehicle Records</span>}
        </Link>
        <Link to="/slots" className="nav-link">
          <Settings size={20} /> {!collapsed && <span>Manage Slots</span>}
        </Link>
        <Link
          to="/enhanced-camera-entry"
          className="nav-link"
          style={{
            backgroundColor: "var(--accent)",
            color: "white",
            fontWeight: "bold",
          }}
        >
          <Video size={20} /> {!collapsed && <span>VIEW LIVE CAMERA</span>}
        </Link>
      </nav>

      {/* Logout Button */}
      <div className="logout-section">
        <button onClick={handleLogout} className="btn btn-danger">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default StaffNavbar;
