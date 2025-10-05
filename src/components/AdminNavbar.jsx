import React, { useState } from "react";
import "../styles/admin-sidebar.css";
import {
  useNavigate,
  NavLink,
  useResolvedPath,
  useMatch,
} from "react-router-dom";
import { handleSecureLogout } from "../utils/authUtils";

// --- Icon Components ---
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 16.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2.5"></path>
    <path d="M14 16.5a2.5 2.5 0 1 1-5 0"></path>
    <path d="M22 14v2a2 2 0 0 1-2 2h-1"></path>
    <path d="M4 18H3a2 2 0 0 1-2-2v-2"></path>
    <path d="M12 2v2"></path>
    <path d="m19 5-1.3 1.3"></path>
    <path d="m5 5 1.3 1.3"></path>
    <path d="M2 11h20"></path>
  </svg>
);

const DollarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18"></path>
    <path d="m19 9-5 5-4-4-3 3"></path>
  </svg>
);
const StaffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Two heads */}
    <circle cx="9" cy="7" r="4"></circle>
    <circle cx="17" cy="7" r="4"></circle>

    {/* Body shapes */}
    <path d="M5 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"></path>
    <path d="M13 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"></path>
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

// Add a logout icon component
const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

// Replace NavItem to render links but keep same styling
const NavItem = ({ icon, text, to, collapsed }) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    console.log("Navigating to:", to);
    navigate(to);
  };

  return (
    <li
      className={`nav-item ${collapsed ? "collapsed" : ""}`}
      onClick={handleNavigation}
      style={{ cursor: "pointer" }}
    >
      <div className="nav-link">
        <div className="icon-container">{icon}</div>
        <span className="nav-text">{text}</span>
      </div>
    </li>
  );
};

// The main Navbar component
const AdminNavbar = ({ onToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleNavbar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    // Notify parent component about the state change
    if (onToggle) {
      onToggle(newCollapsed);
    }
  };

  const handleLogout = () => {
    handleSecureLogout(navigate);
  };

  return (
    <aside className={`admin-navbar ${collapsed ? "collapsed" : ""}`}>
      <div className="admin-navbar-header">
        <img
          src="/vite.svg"
          alt="Logo"
          className="admin-navbar-logo"
          onClick={toggleNavbar}
        />
        {!collapsed && (
          <div>
            <h2>ParkSmart Admin</h2>
            <p>Admin Dashboard</p>
          </div>
        )}
      </div>
      <nav className="admin-navbar-nav">
        <ul>
          <NavItem
            to="/dashboard" // changed from "/" to "/dashboard"
            icon={<HomeIcon />}
            text="Dashboard"
            collapsed={collapsed}
          />
          <NavItem
            to="/sessions"
            icon={<CarIcon />}
            text="Parking Sessions"
            collapsed={collapsed}
          />
          <NavItem
            to="/revenue"
            icon={<DollarIcon />}
            text="Revenue"
            collapsed={collapsed}
          />
          <NavItem
            to="/slots" // Changed from "/manage slots" to "/slots"
            icon={<ChartIcon />}
            text="Manage Slots"
            collapsed={collapsed}
          />
          <NavItem
            to="/users"
            icon={<UsersIcon />}
            text="Manage Users"
            collapsed={collapsed}
          />
          <NavItem
            to="/staff"
            icon={<StaffIcon />} // Reuse the UsersIcon for simplicity
            text="Manage Staff"
            collapsed={collapsed}
          />
          <NavItem
            to="/settings"
            icon={<SettingsIcon />}
            text="Settings"
            collapsed={collapsed}
          />
        </ul>

        {/* Logout button at bottom */}
        <div className="navbar-bottom">
          <div className="logout-button" onClick={handleLogout}>
            <div className="icon-container">
              <LogoutIcon />
            </div>
            {!collapsed && <span className="nav-text">Logout</span>}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default AdminNavbar;
