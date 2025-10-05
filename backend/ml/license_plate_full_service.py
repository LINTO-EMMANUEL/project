#!/usr/bin/env python3
"""
Integrated License Plate Detection and OCR Service
This script combines license plate detection and text extraction in one service.
"""

import os
import sys
import cv2
import json
import tempfile
from pathlib import Path

# Import our custom modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detect_license_plate import detect_license_plates, extract_license_plate_image
from license_plate_ocr import extract_license_plate_text

def write_result(result):
    """Write JSON result with markers for parsing"""
    print("RESULT_START")
    print(json.dumps(result, indent=2))
    print("RESULT_END")
    sys.stdout.flush()

def process_license_plate_full(image_path, confidence_threshold=0.25, ocr_method="auto"):
    """
    Complete license plate processing: detection + OCR
    
    Args:
        image_path (str): Path to the image file
        confidence_threshold (float): Minimum confidence for detection
        ocr_method (str): OCR method to use
        
    Returns:
        dict: Complete processing results
    """
    try:
        # Step 1: Detect license plates
        detection_result = detect_license_plates(image_path, confidence_threshold)
        
        if not detection_result["success"]:
            return {
                "success": False,
                "error": f"License plate detection failed: {detection_result['error']}",
                "detection_result": detection_result
            }
        
        # Step 2: Process each detected license plate
        processed_plates = []
        
        for i, detection in enumerate(detection_result["detections"]):
            plate_info = {
                "plate_id": i + 1,
                "detection": detection,
                "ocr_result": None,
                "extracted_image_path": None
            }
            
            try:
                # Extract license plate image
                plate_image = extract_license_plate_image(image_path, detection["bbox"])
                
                if plate_image is not None:
                    # Save extracted plate image temporarily for OCR
                    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                        temp_path = temp_file.name
                        cv2.imwrite(temp_path, plate_image)
                        plate_info["extracted_image_path"] = temp_path
                    
                    # Perform OCR on extracted plate
                    ocr_result = extract_license_plate_text(plate_image, ocr_method)
                    plate_info["ocr_result"] = ocr_result
                    
                    # Clean up temporary file
                    try:
                        os.unlink(temp_path)
                    except:
                        pass
                else:
                    plate_info["ocr_result"] = {
                        "success": False,
                        "error": "Failed to extract license plate image"
                    }
                
            except Exception as e:
                plate_info["ocr_result"] = {
                    "success": False,
                    "error": f"OCR processing error: {str(e)}"
                }
            
            processed_plates.append(plate_info)
        
        # Compile results
        successful_ocr = [p for p in processed_plates if p["ocr_result"] and p["ocr_result"]["success"]]
        
        result = {
            "success": True,
            "image_path": image_path,
            "detection_summary": {
                "plates_detected": len(detection_result["detections"]),
                "plates_with_text": len(successful_ocr)
            },
            "processed_plates": processed_plates,
            "best_results": []
        }
        
        # Add best results (highest confidence OCR)
        if successful_ocr:
            best_plates = sorted(successful_ocr, 
                                key=lambda x: x["ocr_result"].get("confidence", 0), 
                                reverse=True)
            
            for plate in best_plates:
                if plate["ocr_result"]["license_plate_text"]:  # Only include plates with text
                    result["best_results"].append({
                        "plate_id": plate["plate_id"],
                        "license_plate_text": plate["ocr_result"]["license_plate_text"],
                        "detection_confidence": plate["detection"]["confidence"],
                        "ocr_confidence": plate["ocr_result"]["confidence"],
                        "bbox": plate["detection"]["bbox"]
                    })
        
        return result
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def save_annotated_result(image_path, result, output_path):
    """
    Save an annotated image with detection and OCR results
    
    Args:
        image_path (str): Original image path
        result (dict): Processing result
        output_path (str): Path to save annotated image
        
    Returns:
        bool: Success status
    """
    try:
        # Load original image
        image = cv2.imread(image_path)
        if image is None:
            return False
        
        # Draw detections and OCR results
        for plate in result.get("processed_plates", []):
            detection = plate["detection"]
            bbox = detection["bbox"]
            ocr_result = plate.get("ocr_result", {})
            
            # Color based on OCR success
            if ocr_result.get("success", False) and ocr_result.get("license_plate_text"):
                color = (0, 255, 0)  # Green for successful OCR
                label = f"Plate {plate['plate_id']}: {ocr_result['license_plate_text']}"
            else:
                color = (0, 255, 255)  # Yellow for detection only
                label = f"Plate {plate['plate_id']}: Detection Only"
            
            # Draw rectangle
            cv2.rectangle(image, 
                         (bbox["x1"], bbox["y1"]), 
                         (bbox["x2"], bbox["y2"]), 
                         color, 2)
            
            # Draw label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(image,
                         (bbox["x1"], bbox["y1"] - label_size[1] - 10),
                         (bbox["x1"] + label_size[0], bbox["y1"]),
                         color, -1)
            
            # Draw label text
            cv2.putText(image, label,
                       (bbox["x1"], bbox["y1"] - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Save annotated image
        cv2.imwrite(output_path, image)
        return True
        
    except Exception as e:
        print(f"Error saving annotated image: {e}")
        return False

def main():
    """Main function for CLI usage"""
    if len(sys.argv) < 2:
        write_result({
            "success": False, 
            "error": "Usage: python license_plate_full_service.py <image_path> [confidence_threshold] [ocr_method] [output_path]"
        })
        return 1
    
    image_path = sys.argv[1]
    confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
    ocr_method = sys.argv[3] if len(sys.argv) > 3 else "auto"
    output_path = sys.argv[4] if len(sys.argv) > 4 else None
    
    try:
        # Process license plate
        result = process_license_plate_full(image_path, confidence_threshold, ocr_method)
        
        # Save annotated image if requested
        if output_path and result["success"]:
            if save_annotated_result(image_path, result, output_path):
                result["annotated_image_saved"] = output_path
            else:
                result["annotation_error"] = "Failed to save annotated image"
        
        write_result(result)
        return 0 if result["success"] else 1
        
    except Exception as e:
        write_result({"success": False, "error": str(e)})
        return 1

if __name__ == "__main__":
    sys.exit(main())