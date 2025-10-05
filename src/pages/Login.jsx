import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import "../styles/login.css";
import Navbar from "../components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Toggle state
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
      // Always redirect to dashboard if logged in, replace history so Back won't show login
      navigate("/admin_dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", { email });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      if (!data.success || !data.user) {
        alert(data.message || "Invalid response from server");
        return;
      }

      // Handle successful login
      const { user } = data;
      switch (user.role) {
        case "admin":
          localStorage.setItem("isAdminLoggedIn", "true");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userId", user._id);
          navigate("/admin_dashboard", { replace: true });
          break;

        case "staff":
          if (user.status !== "approved") {
            alert("Your staff account is pending approval");
            return;
          }
          localStorage.setItem("isStaffLoggedIn", "true");
          localStorage.setItem("userRole", "staff");
          localStorage.setItem("staffId", user._id); // Store as staffId instead of userId
          navigate("/staff_dashboard", { replace: true });
          break;

        case "user":
          if (user.status !== "approved") {
            alert("Your account is pending approval");
            return;
          }
          localStorage.setItem("isUserLoggedIn", "true");
          localStorage.setItem("userRole", "user");
          localStorage.setItem("userId", user._id);
          localStorage.setItem("userName", user.name || "User");
          navigate("/user_dashboard", { replace: true });
          break;
        default:
          alert("Invalid role type");
          return;
      }
    } catch (err) {
      console.error("Login error details:", err);
      alert("Server error. Please try again later.");
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    try {
      console.log("Sending forgot password request for:", email);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      console.log("Forgot password response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      if (data.previewUrl) {
        // In development mode
        alert(
          `Password reset email generated!\n\nClick OK to open the email preview in a new tab.`
        );
        window.open(data.previewUrl, "_blank");
      } else {
        // In production mode
        alert(data.message || "Password reset link sent to your email");
      }

      // Reset form
      setShowForgotPassword(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      alert(
        err.message ||
          "Failed to process password reset request. Please try again."
      );
    }
  };

  return (
    <div className="page-root">
      <div className="layout">
        <Navbar />
        <div className="content-outer">
          <div className="content-inner">
            <div className="hero-shell">
              <div
                className="hero"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCxYKwCVTZMkHJY-B5kZ-aOsC66wp4Et59ZTaAild7FwN-24r5221mqoT8dH6zct8hOz6_8A2cetdLWCPdUiu_yiguzHTNp5tDGgKwsLFBk1naOJ1SOLhua1JhE0cEDBfeyqifSFbUDYYmPYJ4AmUKoZhK4PxbwKaoJ1bn4BVMoBVsPUXU9-s6eyaIMBc3kM-vrmseETbKH9bFZcR39hW_WjLpgz-khfVOXTCgJ9g7cDEeUS-nTG97OfUBzoXHnjNQ1sHwYyH2Gdh4")',
                }}
              />
            </div>
            <div
              className={`form-container ${
                showForgotPassword ? "show-forgot-password" : "show-login"
              }`}
            >
              {showForgotPassword ? (
                <div className="forgot-password">
                  <h2 className="page-title">Forgot Your Password?</h2>
                  <p className="page-subtitle">
                    Enter your email address to reset your password.
                  </p>
                  <form onSubmit={handleForgotPasswordSubmit}>
                    <div className="form-row">
                      <label className="form-field">
                        <TextField
                          type="email"
                          variant="outlined"
                          label="Email Address"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          fullWidth
                          margin="normal"
                          sx={{ bgcolor: "white" }}
                        />
                      </label>
                    </div>
                    <div className="actions">
                      <button type="submit" className="btn-wide">
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                  <p
                    className="helper-link"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to Login
                  </p>
                </div>
              ) : (
                <div className="login-form">
                  <h1 className="page-title">SmartPark</h1>
                  <h2 className="page-subtitle">Welcome back</h2>
                  <form onSubmit={handleLoginSubmit}>
                    <div className="form-row">
                      <label className="form-field">
                        <TextField
                          type="email"
                          variant="filled"
                          label="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          fullWidth
                          margin="normal"
                          sx={{ bgcolor: "white" }}
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label className="form-field">
                        <TextField
                          type="password"
                          variant="filled"
                          label="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          fullWidth
                          margin="normal"
                          sx={{ bgcolor: "white" }}
                        />
                      </label>
                    </div>
                    <p
                      className="helper-link"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </p>
                    <div className="actions">
                      <button type="submit" className="btn-wide">
                        Log In
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
