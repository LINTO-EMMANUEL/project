import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Link, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AboutPage from "./pages/About_us";
import Register from "./pages/Register";
import ManageSlots from "./pages/ManageSlots"; // Add this import
import StaffDashboard from "./pages/StaffDashboard"; // Add this import
import ManageUser from "./pages/ManageUser"; // Make sure this import exists
import ManageStaff from "./pages/ManageStaff"; // Add this import
import UserDashboard from "./pages/UserDashboard"; // Make sure this import exists
import UserWallet from "./pages/UserWallet"; // Add this import
import EnhancedCameraEntry from "./pages/EnhancedCameraEntry";

// Navbar component
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/vite.svg" alt="Logo" className="navbar-logo-img" />
        <span className="navbar-logo-text">Smart Park</span>
      </div>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">
          {" "}
          {/* Updated to navigate to Home */}
          Home
        </Link>
        <Link to="/about" className="navbar-link">
          About
        </Link>
        <Link to="/login" className="navbar-link">
          Login
        </Link>
        <Link to="/register" className="navbar-link">
          Register
        </Link>
      </div>
    </nav>
  );
}

// Protected Route Component
const ProtectedRoute = ({ element: Element, allowedRole, ...rest }) => {
  const isAuthenticated = () => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const isStaffLoggedIn = localStorage.getItem("isStaffLoggedIn") === "true";
    const isUserLoggedIn = localStorage.getItem("isUserLoggedIn") === "true";

    switch (allowedRole) {
      case "admin":
        return isAdminLoggedIn;
      case "staff":
        return isStaffLoggedIn;
      case "user":
        return isUserLoggedIn;
      default:
        return false;
    }
  };

  if (!isAuthenticated()) {
    window.location.replace("/login");
    return null;
  }

  return <Element {...rest} />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/register" element={<Register />} />
        {/* Protected Admin Routes */}
        <Route
          path="/admin_dashboard"
          element={
            <ProtectedRoute element={AdminDashboard} allowedRole="admin" />
          }
        />
        <Route
          path="/manage_slots"
          element={<ProtectedRoute element={ManageSlots} allowedRole="admin" />}
        />
        <Route
          path="/manage_users"
          element={<ProtectedRoute element={ManageUser} allowedRole="admin" />}
        />
        <Route
          path="/manage_staff"
          element={<ProtectedRoute element={ManageStaff} allowedRole="admin" />}
        />
        {/* Protected Staff Routes */}
        <Route
          path="/staff_dashboard"
          element={
            <ProtectedRoute element={StaffDashboard} allowedRole="staff" />
          }
        />
        <Route
          path="/enhanced-camera-entry"
          element={
            <ProtectedRoute element={EnhancedCameraEntry} allowedRole="staff" />
          }
        />
        {/* Protected User Routes */}
        <Route
          path="/user_dashboard"
          element={
            <ProtectedRoute element={UserDashboard} allowedRole="user" />
          }
        />
        <Route
          path="/user_wallet"
          element={<ProtectedRoute element={UserWallet} allowedRole="user" />}
        />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/slots" element={<ManageSlots />} />
        <Route path="/staff_dashboard" element={<StaffDashboard />} />
        <Route path="/users" element={<ManageUser />} />
        <Route path="/staff" element={<ManageStaff />} />
        <Route path="/user_dashboard" element={<UserDashboard />} />{" "}
        {/* Ensure this route exists */}
        <Route path="/user_wallet" element={<UserWallet />} />{" "}
        {/* Add this route */}
      </Routes>
    </Router>
  );
}

export default App;
