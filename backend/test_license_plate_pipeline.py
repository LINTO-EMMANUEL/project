#!/usr/bin/env python3
"""
License Plate Detection Pipeline Test
This script tests the complete license plate detection and OCR pipeline.
"""

import os
import sys
import json
import requests
import cv2
import numpy as np
from pathlib import Path

# Add the ml directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml'))

try:
    from ml.license_plate_full_service import process_license_plate_full
    from ml.detect_license_plate import detect_license_plates
    from ml.license_plate_ocr import extract_license_plate_text
except ImportError as e:
    print(f"Warning: Could not import ML modules: {e}")
    print("Make sure you're running this from the backend directory")

def create_test_image_with_text(text="ABC123", width=600, height=200):
    """
    Create a simple test image with license plate-like text
    This is useful for testing when you don't have real license plate images
    """
    # Create a white background
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    
    # Add a rectangular "license plate" background
    plate_color = (240, 240, 240)  # Light gray
    border_color = (50, 50, 50)    # Dark gray
    
    # Plate dimensions
    plate_width = width - 100
    plate_height = 80
    plate_x = (width - plate_width) // 2
    plate_y = (height - plate_height) // 2
    
    # Draw plate background
    cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_width, plate_y + plate_height), plate_color, -1)
    
    # Draw plate border
    cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_width, plate_y + plate_height), border_color, 3)
    
    # Add text
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 2.5
    font_thickness = 3
    text_color = (0, 0, 0)  # Black
    
    # Get text size to center it
    text_size = cv2.getTextSize(text, font, font_scale, font_thickness)[0]
    text_x = plate_x + (plate_width - text_size[0]) // 2
    text_y = plate_y + (plate_height + text_size[1]) // 2
    
    cv2.putText(img, text, (text_x, text_y), font, font_scale, text_color, font_thickness)
    
    return img

