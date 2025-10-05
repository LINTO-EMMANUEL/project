#!/usr/bin/env python3
"""
License Plate Detection and Cropping Service for Website
This script detects license plates, creates annotated images, and crops license plates
Similar to show_detected_plate.py but designed for web API usage
"""

import cv2
import sys
import json
import os
import subprocess
from pathlib import Path
import numpy as np

def write_result(result):
    """Write JSON result with markers for parsing"""
    print("RESULT_START")
    print(json.dumps(result, indent=2))
    print("RESULT_END")
    sys.stdout.flush()

def detect_and_crop_license_plates(image_path, confidence_threshold=0.25):
    """
    Detect license plates, create annotated image, and crop license plates
    
    Args:
        image_path (str): Path to the image file
        confidence_threshold (float): Minimum confidence for detection
        
    Returns:
        dict: Detection and cropping results
    """
    try:
        # Step 1: Run license plate detection
        script_dir = os.path.dirname(__file__)
        detect_script = os.path.join(script_dir, 'detect_license_plate.py')
        result = subprocess.run([
            'python', detect_script, image_path, str(confidence_threshold)
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"Detection script failed: {result.stderr}",
                "detection_result": None
            }
        
        # Parse detection results
        output = result.stdout
        start_marker = "RESULT_START"
        end_marker = "RESULT_END"
        
        start_idx = output.find(start_marker)
        end_idx = output.find(end_marker)
        
        if start_idx == -1 or end_idx == -1:
            return {
                "success": False,
                "error": "Could not find detection results in output",
                "detection_result": None
            }
        
        json_str = output[start_idx + len(start_marker):end_idx].strip()
        detection_data = json.loads(json_str)
        
        if not detection_data.get('success') or detection_data.get('license_plates_detected', 0) == 0:
            return {
                "success": False,
                "error": "No license plates detected",
                "detection_result": detection_data
            }
        
        # Step 2: Load the original image
        image = cv2.imread(image_path)
        if image is None:
            return {
                "success": False,
                "error": f"Could not load image: {image_path}",
                "detection_result": detection_data
            }
        
        # Step 3: Process each detection
        processed_plates = []
        
        for i, detection in enumerate(detection_data['detections']):
            bbox = detection['bbox']
            confidence = detection['confidence']
            
            # Extract coordinates
            x1, y1 = int(bbox['x1']), int(bbox['y1'])
            x2, y2 = int(bbox['x2']), int(bbox['y2'])
            
            # Ensure coordinates are within image bounds
            h, w = image.shape[:2]
            x1 = max(0, min(x1, w-1))
            y1 = max(0, min(y1, h-1))
            x2 = max(0, min(x2, w-1))
            y2 = max(0, min(y2, h-1))
            
            # Draw bounding box on original image (for annotation)
            image_with_box = image.copy()
            cv2.rectangle(image_with_box, (x1, y1), (x2, y2), (0, 255, 0), 3)
            cv2.putText(image_with_box, f'License Plate ({confidence:.1%})', 
                       (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Crop the license plate region with small padding
            padding = 5
            crop_x1 = max(0, x1 - padding)
            crop_y1 = max(0, y1 - padding)
            crop_x2 = min(w, x2 + padding)
            crop_y2 = min(h, y2 + padding)
            
            license_plate_crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
            
            if license_plate_crop.size == 0:
                continue
            
            # Scale up small license plates for better viewing
            crop_height, crop_width = license_plate_crop.shape[:2]
            if crop_width > 0 and crop_height > 0:
                scale_factor = max(2, 300 // max(crop_width, crop_height))
                new_width = crop_width * scale_factor
                new_height = crop_height * scale_factor
                license_plate_resized = cv2.resize(license_plate_crop, (new_width, new_height), 
                                                 interpolation=cv2.INTER_CUBIC)
            else:
                license_plate_resized = license_plate_crop
            
            # Save images to temp directory
            temp_dir = Path('temp')
            temp_dir.mkdir(exist_ok=True)
            
            # Generate unique filenames with timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            
            annotated_filename = f'annotated_{timestamp}_{i+1}.jpg'
            cropped_filename = f'cropped_plate_{timestamp}_{i+1}.jpg'
            resized_filename = f'resized_plate_{timestamp}_{i+1}.jpg'
            
            annotated_path = temp_dir / annotated_filename
            cropped_path = temp_dir / cropped_filename
            resized_path = temp_dir / resized_filename
            
            # Save all versions
            cv2.imwrite(str(annotated_path), image_with_box)
            cv2.imwrite(str(cropped_path), license_plate_crop)
            cv2.imwrite(str(resized_path), license_plate_resized)
            
            # Add to results
            plate_info = {
                "plate_id": i + 1,
                "detection": detection,
                "saved_files": {
                    "annotated_image": str(annotated_path),
                    "cropped_plate": str(cropped_path),
                    "resized_plate": str(resized_path)
                },
                "crop_info": {
                    "original_size": f"{crop_width}x{crop_height}",
                    "resized_size": f"{new_width}x{new_height}",
                    "scale_factor": scale_factor
                }
            }
            processed_plates.append(plate_info)
        
        # Compile final results
        result = {
            "success": True,
            "image_path": image_path,
            "detection_summary": detection_data,
            "plates_processed": processed_plates,
            "total_plates": len(processed_plates),
            "files_saved": {
                "annotated_images": len([p for p in processed_plates]),
                "cropped_plates": len([p for p in processed_plates]),
                "temp_directory": str(temp_dir)
            },
            "processing_info": {
                "confidence_threshold": confidence_threshold,
                "image_dimensions": detection_data.get('image_dimensions', {}),
                "cropping_enabled": True,
                "annotation_enabled": True
            }
        }
        
        return result
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Error parsing detection results: {e}",
            "detection_result": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {e}",
            "detection_result": None
        }

def main():
    if len(sys.argv) < 2:
        write_result({
            "success": False,
            "error": "Usage: python detect_and_crop_service.py <image_path> [confidence_threshold]"
        })
        return 1
    
    image_path = sys.argv[1]
    confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.25
    
    # Debug logging
    print(f"DEBUG: Starting detection with image_path='{image_path}', confidence={confidence_threshold}", file=sys.stderr)
    print(f"DEBUG: Current working directory: {os.getcwd()}", file=sys.stderr)
    print(f"DEBUG: Image file exists: {os.path.exists(image_path)}", file=sys.stderr)
    print(f"DEBUG: Full image path: {os.path.abspath(image_path)}", file=sys.stderr)
    
    if not Path(image_path).exists():
        write_result({
            "success": False,
            "error": f"Image file not found: {image_path}"
        })
        return 1
    
    # Process the image
    result = detect_and_crop_license_plates(image_path, confidence_threshold)
    
    # Output result
    write_result(result)
    
    return 0 if result['success'] else 1

if __name__ == '__main__':
    exit(main())