import React, { useState } from "react";
import "../styles/register.css";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const Register = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    // User fields
    name: "",
    vehicleNumber: "",
    vehicleType: "",
    email: "",
    password: "",
    // Staff fields
    address: "",
    phone_no: "",
    qualification: "", // Add qualification field
  });
  const [errors, setErrors] = useState({}); // Add state for validation errors
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Clear all form data
    setFormData({
      name: "",
      vehicleNumber: "",
      vehicleType: "",
      email: "",
      password: "",
      address: "",
      phone_no: "",
      qualification: "",
    });
    // Clear all error messages
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate a single field
  const validateField = (name, value) => {
    // Common validations
    if (name === "name") {
      if (!value.trim()) return "Name is required";
      if (value.length < 3) return "Name must be at least 3 characters";
    }

    if (name === "email") {
      if (!value.trim()) return "Email is required";

      // Basic email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Please enter a valid email address";

      // Check for common email domain misspellings
      const lowercaseEmail = value.toLowerCase();
      if (lowercaseEmail.includes("@gamil.com"))
        return "Did you mean @gmail.com? Please check the email domain";
      if (lowercaseEmail.includes("@gmali.com"))
        return "Did you mean @gmail.com? Please check the email domain";

      // Validate domain format
      const [localPart, domain] = value.split("@");
      if (!localPart || !domain) return "Please enter a valid email address";

      // Check if the domain is one of the allowed ones (add more as needed)
      const allowedDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
      ];
      if (!allowedDomains.includes(domain.toLowerCase()))
        return "Please use a valid email domain (gmail.com, yahoo.com, hotmail.com, outlook.com)";
    }

    if (name === "password") {
      if (!value.trim()) return "Password is required";
      if (value.length < 4) return "Password must be at least 4 characters";

      // Strong password validation with pattern Aa@1
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[@]/.test(value);

      let errors = [];
      if (!hasUpperCase) errors.push("uppercase letter (A)");
      if (!hasLowerCase) errors.push("lowercase letter (a)");
      if (!hasNumber) errors.push("number (1)");
      if (!hasSpecialChar) errors.push("@ symbol");

      if (errors.length > 0) {
        return `Password must follow pattern 'Aa@1': needs ${errors.join(
          ", "
        )}`;
      }
      return "";
    }

    // Role-specific validations
    if (selectedRole === "user") {
      if (name === "vehicleNumber") {
        if (!value.trim()) return "Vehicle number is required";
        // Use the provided regex pattern for validation
        if (
          !/^([A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4})$/.test(value.toUpperCase())
        ) {
          return "Enter a valid vehicle number (e.g., AB12CD3456)";
        }
      }

      if (name === "vehicleType" && !value) {
        return "Please select a vehicle type";
      }

      if (name === "phone_no") {
        if (!value.trim()) return "Phone number is required";
        if (!/^\d{10}$/.test(value)) return "Phone number must be 10 digits";
      }
    } else if (selectedRole === "staff") {
      if (name === "address") {
        if (!value.trim()) return "Address is required";
        if (value.length < 5) return "Address must be at least 5 characters";
      }

      if (name === "qualification") {
        if (!value.trim()) return "Qualification is required";
      }

      if (name === "phone_no") {
        if (!value.trim()) return "Phone number is required";
        if (!/^\d{10}$/.test(value)) return "Phone number must be 10 digits";
      }
    }

    return "";
  };

  // Handle blur event for real-time validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMessage = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  // Validate form based on role
  const validateForm = () => {
    const newErrors = {};

    // Validate all fields using validateField function
    Object.keys(formData).forEach((fieldName) => {
      if (
        (selectedRole === "user" &&
          (fieldName === "address" || fieldName === "qualification")) ||
        (selectedRole === "staff" &&
          (fieldName === "vehicleNumber" || fieldName === "vehicleType"))
      ) {
        return; // Skip fields not relevant to the selected role
      }

      const errorMessage = validateField(fieldName, formData[fieldName]);
      if (errorMessage) {
        newErrors[fieldName] = errorMessage;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    let endpoint = "";
    let payload = {};
    if (selectedRole === "user") {
      endpoint = "http://localhost:5000/api/login/register/user"; // Ensure this matches the backend route
      payload = {
        name: formData.name,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        phone_no: formData.phone_no,
        email: formData.email,
        password: formData.password,
      };
    } else if (selectedRole === "staff") {
      endpoint = "http://localhost:5000/api/login/register/staff"; // Ensure this matches the backend route
      payload = {
        name: formData.name,
        address: formData.address,
        phone_no: formData.phone_no,
        qualification: formData.qualification,
        email: formData.email,
        password: formData.password,
      };
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Display server error message
        alert(data.message || "Registration failed");
        return;
      }
      alert(data.message || "Registration successful!");
      // Use navigate to redirect to login page
      navigate("/login");
    } catch (err) {
      console.error("Error during registration:", err); // Log error details
      alert(
        "Server error: Unable to connect to the server. Please try again later."
      );
    }
  };

  // Helper function to render input with error message
  const renderInput = (name, placeholder, type = "text", required = true) => {
    return (
      <div className="form-group" style={{ marginBottom: "2px" }}>
        <input
          className={`form-input ${errors[name] ? "error-input" : ""}`}
          type={type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required={required}
        />
        {errors[name] && (
          <p className="error-message" style={{ color: "white" }}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <Navbar />
      <div
        className="card fixed-size-card"
        style={{
          background:
            "linear-gradient(to right, rgba(119, 47, 148, 1), rgba(202, 30, 56, 0))",
        }}
      >
        {!selectedRole ? (
          <>
            {/* Left Section */}
            <div className="card-left">
              <h2 className="title">Why choose us?</h2>
              <p className="subtitle">
                Streamline your parking operations with our intuitive system.
                Easily manage slots, track availability, and handle payments all
                in one place.
              </p>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoV7O_GjruXsAgDddlmQGJQ3osXRqSMO8DcVU21L-mY-wtXzvixQpF8qTi0erAUYV6MFXg9-SQ5jNsCHcYP1W8QPLbIxUUNCnqmGVZTDbv4_UZ6ViUEai9isIqgN4RVKuicSlUScBdg6oVx333ErekeSw7J6Y-jXqkpUrlNcGTNjW2EsToDY9vgOEHZ-VrREQJIiRjNzkiDNDw0XR9XnLq8-gtM_wVHf7_tD7fVU4YZLj8tUPW5F6tOfTVykYVleJNQjJgIE_hv9w"
                alt="Parking Illustration"
                className="parking-img"
              />
            </div>
            {/* Right Section */}
            <div className="card-right">
              <h2 className="title">Select Your Role</h2>
              <p className="subtitle">
                Choose your account type to get started.
              </p>
              <div
                className="role-card"
                onClick={() => handleRoleSelect("staff")}
              >
                <span className="material-icons icon staff">
                  business_center
                </span>
                <div className="role-info">
                  <h3>Staff</h3>
                  <p>Manage parking lots and operations.</p>
                </div>
                <span className="arrow">›</span>
              </div>
              <div
                className="role-card"
                onClick={() => handleRoleSelect("user")}
              >
                <span className="material-icons icon user">person</span>
                <div className="role-info">
                  <h3>User</h3>
                  <p>Find and book parking spots easily.</p>
                </div>
                <span className="arrow">›</span>
              </div>
            </div>
          </>
        ) : (
          <form
            className="register-form"
            onSubmit={handleSubmit}
            style={{ width: "100%", display: "flex", height: "100%" }}
          >
            <div className="card-left" style={{ flex: 1, height: "100%" }}>
              <h2 className="title">
                {selectedRole === "staff"
                  ? "Staff Registration"
                  : "User Registration"}
              </h2>
              <p className="subtitle">
                {selectedRole === "staff"
                  ? "Fill in your details to register as staff."
                  : "Fill in your details to register as user."}
              </p>
              <div className="form-inputs-container">
                {/* Common fields with validation */}
                {renderInput("name", "Full Name")}

                {selectedRole === "user" && (
                  <>
                    {renderInput("vehicleNumber", "Vehicle Number")}

                    <div
                      className="form-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <select
                        className={`form-input ${
                          errors.vehicleType ? "error-input" : ""
                        }`}
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                      >
                        <option value="">Select Vehicle Type</option>
                        <option value="2-wheeler">2-wheeler</option>
                        <option value="4-wheeler">4-wheeler</option>
                      </select>
                      {errors.vehicleType && (
                        <p className="error-message" style={{ color: "white" }}>
                          {errors.vehicleType}
                        </p>
                      )}
                    </div>

                    {renderInput("phone_no", "Phone Number")}
                  </>
                )}

                {selectedRole === "staff" && (
                  <>
                    {renderInput("address", "Address")}
                    {renderInput("qualification", "Qualification")}
                    {renderInput("phone_no", "Phone Number")}
                  </>
                )}

                {/* Common fields */}
                {renderInput("email", "Email", "email")}
                {renderInput("password", "Password", "password")}

                <div className="form-buttons">
                  <button className="btn btn-primary" type="submit">
                    Register as{" "}
                    {selectedRole.charAt(0).toUpperCase() +
                      selectedRole.slice(1)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedRole(null)}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>

            <div
              className="card-right"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>
                <h3 className="title" style={{ marginBottom: 24 }}>
                  {selectedRole === "staff"
                    ? "Staff Benefits"
                    : "User Benefits"}
                </h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {selectedRole === "staff" ? (
                    <>
                      <li
                        className="flex items-center"
                        style={{ marginBottom: 12 }}
                      >
                        <span
                          className="material-icons staff"
                          style={{ marginRight: 8 }}
                        >
                          check_circle
                        </span>
                        Manage parking facilities
                      </li>
                      <li
                        className="flex items-center"
                        style={{ marginBottom: 12 }}
                      >
                        <span
                          className="material-icons staff"
                          style={{ marginRight: 8 }}
                        >
                          check_circle
                        </span>
                        Monitor real-time availability
                      </li>
                      <li className="flex items-center">
                        <span
                          className="material-icons staff"
                          style={{ marginRight: 8 }}
                        >
                          check_circle
                        </span>
                        Generate parking reports
                      </li>
                    </>
                  ) : (
                    <>
                      <li
                        className="flex items-center"
                        style={{ marginBottom: 12 }}
                      >
                        <span
                          className="material-icons user"
                          style={{ marginRight: 8 }}
                        >
                          check_circle
                        </span>
                        Find available parking spots
                      </li>

                      <li className="flex items-center">
                        <span
                          className="material-icons user"
                          style={{ marginRight: 8 }}
                        >
                          check_circle
                        </span>
                        Pay easily with digital options
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