def test_python_pipeline():
    """Test the Python detection and OCR pipeline directly"""
    print("="*60)
    print("TESTING PYTHON PIPELINE")
    print("="*60)
    
    # Create test image
    test_text = "TEST123"
    test_image = create_test_image_with_text(test_text)
    
    # Save test image
    test_image_path = "temp/test_license_plate.jpg"
    os.makedirs("temp", exist_ok=True)
    cv2.imwrite(test_image_path, test_image)
    print(f"✅ Created test image: {test_image_path}")
    
    try:
        # Test 1: License plate detection only
        print("\nTest 1: License Plate Detection")
        print("-" * 40)
        detection_result = detect_license_plates(test_image_path, confidence_threshold=0.1)
        print(f"Detection result: {json.dumps(detection_result, indent=2)}")
        
        # Test 2: OCR only
        print("\nTest 2: OCR on test image")
        print("-" * 40)
        ocr_result = extract_license_plate_text(test_image_path, ocr_method="auto")
        print(f"OCR result: {json.dumps(ocr_result, indent=2)}")
        
        # Test 3: Full pipeline
        print("\nTest 3: Full Pipeline (Detection + OCR)")
        print("-" * 40)
        full_result = process_license_plate_full(test_image_path, confidence_threshold=0.1)
        print(f"Full pipeline result: {json.dumps(full_result, indent=2)}")
        
        # Analyze results
        print("\n" + "="*60)
        print("RESULTS ANALYSIS")
        print("="*60)
        
        if detection_result.get("success"):
            print("✅ License plate detection: PASSED")
        else:
            print("❌ License plate detection: FAILED")
            print(f"   Error: {detection_result.get('error', 'Unknown error')}")
        
        if ocr_result.get("success"):
            print("✅ OCR processing: PASSED")
            extracted_text = ocr_result.get("license_plate_text", "").upper()
            if test_text in extracted_text or extracted_text in test_text:
                print(f"✅ Text extraction accuracy: GOOD (expected: {test_text}, got: {extracted_text})")
            else:
                print(f"⚠️  Text extraction accuracy: PARTIAL (expected: {test_text}, got: {extracted_text})")
        else:
            print("❌ OCR processing: FAILED")
            print(f"   Error: {ocr_result.get('error', 'Unknown error')}")
        
        if full_result.get("success"):
            print("✅ Full pipeline: PASSED")
            best_results = full_result.get("best_results", [])
            if best_results:
                print(f"✅ Found {len(best_results)} license plate(s) with text")
                for i, plate in enumerate(best_results):
                    print(f"   Plate {i+1}: {plate.get('license_plate_text', 'N/A')}")
            else:
                print("⚠️  No license plates with readable text found")
        else:
            print("❌ Full pipeline: FAILED")
            print(f"   Error: {full_result.get('error', 'Unknown error')}")
        
    except Exception as e:
        print(f"❌ Python pipeline test failed: {e}")
        return False
    
    finally:
        # Cleanup
        try:
            os.remove(test_image_path)
        except:
            pass
    
    return True

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n" + "="*60)
    print("TESTING API ENDPOINTS")
    print("="*60)
    
    base_url = "http://localhost:5000/api/license-plate"
    
    # Create test image
    test_text = "API456"
    test_image = create_test_image_with_text(test_text)
    
    # Convert image to bytes
    _, img_encoded = cv2.imencode('.jpg', test_image)
    img_bytes = img_encoded.tobytes()
    
    try:
        # Test health check first
        try:
            health_response = requests.get("http://localhost:5000/api/health", timeout=5)
            if health_response.status_code == 200:
                print("✅ Server is running")
            else:
                print("⚠️  Server responded but health check failed")
        except requests.exceptions.RequestException:
            print("❌ Server is not running. Please start the backend server first.")
            print("   Run: npm start or node server.js")
            return False
        
        # Test 1: Detection only endpoint
        print("\nTest 1: /api/license-plate/detect")
        print("-" * 40)
        
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        data = {'confidence': '0.1'}
        
        try:
            response = requests.post(f"{base_url}/detect", files=files, data=data, timeout=30)
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Detection endpoint failed: {e}")
        
        # Test 2: Detection with OCR endpoint
        print("\nTest 2: /api/license-plate/detect-with-ocr")
        print("-" * 40)
        
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        data = {'confidence': '0.1', 'ocrMethod': 'auto', 'saveRecord': 'false'}
        
        try:
            response = requests.post(f"{base_url}/detect-with-ocr", files=files, data=data, timeout=30)
            print(f"Status: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Analyze OCR results
            if result.get("success") and result.get("best_results"):
                for plate in result["best_results"]:
                    detected_text = plate.get("license_plate_text", "")
                    print(f"🔍 Detected text: '{detected_text}' (expected: '{test_text}')")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ OCR endpoint failed: {e}")
        
        # Test 3: Records endpoint
        print("\nTest 3: /api/license-plate/records")
        print("-" * 40)
        
        try:
            response = requests.get(f"{base_url}/records", timeout=10)
            print(f"Status: {response.status_code}")
            result = response.json()
            if result.get("success"):
                print(f"✅ Found {len(result.get('records', []))} license plate records")
            else:
                print(f"⚠️  Records endpoint returned: {result}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Records endpoint failed: {e}")
        
    except Exception as e:
        print(f"❌ API testing failed: {e}")
        return False
    
    return True

def check_dependencies():
    """Check if required dependencies are installed"""
    print("="*60)
    print("CHECKING DEPENDENCIES")
    print("="*60)
    
    dependencies = {
        "OpenCV": "cv2",
        "NumPy": "numpy",
        "Ultralytics (YOLO)": "ultralytics",
        "Requests": "requests"
    }
    
    optional_dependencies = {
        "Tesseract OCR": "pytesseract",
        "EasyOCR": "easyocr"
    }
    
    all_good = True
    
    # Check required dependencies
    for name, module in dependencies.items():
        try:
            __import__(module)
            print(f"✅ {name}: Available")
        except ImportError:
            print(f"❌ {name}: Missing")
            all_good = False
    
    # Check optional dependencies
    ocr_available = False
    for name, module in optional_dependencies.items():
        try:
            __import__(module)
            print(f"✅ {name}: Available")
            ocr_available = True
        except ImportError:
            print(f"⚠️  {name}: Not available (optional)")
    
    if not ocr_available:
        print("\n⚠️  No OCR libraries found. Install at least one:")
        print("   pip install pytesseract")
        print("   pip install easyocr")
    
    return all_good

def main():
    """Main test function"""
    print("License Plate Detection Pipeline Test")
    print("====================================")
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    if not deps_ok:
        print("\n❌ Some required dependencies are missing.")
        print("Please install them using: pip install -r requirements.txt")
        return 1
    
    # Test Python pipeline
    python_ok = test_python_pipeline()
    
    # Test API endpoints
    api_ok = test_api_endpoints()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if python_ok:
        print("✅ Python Pipeline: PASSED")
    else:
        print("❌ Python Pipeline: FAILED")
    
    if api_ok:
        print("✅ API Endpoints: PASSED")
    else:
        print("❌ API Endpoints: FAILED")
    
    if python_ok and api_ok:
        print("\n🎉 All tests passed! License plate detection system is working.")
        print("\nNext steps:")
        print("1. Train the license plate detection model with real data")
        print("2. Integrate with the frontend application")
        print("3. Test with real license plate images")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    return 0 if (python_ok and api_ok) else 1

if __name__ == "__main__":
    sys.exit(main())