import React, { useState, useEffect } from "react";
import StaffNavbar from "../components/StaffNavbar";
import UnifiedCamera from "../components/UnifiedCamera";
import ImageUpload from "../components/ImageUpload";
import "../styles/enhanced-camera-entry.css";

const EnhancedCameraEntry = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [recentRecords, setRecentRecords] = useState([]);

  // Use relative URLs since we're using Vite's proxy
  const API_URL = "http://localhost:5000";

  // Check API status with retries
  const checkApiStatus = async (retries = 3) => {
    try {
      setApiStatus("checking");

      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(`${API_URL}/api/health`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (response.ok) {
            setApiStatus("connected");
            return;
          }

          console.log(
            `API check attempt ${i + 1} failed, status: ${response.status}`
          );

          // Wait before retry, increasing delay each time
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          }
        } catch (err) {
          console.log(`API check attempt ${i + 1} failed:`, err.message);
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }

      // If we get here, all retries failed
      setApiStatus("disconnected");
      setError(
        "Cannot connect to server. Please check if the server is running."
      );
    } catch (err) {
      setApiStatus("error");
      setError(`Server connection error: ${err.message}`);
    }
  };

  // Check API status on mount and periodically
  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load recent records
  useEffect(() => {
    loadRecentRecords();
  }, []);

  const loadRecentRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/vehicle-detection/records`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentRecords(data.records || []);
      }
    } catch (err) {
      console.error("Error loading recent records:", err);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const handleImageCapture = async (imageData) => {
    try {
      setError(null);
      setSuccess(null);
      setDetectionResult(null);

      // Validate the image data
      if (!imageData) {
        throw new Error("No image captured");
      }

      if (!imageData.startsWith("data:image/")) {
        throw new Error("Invalid image format");
      }

      // Store the validated image
      setCapturedImage(imageData);

      console.log("Image captured successfully:", {
        size: Math.round(imageData.length / 1024) + "KB",
        type: imageData.split(";")[0].split("/")[1],
      });
    } catch (err) {
      console.error("Image capture error:", err);
      setError("Failed to capture image: " + err.message);
      setCapturedImage(null);
    }
  };

  const handleCameraError = (error) => {
    setError(`Camera error: ${error}`);
  };

  const processImage = async () => {
    if (!capturedImage) {
      setError("No image captured");
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      /* 1.  convert base64 → Blob (you already do this) */
      const [header, base64Data] = capturedImage.split(",");
      const mime = header.match(/^data:(image\/[^;]+);/)[1];
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mime });

      /* 2.  send to the vehicle detection endpoint */
      const form = new FormData();
      form.append("image", blob, "capture.jpg");

      // allow a longer timeout for image processing (60s)
      const res = await fetch(`${API_URL}/api/vehicle-detection/detect`, {
        method: "POST",
        body: form,
        credentials: "include",
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({}))).error || res.statusText;
        throw new Error(msg);
      }

      const data = await res.json();

      /* 3.  show vehicle detection result */
      if (data.success) {
        setDetectionResult(data);
        setSuccess(
          `Vehicle: ${data.vehicleType} | Plate: ${data.plate || "none"}`
        );
        loadRecentRecords();

        // 4. Also perform license plate detection and cropping
        try {
          const plateForm = new FormData();
          plateForm.append("image", blob, "capture.jpg");

          // allow more time for license-plate detection + OCR (60s)
          const plateRes = await fetch(
            `${API_URL}/api/license-plate/detect-and-crop`,
            {
              method: "POST",
              body: plateForm,
              credentials: "include",
              signal: AbortSignal.timeout(60000),
            }
          );

          if (plateRes.ok) {
            const plateData = await plateRes.json();
            if (plateData.success) {
              const plateCount = plateData.total_plates || 0;
              console.log("License plate detection result:", plateData);
              // Update success message to include plate detection info
              setSuccess(
                `Vehicle: ${data.vehicleType} | Plate: ${
                  data.plate || "none"
                } | Cropped ${plateCount} plate(s) saved`
              );
            }
          }
        } catch (plateErr) {
          console.warn("License plate detection failed:", plateErr.message);
          // Don't show error for plate detection failure, just log it
        }
      } else {
        throw new Error(data.error || "Recognition failed");
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setDetectionResult(null);
    setError(null);
    setSuccess(null);
  };

  const handleImageUpload = (imageData) => {
    // Image will already be in base64 format from the ImageUpload component
    setCapturedImage(imageData);
    setError(null);
    setSuccess(null);
    setDetectionResult(null);
  };

  const saveRecord = async () => {
    if (!detectionResult) return;

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicle-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: detectionResult.plate,
          vehicleType: detectionResult.vehicleType,
        }),
      });

      if (response.ok) {
        setSuccess("Vehicle entry saved successfully!");
        loadRecentRecords();
      } else {
        throw new Error("Failed to save record");
      }
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="enhanced-camera-container">
      {/* Fixed Sidebar */}
      <StaffNavbar onToggle={handleSidebarToggle} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          marginLeft: sidebarCollapsed ? "80px" : "250px",
          transition: "margin-left 0.3s ease",
          backgroundColor: "#1e1e2f",
          color: "#ffffff",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              color: "#ffffff",
              marginBottom: "0.5rem",
              fontSize: "2rem",
              fontWeight: "700",
            }}
          >
            Enhanced Camera Entry System
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
            Vehicle detection and license plate recognition
          </p>
        </div>

        {/* API Status */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              backgroundColor:
                apiStatus === "connected"
                  ? "rgba(0, 200, 83, 0.1)"
                  : apiStatus === "checking"
                  ? "rgba(255, 193, 7, 0.1)"
                  : "rgba(255, 82, 82, 0.1)",
              border: `1px solid ${
                apiStatus === "connected"
                  ? "var(--accent)"
                  : apiStatus === "checking"
                  ? "#ffc107"
                  : "var(--error)"
              }`,
              color: "#ffffff",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                marginRight: "8px",
                backgroundColor:
                  apiStatus === "connected"
                    ? "var(--accent)"
                    : apiStatus === "checking"
                    ? "#ffc107"
                    : "var(--error)",
                boxShadow: `0 0 6px ${
                  apiStatus === "connected"
                    ? "rgba(0, 200, 83, 0.6)"
                    : apiStatus === "checking"
                    ? "rgba(255, 193, 7, 0.6)"
                    : "rgba(255, 82, 82, 0.6)"
                }`,
              }}
            ></span>
            <strong>API Status:</strong>{" "}
            {apiStatus === "connected"
              ? "Connected"
              : apiStatus === "checking"
              ? "Checking connection..."
              : "Disconnected (check if backend server is running)"}
          </div>
        </div>

        {/* Camera Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              backgroundColor: "#2d2d44",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h5
              style={{
                color: "#ffffff",
                marginBottom: "1rem",
                fontWeight: "600",
              }}
            >
              Camera Configuration
            </h5>
          </div>
        </div>

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* Camera Section */}
          <div>
            <div
              style={{
                backgroundColor: "#2d2d44",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                height: "100%",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <h5 style={{ color: "#ffffff", margin: 0, fontWeight: "600" }}>
                  Camera Feed
                </h5>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <UnifiedCamera
                  onImageCapture={handleImageCapture}
                  onError={handleCameraError}
                />

                {/* Captured Image Preview */}
                {capturedImage && (
                  <div style={{ marginBottom: "1rem" }}>
                    <h6 style={{ color: "#ffffff", marginBottom: "0.5rem" }}>
                      Captured Image:
                    </h6>
                    <img
                      src={capturedImage}
                      alt="Captured"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={!capturedImage || processing}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor:
                        !capturedImage || processing
                          ? "var(--button-gray)"
                          : "var(--accent)",
                      color: "#ffffff",
                      cursor:
                        !capturedImage || processing
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.2s ease",
                      fontWeight: "500",
                      opacity: !capturedImage || processing ? 0.6 : 1,
                    }}
                  >
                    {processing ? "Processing..." : "Process Image"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--muted-border)",
                      backgroundColor: "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontWeight: "500",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            <div
              style={{
                backgroundColor: "#2d2d44",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                height: "100%",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <h5 style={{ color: "#ffffff", margin: 0, fontWeight: "600" }}>
                  Detection Results
                </h5>
              </div>
              <div style={{ padding: "1.5rem" }}>
                {/* Status Messages */}
                {error && (
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(255, 82, 82, 0.1)",
                      border: "1px solid var(--error)",
                      color: "#ffffff",
                      marginBottom: "1rem",
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(0, 200, 83, 0.1)",
                      border: "1px solid var(--accent)",
                      color: "#ffffff",
                      marginBottom: "1rem",
                    }}
                  >
                    {success}
                  </div>
                )}

                {/* Detection Results */}
                {detectionResult ? (
                  <div
                    style={{
                      backgroundColor: "#0d1b2a",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <h6
                      style={{
                        color: "var(--accent)",
                        marginBottom: "1rem",
                        fontWeight: "600",
                      }}
                    >
                      Detection Successful!
                    </h6>
                    <div>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          color: "#ffffff",
                        }}
                      >
                        <tbody>
                          <tr
                            style={{
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <td
                              style={{ padding: "0.5rem", fontWeight: "600" }}
                            >
                              Vehicle Type:
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              <span
                                style={{
                                  backgroundColor:
                                    detectionResult.vehicleType === "motorcycle"
                                      ? "#17a2b8"
                                      : detectionResult.vehicleType === "truck"
                                      ? "#dc3545"
                                      : detectionResult.vehicleType === "bus"
                                      ? "#28a745"
                                      : "#007bff",
                                  color: "#ffffff",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                              >
                                {detectionResult.vehicleType}
                              </span>
                            </td>
                          </tr>
                          <tr
                            style={{
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <td
                              style={{ padding: "0.5rem", fontWeight: "600" }}
                            >
                              Plate Confidence:
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              <div
                                style={{
                                  width: "100%",
                                  height: "24px",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${
                                      detectionResult.plateConfidence * 100
                                    }%`,
                                    backgroundColor: "var(--accent)",
                                    borderRadius: "12px",
                                    transition: "width 0.6s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                  }}
                                >
                                  {(
                                    detectionResult.plateConfidence * 100
                                  ).toFixed(1)}
                                  %
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr
                            style={{
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <td
                              style={{ padding: "0.5rem", fontWeight: "600" }}
                            >
                              Vehicle Class:
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              <span
                                style={{
                                  backgroundColor: "#17a2b8",
                                  color: "#ffffff",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {detectionResult.vehicleClass || "Unknown"}
                              </span>
                            </td>
                          </tr>
                          <tr
                            style={{
                              borderBottom:
                                "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <td
                              style={{ padding: "0.5rem", fontWeight: "600" }}
                            >
                              Confidence:
                            </td>
                            <td style={{ padding: "0.5rem" }}>
                              <div
                                style={{
                                  width: "100%",
                                  height: "24px",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${
                                      detectionResult.confidence * 100
                                    }%`,
                                    backgroundColor: "#17a2b8",
                                    borderRadius: "12px",
                                    transition: "width 0.6s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                  }}
                                >
                                  {(detectionResult.confidence * 100).toFixed(
                                    1
                                  )}
                                  %
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={saveRecord}
                      disabled={processing}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        backgroundColor: processing
                          ? "var(--button-gray)"
                          : "var(--accent)",
                        color: "#ffffff",
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        fontWeight: "600",
                        marginTop: "1rem",
                        opacity: processing ? 0.6 : 1,
                      }}
                    >
                      {processing ? "Saving..." : "Save Vehicle Entry"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      📷
                    </div>
                    <p style={{ margin: 0, fontSize: "1.1rem" }}>
                      No vehicle detected yet
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      Capture and process an image to detect vehicles
                    </p>
                  </div>
                )}

                {/* Recent Records */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h6
                    style={{
                      color: "#ffffff",
                      marginBottom: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    Recent Entries
                  </h6>
                  {recentRecords.length > 0 ? (
                    <div>
                      {recentRecords.slice(0, 5).map((record) => (
                        <div
                          key={record._id}
                          style={{
                            backgroundColor: "#0d1b2a",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color: "#ffc107",
                                  fontWeight: "600",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {record.plateNumber}
                              </div>
                              <div
                                style={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {record.vehicleType}
                              </div>
                            </div>
                            <div
                              style={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {new Date(record.entryTime).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.875rem",
                        margin: 0,
                      }}
                    >
                      No recent entries
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCameraEntry;
