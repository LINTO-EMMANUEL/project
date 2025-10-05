import os
import sys
from pathlib import Path
import requests
import zipfile
import shutil

def download_dataset():
    """
    Downloads a vehicle detection dataset from Roboflow
    and organizes it into our test directory structure
    """
    # Create test directories if they don't exist
    base_dir = Path('test_images')
    for dir_path in [
        '2_wheelers/motorcycles',
        '2_wheelers/scooters',
        '4_wheelers/cars',
        '4_wheelers/other',
        'mixed/multiple_vehicles',
        'mixed/edge_cases'
    ]:
        (base_dir / dir_path).mkdir(parents=True, exist_ok=True)

    # Download vehicle dataset from Roboflow
    # Using the "Vehicle Detection" dataset as an example
    print("Downloading dataset...")
    
    # Vehicle-Detection dataset by Noureddine
    DATASET_URL = "https://universe.roboflow.com/noureddine-benkhalifa/vehicle-detection-3zndk/dataset/1"
    
    try:
        response = requests.get(DATASET_URL, stream=True)
        if response.status_code == 200:
            # Save the zip file
            zip_path = "dataset.zip"
            with open(zip_path, 'wb') as f:
                f.write(response.content)

            # Extract the dataset
            print("Extracting dataset...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall("temp_dataset")

            # Organize images into our test directory structure
            print("Organizing images...")
            temp_dir = Path("temp_dataset")
            
            # Move images to appropriate directories based on their annotations
            for img_path in temp_dir.glob("train/images/*.jpg"):
                # Read corresponding annotation file
                ann_path = temp_dir / "train" / "labels" / f"{img_path.stem}.txt"
                
                if ann_path.exists():
                    with open(ann_path, 'r') as f:
                        annotations = f.readlines()
                    
                    # Determine vehicle type from annotations
                    if any("motorcycle" in ann or "bike" in ann for ann in annotations):
                        dest_dir = base_dir / "2_wheelers" / "motorcycles"
                    elif any("car" in ann for ann in annotations):
                        dest_dir = base_dir / "4_wheelers" / "cars"
                    elif len(annotations) > 1:
                        dest_dir = base_dir / "mixed" / "multiple_vehicles"
                    else:
                        dest_dir = base_dir / "4_wheelers" / "other"
                    
                    # Copy image to appropriate directory
                    shutil.copy2(img_path, dest_dir / img_path.name)

            # Cleanup
            print("Cleaning up...")
            os.remove(zip_path)
            shutil.rmtree("temp_dataset")
            
            print("Dataset downloaded and organized successfully!")
            print(f"Images are ready in the {base_dir} directory")

        else:
            print(f"Failed to download dataset: {response.status_code}")
            
    except Exception as e:
        print(f"Error downloading or processing dataset: {e}")

if __name__ == "__main__":
    download_dataset()