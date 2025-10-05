# License Plate Detection System Setup Guide

## Overview

This guide explains how to set up and use the separate license plate detection system that has been added to your Smart Park system. The license plate detector works independently from the vehicle classification system and includes both license plate detection and OCR (Optical Character Recognition) capabilities.

## System Architecture

### Components Created:

1. **Dataset Structure** (`datasets/license_plate_detection/`)
   - Training, validation, and test directories
   - YOLO format annotations support
   - Configuration file for model training

2. **Training Pipeline** (`ml/train_license_plate_model.py`)
   - YOLOv8-based license plate detection model training
   - Optimized hyperparameters for license plate detection
   - Progress tracking and model saving

3. **Detection Services**:
   - `ml/detect_license_plate.py` - License plate detection only
   - `ml/license_plate_ocr.py` - OCR text extraction
   - `ml/license_plate_full_service.py` - Combined detection + OCR

4. **API Endpoints** (`routes/licensePlateDetection.js`)
   - `/api/license-plate/detect` - Detection only
   - `/api/license-plate/detect-with-ocr` - Detection + text extraction
   - `/api/license-plate/records` - Database operations
   - `/api/license-plate/search` - Search license plates by text

5. **Database Model** (`models/PlateRecord.js`)
   - Stores license plate detection results
   - Includes text, confidence scores, timestamps
   - Supports metadata and search functionality

## Installation & Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The new dependencies include:
- `pytesseract` - Tesseract OCR wrapper
- `easyocr` - Alternative OCR engine
- `scipy` - Scientific computing
- `scikit-image` - Image processing

### 2. Install OCR Engines

#### Option A: Tesseract (Recommended)
**Windows:**
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install and add to PATH
3. Set environment variable if needed:
   ```bash
   set TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
   ```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract
```

#### Option B: EasyOCR (Alternative)
EasyOCR is included in requirements.txt and doesn't need additional system installation.

### 3. Prepare Dataset

#### Quick Start (Testing):
```bash
cd backend
python scripts/download_license_plate_dataset.py
```

This creates the directory structure and provides instructions for adding your dataset.

#### For Production Use:
1. Collect license plate images
2. Annotate them using tools like:
   - [LabelImg](https://github.com/tzutalin/labelImg)
   - [Roboflow](https://roboflow.com/)
   - [CVAT](https://github.com/opencv/cvat)

3. Convert annotations to YOLO format:
   ```
   Format: class_id center_x center_y width height
   Example: 0 0.5 0.3 0.4 0.1
   ```

4. Place files in the dataset directories:
   ```
   datasets/license_plate_detection/
   ├── train/
   │   ├── images/ (training images)
   │   └── labels/ (training annotations)
   ├── valid/
   │   ├── images/ (validation images)
   │   └── labels/ (validation annotations)
   └── test/
       ├── images/ (test images)
       └── labels/ (test annotations)
   ```

### 4. Train the Model

```bash
cd backend
python ml/train_license_plate_model.py
```

Training parameters:
- **Epochs**: 150 (more than vehicle detection due to smaller objects)
- **Image size**: 640x640
- **Batch size**: 16
- **Model**: YOLOv8 Nano (optimized for speed)
- **Augmentation**: Optimized for license plates (no rotation/shear)

Expected training time:
- With GPU: 2-4 hours (depending on dataset size)
- With CPU: 8-12 hours

### 5. Test the System

```bash
cd backend
python test_license_plate_pipeline.py
```

This test script will:
- Check all dependencies
- Test Python detection pipeline
- Test OCR functionality
- Test API endpoints
- Generate a comprehensive report

## Usage

### API Endpoints

#### 1. Detect License Plates (Detection Only)
```bash
POST /api/license-plate/detect
Content-Type: multipart/form-data

Parameters:
- image: Image file
- confidence: Detection confidence threshold (0.0-1.0, default: 0.25)
```

Response:
```json
{
  "success": true,
  "license_plates_detected": 2,
  "detections": [
    {
      "confidence": 0.85,
      "bbox": {"x1": 100, "y1": 200, "x2": 300, "y2": 250},
      "aspect_ratio": 3.2,
      "area": 10000
    }
  ]
}
```

#### 2. Detect and Read License Plates (Detection + OCR)
```bash
POST /api/license-plate/detect-with-ocr
Content-Type: multipart/form-data

