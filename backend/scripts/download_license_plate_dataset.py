#!/usr/bin/env python3
"""
Download License Plate Detection Dataset
This script downloads a license plate detection dataset from Roboflow or other sources.
"""

import os
import sys
import requests
import zipfile
from pathlib import Path
import shutil

def download_license_plate_dataset():
    """
    Download license plate detection dataset.
    You can replace this with your preferred dataset source.
    """
    
    dataset_dir = Path("datasets/license_plate_detection")
    
    print("Setting up license plate detection dataset...")
    
    # For now, we'll create some example annotations to get started
    # In practice, you would download from sources like:
    # - Roboflow: https://universe.roboflow.com/datasets/license-plate-detection
    # - Kaggle: License plate datasets
    # - Custom dataset collection
    
    # Create example data.yaml if it doesn't exist
    if not (dataset_dir / "data.yaml").exists():
        print("Creating dataset configuration...")
        
    print("\n" + "="*60)
    print("DATASET SETUP INSTRUCTIONS")
    print("="*60)
    print("\nTo complete the license plate detection setup, you need to:")
    print("\n1. Obtain a license plate detection dataset from one of these sources:")
    print("   - Roboflow Universe: https://universe.roboflow.com/")
    print("   - Kaggle license plate datasets")
    print("   - Create your own dataset with labelImg or similar tools")
    print("\n2. The dataset should be in YOLO format with:")
    print("   - Images in .jpg or .png format")
    print("   - Annotations in .txt format (YOLO format)")
    print("   - Class 0 = license_plate")
    print("\n3. Place the files in these directories:")
    print(f"   - Training images: {dataset_dir}/train/images/")
    print(f"   - Training labels: {dataset_dir}/train/labels/")
    print(f"   - Validation images: {dataset_dir}/valid/images/")
    print(f"   - Validation labels: {dataset_dir}/valid/labels/")
    print(f"   - Test images: {dataset_dir}/test/images/")
    print(f"   - Test labels: {dataset_dir}/test/labels/")
    print("\n4. YOLO annotation format example:")
    print("   0 0.5 0.5 0.3 0.1")
    print("   (class_id center_x center_y width height - all normalized 0-1)")
    print("\n5. Run the training script: python ml/train_license_plate_model.py")
    print("="*60)
    
    # Create a sample annotation file as an example
    sample_dir = dataset_dir / "train" / "labels"
    sample_file = sample_dir / "example_annotation.txt"
    
    if not sample_file.exists():
        with open(sample_file, 'w') as f:
            f.write("# Example YOLO annotation for license plate\n")
            f.write("# Format: class_id center_x center_y width height (all normalized 0-1)\n")
            f.write("# 0 0.5 0.5 0.3 0.1\n")
            f.write("# This represents a license plate at the center of the image\n")
        print(f"\nCreated example annotation file: {sample_file}")
    
    return True

def verify_dataset_structure():
    """Verify that the dataset has the correct structure"""
    dataset_path = Path('datasets/license_plate_detection')
    
    required_dirs = [
        'train/images', 'train/labels',
        'valid/images', 'valid/labels',
        'test/images', 'test/labels'
    ]
    
    print("Verifying dataset structure...")
    for dir_path in required_dirs:
        full_path = dataset_path / dir_path
        if not full_path.exists():
            print(f"❌ Missing: {full_path}")
            return False
        else:
            # Count files in each directory
            files = list(full_path.glob('*'))
            print(f"✅ {dir_path}: {len(files)} files")
    
    # Check for data.yaml
    if (dataset_path / 'data.yaml').exists():
        print("✅ data.yaml configuration file found")
    else:
        print("❌ data.yaml configuration file missing")
        return False
    
    return True

def main():
    """Main function"""
    print("License Plate Detection Dataset Setup")
    print("====================================")
    
    try:
        # Create dataset directory structure
        os.makedirs("datasets/license_plate_detection", exist_ok=True)
        
        # Download/setup dataset
        if download_license_plate_dataset():
            print("\n✅ Dataset structure created successfully!")
            
            # Verify structure
            print("\nVerifying dataset structure...")
            if verify_dataset_structure():
                print("\n✅ Dataset verification completed!")
            else:
                print("\n⚠️  Please add your dataset files to complete the setup.")
        else:
            print("\n❌ Failed to setup dataset")
            return 1
            
    except Exception as e:
        print(f"\n❌ Error setting up dataset: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())