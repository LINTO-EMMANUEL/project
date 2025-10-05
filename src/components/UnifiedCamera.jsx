import React, { useState, useEffect, useRef, useCallback } from "react";
import ImageUpload from "./ImageUpload";

const UnifiedCamera = ({
  onImageCapture,
  onError,
  cameraType = "laptop", // 'laptop' or 'cctv'
  cctvUrl = null,
  className = "",
  showControls = true,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Get available camera devices
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameraDevices(videoDevices);

      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting camera devices:", err);
    }
  }, [selectedDevice]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (cameraType === "cctv" && cctvUrl) {
        // For CCTV, we'll use a video element with the stream URL
        if (videoRef.current) {
          videoRef.current.src = cctvUrl;
          videoRef.current.play();
          setIsStreaming(true);
        }
      } else {
        // For laptop camera with enhanced settings
        const constraints = {
          video: {
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
            width: { ideal: 1920, min: 1280 }, // Prefer HD resolution
            height: { ideal: 1080, min: 720 },
            aspectRatio: { ideal: 16 / 9 },
            facingMode: "environment",
            advanced: [
              {
                focusMode: "continuous",
                exposureMode: "continuous",
                whiteBalanceMode: "continuous",
                frameRate: { ideal: 30, min: 15 },
              },
            ],
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsStreaming(true);
        }
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      const errorMessage =
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : err.name === "NotFoundError"
          ? "No camera found. Please connect a camera."
          : "Failed to start camera. Please try again.";

      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  }, [cameraType, cctvUrl, selectedDevice, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }

    setIsStreaming(false);
  }, []);

  // Pause/Resume camera
  const togglePause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPaused) {
      if (cameraType === "cctv" && cctvUrl) {
        videoRef.current.play();
      } else if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.enabled = true;
        });
      }
      setIsPaused(false);
    } else {
      if (cameraType === "cctv" && cctvUrl) {
        videoRef.current.pause();
      } else if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsPaused(true);
    }
  }, [isPaused, cameraType, cctvUrl]);

  // Capture image with enhanced quality
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !isStreaming || isPaused) return;

    try {
      const video = videoRef.current;

      // Wait for proper video frames
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        await new Promise((resolve) => {
          video.addEventListener("canplay", resolve, { once: true });
        });
      }

      // Create high-resolution canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;

      const ctx = canvas.getContext("2d", { alpha: false });

      // Capture multiple frames and analyze them for the best quality
      const numFrames = 3;
      let bestFrame = null;
      let highestContrast = -1;

      for (let i = 0; i < numFrames; i++) {
        // Capture frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate frame contrast
        let contrast = 0;
        for (let j = 0; j < data.length; j += 4) {
          const r = data[j];
          const g = data[j + 1];
          const b = data[j + 2];
          const brightness = (r + g + b) / 3;
          contrast += Math.abs(brightness - 128);
        }

        // Keep frame if it has higher contrast
        if (contrast > highestContrast) {
          highestContrast = contrast;
          bestFrame = imageData;
        }

        // Small delay between frames
        if (i < numFrames - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Use the best frame
      if (bestFrame) {
        ctx.putImageData(bestFrame, 0, 0);
      }

      // Apply additional enhancements
      const finalImageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const data = finalImageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Enhanced contrast and sharpening
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale using proper weights
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply contrast enhancement
        const contrast = 1.5; // Increased contrast for better plate visibility
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const enhanced = factor * (gray - 128) + 128;

        // Apply local sharpening
        const sharpness = 0.5;
        const final = Math.min(
          255,
          Math.max(0, enhanced + (enhanced - gray) * sharpness)
        );

        data[i] = final;
        data[i + 1] = final;
        data[i + 2] = final;
      }

      ctx.putImageData(finalImageData, 0, 0);

      // Convert to high-quality JPEG
      const dataURL = canvas.toDataURL("image/jpeg", 0.92);
      if (onImageCapture) {
        onImageCapture(dataURL);
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      if (onError) {
        onError("Failed to capture image. Please try again.");
      }
    }
  }, [isStreaming, isPaused, onImageCapture]);

  // Initialize camera on mount
  useEffect(() => {
    if (cameraType === "laptop") {
      getCameraDevices();
    }
    startCamera();

    return () => {
      stopCamera();
    };
  }, [cameraType, getCameraDevices, startCamera, stopCamera]);

  // Handle device change
  useEffect(() => {
    if (selectedDevice && cameraType === "laptop") {
      stopCamera();
      startCamera();
    }
  }, [selectedDevice, cameraType, startCamera, stopCamera]);

  return (
    <div className={`unified-camera ${className}`}>
      {/* Camera Selection (only for laptop) */}
      {cameraType === "laptop" && cameraDevices.length > 1 && (
        <div className="mb-3">
          <label className="form-label text-white">Select Camera:</label>
          <select
            value={selectedDevice || ""}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="form-select bg-dark text-white border-secondary"
          >
            {cameraDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Element */}
      <div className="position-relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`img-fluid rounded ${isPaused ? "opacity-50" : ""}`}
          style={{ width: "100%", height: "auto" }}
        />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded">
            <span className="text-white fs-4 fw-bold">Camera Paused</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-danger bg-opacity-75 rounded">
            <div className="text-center text-white p-4">
              <p className="fs-5 fw-bold mb-2">Camera Error</p>
              <p className="small">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="d-flex gap-2 mt-3 justify-content-center flex-wrap">
          <button
            type="button"
            onClick={captureImage}
            disabled={!isStreaming || isPaused}
            className={`btn ${
              !isStreaming || isPaused ? "btn-secondary" : "btn-primary"
            }`}
          >
            <i className="fas fa-camera me-2"></i>Capture
          </button>

          <button
            type="button"
            onClick={togglePause}
            disabled={!isStreaming}
            className={`btn ${
              !isStreaming
                ? "btn-secondary"
                : isPaused
                ? "btn-success"
                : "btn-warning"
            }`}
          >
            <i className={`fas ${isPaused ? "fa-play" : "fa-pause"} me-2`}></i>
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            type="button"
            onClick={startCamera}
            disabled={isStreaming}
            className={`btn ${isStreaming ? "btn-secondary" : "btn-info"}`}
          >
            <i className="fas fa-redo me-2"></i>Restart
          </button>
        </div>
      )}

      {/* Image Upload */}
      <div className="d-flex gap-2 mt-2 justify-content-center">
        <ImageUpload onImageUpload={onImageCapture} />
      </div>

      {/* Status */}
      <div className="mt-2 text-center">
        <span className={`badge ${isStreaming ? "bg-success" : "bg-danger"}`}>
          <i
            className={`fas ${isStreaming ? "fa-circle" : "fa-circle"} me-1`}
          ></i>
          {isStreaming ? "Live" : "Offline"}
        </span>
        {cameraType === "cctv" && (
          <span className="badge bg-info ms-2">CCTV Mode</span>
        )}
      </div>
    </div>
  );
};

export default UnifiedCamera;