Parameters:
- image: Image file
- confidence: Detection confidence threshold (default: 0.25)
- ocrMethod: OCR method ("auto", "tesseract", "easyocr", default: "auto")
- saveRecord: Save to database (true/false, default: true)
```

Response:
```json
{
  "success": true,
  "detection_summary": {
    "plates_detected": 1,
    "plates_with_text": 1
  },
  "best_results": [
    {
      "plate_id": 1,
      "license_plate_text": "ABC123",
      "detection_confidence": 0.89,
      "ocr_confidence": 92.5,
      "bbox": {"x1": 150, "y1": 220, "x2": 280, "y2": 260}
    }
  ]
}
```

#### 3. Get License Plate Records
```bash
GET /api/license-plate/records?limit=50&offset=0&status=detected
```

#### 4. Search License Plates
```bash
GET /api/license-plate/search?q=ABC&limit=20
```

### Command Line Usage

#### Direct Detection:
```bash
cd backend
python ml/detect_license_plate.py image.jpg 0.25 output_annotated.jpg
```

#### Detection + OCR:
```bash
cd backend
python ml/license_plate_full_service.py image.jpg 0.25 auto output_annotated.jpg
```

#### OCR Only:
```bash
cd backend
python ml/license_plate_ocr.py license_plate_crop.jpg auto
```

### Frontend Integration

To integrate with your React frontend, you can use the existing image upload components:

```javascript
// Example integration
const detectLicensePlate = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('confidence', '0.25');
  formData.append('ocrMethod', 'auto');
  
  try {
    const response = await fetch('/api/license-plate/detect-with-ocr', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success && result.best_results.length > 0) {
      console.log('License plates found:', result.best_results);
      // Display results in UI
    }
  } catch (error) {
    console.error('License plate detection failed:', error);
  }
};
```

## Performance Optimization

### For Better Accuracy:
1. **Train with more data**: Collect 1000+ diverse license plate images
2. **Use higher resolution**: Process images at 832x832 instead of 640x640
3. **Fine-tune confidence**: Adjust threshold based on your use case
4. **Preprocessing**: Enhance image quality before detection

### For Better Speed:
1. **Use YOLOv8n**: Fastest model variant (already configured)
2. **Resize images**: Downscale large images before processing
3. **GPU acceleration**: Use CUDA-enabled GPU for inference
4. **Batch processing**: Process multiple images together

### OCR Optimization:
1. **Image preprocessing**: Enhance contrast and remove noise
2. **Character whitelist**: Limit to expected characters (A-Z, 0-9)
3. **Multiple OCR engines**: Use both Tesseract and EasyOCR for comparison
4. **Post-processing**: Apply license plate format validation

## Troubleshooting

### Common Issues:

#### 1. "No license plates detected"
- **Solution**: Lower confidence threshold (try 0.1-0.2)
- **Cause**: Model not trained yet or poor image quality

#### 2. "OCR libraries not available"
- **Solution**: Install Tesseract or ensure EasyOCR is properly installed
- **Check**: Run `python -c "import pytesseract; import easyocr"`

#### 3. "Python script failed"
- **Solution**: Check Python path and dependencies
- **Debug**: Run scripts individually to isolate the issue

#### 4. "Low OCR accuracy"
- **Solution**: Improve image quality or try different OCR methods
- **Tip**: Extract license plate region first, then apply OCR

#### 5. "Training fails"
- **Solution**: Ensure dataset is properly formatted and sufficient
- **Check**: Verify data.yaml and annotation files

### Performance Monitoring:

Monitor these metrics:
- **Detection confidence**: Should be >0.5 for reliable results
- **OCR confidence**: Should be >70% for good text extraction
- **Processing time**: Should be <5 seconds per image
- **Memory usage**: Monitor for memory leaks with large datasets

## Future Enhancements

### Planned Improvements:
1. **Real-time processing**: Live camera feed integration
2. **Multi-language support**: International license plate formats
3. **Database analytics**: License plate frequency and patterns
4. **Integration with parking system**: Automatic vehicle registration
5. **Mobile app support**: React Native compatibility
6. **Advanced filtering**: Region-specific license plate validation

### Training Data Recommendations:
- **Minimum**: 500 images per class
- **Recommended**: 2000+ images with diverse conditions
- **Include**: Different angles, lighting, weather conditions
- **Formats**: Various license plate styles and regions

This completes the license plate detection system setup. The system is designed to work alongside your existing vehicle classification without interference.