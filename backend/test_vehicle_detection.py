import os
import sys
from pathlib import Path
import cv2
import numpy as np
from ml.vehicle_detect import load_model, classify_vehicle

def test_vehicle_detection(image_path):
    """Test vehicle detection on a single image"""
    print(f"\nTesting image: {image_path}")
    
    try:
        # Load model
        model = load_model()
        
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            print(f"Failed to read image: {image_path}")
            return False
            
        # Run inference
        results = model(img, verbose=False)
        
        # Process detections
        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            class_name = results[0].names[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detections.append({
                'class': class_name,
                'confidence': conf,
                'bbox': [x1, y1, x2, y2]
            })
        
        # Classify vehicle
        result = classify_vehicle(detections)
        
        # Print results
        print(f"Detected vehicle type: {result['vehicle_type']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print("Raw detections:", detections)
        
        return True
        
    except Exception as e:
        print(f"Error processing image: {e}")
        return False

def main():
    # Get the test images directory
    test_dir = Path('test_images')
    if not test_dir.exists():
        print("Creating test_images directory...")
        test_dir.mkdir(exist_ok=True)
        print("Please add some test images to the test_images directory")
        return
    
    # Get all image files
    image_files = [
        f for f in test_dir.glob('*')
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png']
    ]
    
    if not image_files:
        print("No test images found. Please add some images to the test_images directory")
        return
    
    # Run tests
    print(f"\nFound {len(image_files)} test images")
    success_count = 0
    
    for image_file in image_files:
        if test_vehicle_detection(str(image_file)):
            success_count += 1
    
    # Print summary
    print(f"\nTest Summary:")
    print(f"Processed {len(image_files)} images")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(image_files) - success_count}")

if __name__ == '__main__':
    main()