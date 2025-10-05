import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import Home from "./pages/Home.jsx";
import AboutPage from "./pages/About_us.jsx";
import ManageSlots from "./pages/ManageSlots.jsx";
import Register from "./pages/Register.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import ManageUser from "./pages/ManageUser.jsx";
import ManageStaff from "./pages/ManageStaff.jsx";
import UserWallet from "./pages/UserWallet.jsx";
import EnhancedCameraEntry from "./pages/EnhancedCameraEntry.jsx";
import VehicleRecords from "./pages/VehicleRecords.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
        <Route path="/staff_dashboard" element={<StaffDashboard />} />
        <Route path="/user_dashboard" element={<UserDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/" element={<Home />} />
        <Route path="/about_us" element={<AboutPage />} />
        <Route path="/slots" element={<ManageSlots />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<ManageUser />} />
        <Route path="/staff" element={<ManageStaff />} />
        <Route path="/user_wallet" element={<UserWallet />} />
        <Route
          path="/enhanced-camera-entry"
          element={<EnhancedCameraEntry />}
        />
        <Route path="/vehicle-records" element={<VehicleRecords />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
