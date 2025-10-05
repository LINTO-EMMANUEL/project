#!/usr/bin/env python3
"""
License Plate Detection Model Training Script
Optimized for GTX 1650 (4GB VRAM)
"""

from ultralytics import YOLO
import shutil
from pathlib import Path
import yaml

def verify_dataset():
    """Verify dataset structure and 'number_plate' class"""
    dataset_path = Path('../datasets/vehicle_detection')
    
    if not dataset_path.exists():
        print(f"❌ Dataset not found: {dataset_path}")
        return False
    
    data_yaml = dataset_path / 'data.yaml'
    if not data_yaml.exists():
        print(f"❌ data.yaml not found in {dataset_path}")
        return False
    
    try:
        with open(data_yaml, 'r') as f:
            data_config = yaml.safe_load(f)
        names = data_config.get('names', [])
        if 'number_plate' not in names:
            print(f"❌ 'number_plate' class missing! Found classes: {names}")
            return False
        idx = names.index('number_plate')
        print(f"✅ Found 'number_plate' class at index {idx}")
    except Exception as e:
        print(f"❌ Error reading data.yaml: {e}")
        return False
    
    # Check train/valid structure
    required_dirs = ['train/images', 'train/labels', 'valid/images', 'valid/labels']
    for d in required_dirs:
        dir_path = dataset_path / d
        if not dir_path.exists() or len(list(dir_path.glob('*'))) == 0:
            print(f"❌ Missing or empty directory: {dir_path}")
            return False
        else:
            print(f"✅ Found {len(list(dir_path.glob('*')))} files in {d}")
    
    print("✅ Dataset verified successfully!")
    return True

def setup_training_environment():
    """Create directories for models"""
    models_dir = Path('../models/license_plate')
    models_dir.mkdir(parents=True, exist_ok=True)
    (models_dir / 'backups').mkdir(parents=True, exist_ok=True)
    print("✅ Training environment ready")
    return True

def train_license_plate_model():
    """Train YOLOv8 model for license plate detection"""
    try:
        if not setup_training_environment():
            return False
        
        models_dir = Path('../models/license_plate')
        last_checkpoint = models_dir / 'license_plate_detector/weights/last.pt'
        best_checkpoint = models_dir / 'license_plate_detector/weights/best.pt'
        
        # Load model
        if last_checkpoint.exists():
            print(f"Found checkpoint: {last_checkpoint}")
            resume = input("Resume training? (y/n): ").strip().lower() == 'y'
            if resume:
                model = YOLO(str(last_checkpoint))
                print("Resuming from checkpoint...")
            else:
                model = YOLO('yolov8n.pt')
                resume = False
        else:
            model = YOLO('yolov8n.pt')
            resume = False
        
        print("🎯 Training parameters:")
        print("- Model: YOLOv8 Nano (smallest, fits in 4GB VRAM)")
        print("- Image size: 320 (smaller, less VRAM)")
        print("- Batch size: 4")
        print("- Epochs: 100 (enough for license plates)")
        print("- Learning rate: 0.005 (stable)")
        
        results = model.train(
            data=str(Path('../datasets/vehicle_detection/data.yaml').absolute()),
            epochs=100,
            imgsz=320,        # smaller images
            batch=4,          # lower batch size
            lr0=0.005,        # slightly lower LR for stability
            project=str(models_dir),
            name='license_plate_detector',
            workers=2,        # fewer workers to reduce RAM load
            patience=30,      # early stopping
            resume=resume,
            save=True,
            save_period=10,
            # augmentations
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=0.4,
            translate=0.1,
            scale=0.5,
            fliplr=0.5,
            mosaic=1.0,
            mixup=0.0,
            freeze=10         # freeze backbone layers to save VRAM
        )
        
        final_model_path = '../models/license_plate_detector.pt'
        if best_checkpoint.exists():
            shutil.copy2(best_checkpoint, final_model_path)
            print(f"✅ Best model saved to: {final_model_path}")
        else:
            model.save(final_model_path)
            print(f"✅ Model saved to: {final_model_path}")
        
        print("\n" + "="*60)
        print("TRAINING COMPLETED ✅")
        print("="*60)
        print(f"📁 Model path: {final_model_path}")
        print(f"📊 Logs in: {models_dir}/license_plate_detector/")
        print("Run TensorBoard with:")
        print(f"   tensorboard --logdir {models_dir}/license_plate_detector/")
        return True
    
    except Exception as e:
        print(f"❌ Training error: {e}")
        return False

def main():
    print("License Plate Detection Model Training")
    print("=====================================")
    
    print("Step 1: Verifying dataset...")
    if not verify_dataset():
        print("❌ Dataset verification failed.")
        return 1
    
    print("\nStep 2: Training model...")
    if train_license_plate_model():
        print("✅ Training completed successfully!")
        return 0
    else:
        print("❌ Training failed.")
        return 1

if __name__ == '__main__':
    main()
