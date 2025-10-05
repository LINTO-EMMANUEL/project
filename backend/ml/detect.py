#!/usr/bin/env python3
import os
import sys
import cv2
import json
from ultralytics import YOLO

# Map YOLO classes to wheel categories
VEHICLE_CLASSES = {
    2: '4-wheeler',  # car
    5: '4-wheeler',  # bus
    7: '4-wheeler',  # truck
    3: '2-wheeler'   # motorcycle/bike
}

def write_result(result):
    """Write JSON result with markers for parsing"""
    print("RESULT_START")
    print(json.dumps(result))
    print("RESULT_END")
    sys.stdout.flush()

def detect_vehicles(image_path):
    """Detect vehicles and classify as 2-wheeler or 4-wheeler"""
    try:
        # Validate image path
        if not os.path.exists(image_path):
            return {"success": False, "error": f"Image not found: {image_path}"}

        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "Failed to load image"}

        # Convert to RGB for YOLO
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Load YOLO model
        model = YOLO('yolov8n.pt')
        
        # Run detection
        results = model(image_rgb, conf=0.25)
        
        # Process results
        if results and len(results[0].boxes) > 0:
            # Get best detection
            best_detection = None
            best_confidence = 0
            
            # Find best vehicle detection
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                if class_id in VEHICLE_CLASSES:
                    confidence = float(box.conf[0])
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_detection = (class_id, box)
            
            # If we found a valid vehicle
            if best_detection:
                class_id, box = best_detection
                result = {
                    "success": True,
                    "vehicle_type": VEHICLE_CLASSES[class_id],
                    "confidence": best_confidence,
                    "bbox": box.xyxy[0].tolist()
                }
                return result
            else:
                return {"success": False, "error": "No valid vehicle detected"}
        else:
            return {"success": False, "error": "No detections found"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """Main function to handle CLI usage"""
    if len(sys.argv) != 2:
        write_result({"success": False, "error": "Image path is required"})
        return 1

    try:
        result = detect_vehicles(sys.argv[1])
        write_result(result)
        return 0 if result["success"] else 1
    except Exception as e:
        write_result({"success": False, "error": str(e)})
        return 1

if __name__ == "__main__":
    sys.exit(main())