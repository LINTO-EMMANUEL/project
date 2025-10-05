from ultralytics import YOLO

# Load a model
model = YOLO('yolov8n.pt')  # load a pretrained model

# Export the model
model.export(format='onnx', opset=12)  # export the model to ONNX format