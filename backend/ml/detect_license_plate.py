#!/usr/bin/env python3
"""
License Plate Detection Service
This script detects license plates in images using a trained YOLOv8 model.
"""

import os
import sys
import cv2
import json
import numpy as np
from ultralytics import YOLO
from pathlib import Path

def write_result(result):
    """Write JSON result with markers for parsing"""
    print("RESULT_START")
    print(json.dumps(result))
    print("RESULT_END")
    sys.stdout.flush()

def load_license_plate_model():
    """Load the trained license plate detection model"""
    # Check for trained model
    model_paths = [
        'models/license_plate_detector.pt',
        'models/license_plate/license_plate_detector/weights/best.pt',
        'models/license_plate/license_plate_detector/weights/last.pt'
    ]
    
    for model_path in model_paths:
        if os.path.exists(model_path):
            try:
                model = YOLO(model_path)
                print(f"Loaded license plate model from: {model_path}")
                return model
            except Exception as e:
                print(f"Failed to load model from {model_path}: {e}")
                continue
    
    # Fallback to pretrained YOLO (won't detect license plates specifically)
    print("Warning: No trained license plate model found. Using general YOLO model.")
    print("Please train the license plate model first using: python ml/train_license_plate_model.py")
    return None

def detect_license_plates(image_path, confidence_threshold=0.25):
    """
    Detect license plates in an image
    
    Args:
        image_path (str): Path to the image file
        confidence_threshold (float): Minimum confidence for detection
        
    Returns:
        dict: Detection results
    """
    try:
        # Validate image path
        if not os.path.exists(image_path):
            return {"success": False, "error": f"Image not found: {image_path}"}

        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "Failed to load image"}

        # Get image dimensions
        height, width = image.shape[:2]
        
        # Load license plate detection model
        model = load_license_plate_model()
        if model is None:
            return {"success": False, "error": "License plate detection model not available"}

        # Convert to RGB for YOLO
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run detection
        results = model(image_rgb, conf=confidence_threshold)
        
        # Process results
        detections = []
        if results and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                confidence = float(box.conf[0])
                
                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Calculate box dimensions
                box_width = x2 - x1
                box_height = y2 - y1
                box_area = box_width * box_height
                
                # License plate specific filtering
                aspect_ratio = box_width / box_height if box_height > 0 else 0
                
                # License plates typically have aspect ratio between 2:1 and 6:1
                if 1.5 <= aspect_ratio <= 8.0:
                    detection = {
                        "confidence": confidence,
                        "bbox": {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                            "width": int(box_width),
                            "height": int(box_height)
                        },
                        "aspect_ratio": round(aspect_ratio, 2),
                        "area": int(box_area),
                        "center": {
                            "x": int((x1 + x2) / 2),
                            "y": int((y1 + y2) / 2)
                        }
                    }
                    detections.append(detection)
        
        # Sort detections by confidence
        detections.sort(key=lambda x: x["confidence"], reverse=True)
        
        if detections:
            result = {
                "success": True,
                "license_plates_detected": len(detections),
                "detections": detections,
                "image_dimensions": {
                    "width": width,
                    "height": height
                }
            }
        else:
            result = {
                "success": False,
                "error": "No license plates detected",
                "image_dimensions": {
                    "width": width,
                    "height": height
                }
            }
        
        return result
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_license_plate_image(image_path, bbox, output_path=None):
    """
    Extract license plate region from image
    
    Args:
        image_path (str): Path to the original image
        bbox (dict): Bounding box coordinates
        output_path (str): Optional path to save extracted plate
        
    Returns:
        numpy.ndarray or None: Extracted license plate image
    """
    try:
        # Load original image
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Extract coordinates
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
        
        # Add small padding around the license plate
        padding = 5
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(image.shape[1], x2 + padding)
        y2 = min(image.shape[0], y2 + padding)
        
        # Extract license plate region
        plate_image = image[y1:y2, x1:x2]
        
        # Save if output path provided
        if output_path:
            cv2.imwrite(output_path, plate_image)
        
        return plate_image
        
    except Exception as e:
        print(f"Error extracting license plate: {e}")
        return None

def draw_detections(image_path, detections, output_path=None):
    """
    Draw bounding boxes around detected license plates
    
    Args:
        image_path (str): Path to the original image
        detections (list): List of detection results
        output_path (str): Optional path to save annotated image
        
    Returns:
        numpy.ndarray or None: Annotated image
    """
    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Draw bounding boxes
        for i, detection in enumerate(detections):
            bbox = detection["bbox"]
            confidence = detection["confidence"]
            
            # Colors: Green for high confidence, Yellow for medium, Red for low
            if confidence > 0.7:
                color = (0, 255, 0)  # Green
            elif confidence > 0.5:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 0, 255)  # Red
            
            # Draw rectangle
            cv2.rectangle(image, 
                         (bbox["x1"], bbox["y1"]), 
                         (bbox["x2"], bbox["y2"]), 
                         color, 2)
            
            # Draw label
            label = f"License Plate {i+1}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            
            # Background for text
            cv2.rectangle(image,
                         (bbox["x1"], bbox["y1"] - label_size[1] - 10),
                         (bbox["x1"] + label_size[0], bbox["y1"]),
                         color, -1)
            
            # Text
            cv2.putText(image, label,
                       (bbox["x1"], bbox["y1"] - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Save if output path provided
        if output_path:
            cv2.imwrite(output_path, image)
        
        return image
        
    except Exception as e:
        print(f"Error drawing detections: {e}")
        return None

def main():
    """Main function for CLI usage"""
    if len(sys.argv) < 2:
        write_result({"success": False, "error": "Image path is required"})
        return 1
    
    image_path = sys.argv[1]
    confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
    
    try:
        result = detect_license_plates(image_path, confidence_threshold)
        
        # If detection successful and user wants to save annotated image
        if result["success"] and len(sys.argv) > 3:
            output_path = sys.argv[3]
            annotated_image = draw_detections(image_path, result["detections"], output_path)
            if annotated_image is not None:
                result["annotated_image_saved"] = output_path
        
        write_result(result)
        return 0 if result["success"] else 1
        
    except Exception as e:
        write_result({"success": False, "error": str(e)})
        return 1

if __name__ == "__main__":
    sys.exit(main())