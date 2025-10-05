import React, { useRef } from "react";

const ImageUpload = ({ onImageUpload, className = "" }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(reader.result);
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />
      <button type="button" onClick={handleClick} className="btn btn-info">
        <i className="fas fa-upload me-2"></i>
        Upload Image
      </button>
    </div>
  );
};

export default ImageUpload;
