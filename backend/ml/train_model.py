from ultralytics import YOLO
import shutil
from pathlib import Path

def setup_dataset():
    """Setup dataset from the downloaded Roboflow export"""
    # The dataset is already in the correct location
    dataset_path = Path('datasets/vehicle_detection')
    
    if not dataset_path.exists() or not (dataset_path / 'data.yaml').exists():
        print(f"Dataset not found in {dataset_path}")
        print("Please ensure the dataset is extracted to the correct location")
        return False
    
    # Verify dataset structure
    required_items = ['test', 'train', 'valid', 'data.yaml']
    missing_items = [item for item in required_items if not (dataset_path / item).exists()]
    
    if missing_items:
        print(f"Missing required files/directories: {', '.join(missing_items)}")
        return False
        
    print("Dataset verification complete!")
    return True

def train_model():
    """Train YOLOv8 model on our vehicle dataset"""
    try:
        # Create models directory
        models_dir = Path('models/yolo')
        models_dir.mkdir(parents=True, exist_ok=True)
        
        # Check for existing checkpoint
        last_checkpoint = Path('models/yolo/vehicle_detector/weights/last.pt')
        if last_checkpoint.exists():
            print(f"Found existing checkpoint: {last_checkpoint}")
            print("Resuming training from last checkpoint...")
            model = YOLO(str(last_checkpoint))
            resume = True
        else:
            print("Starting new training with pretrained YOLOv8 model...")
            model = YOLO('yolov8n.pt')
            resume = False

        # Train the model
        results = model.train(
            data=str(Path('datasets/vehicle_detection/data.yaml').absolute()),
            epochs=100,  # full training for maximum accuracy
            imgsz=640,  # image size
            batch=16,   # batch size
            project='models/yolo',  # project directory
            name='vehicle_detector',  # save trained model as
            verbose=True,  # print training progress
            resume=resume  # resume from last checkpoint if available
        )
        
        # Save the trained model
        model.save('models/vehicle_detector.pt')
        print("Model training complete!")
        return True
        
    except Exception as e:
        print(f"Error training model: {e}")
        return False

def main():
    print("Setting up dataset...")
    if setup_dataset():
        print("\nStarting model training...")
        train_model()
    else:
        print("Failed to setup dataset. Please check the paths and try again.")

if __name__ == '__main__':
    main()