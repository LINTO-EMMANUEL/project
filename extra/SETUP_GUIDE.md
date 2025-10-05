# Smart Park - Vehicle Detection & License Plate Recognition Setup Guide

## Overview
This system provides comprehensive vehicle detection and license plate recognition capabilities for both laptop cameras and CCTV systems. It can distinguish between 2-wheelers and 4-wheelers and extract license plate information.

## Features
- **Dual Camera Support**: Works with laptop cameras and CCTV systems (RTSP streams)
- **Vehicle Type Detection**: Automatically detects 2-wheelers vs 4-wheelers
- **License Plate Recognition**: Extracts and validates license plate numbers
- **Real-time Processing**: Live camera feed with instant detection
- **CCTV Configuration**: Easy setup for multiple CCTV cameras
- **Database Integration**: Stores vehicle entry records
- **Modern UI**: Responsive design with real-time status updates

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- Modern web browser with camera access
- For CCTV: Network access to IP cameras

### Backend Dependencies
The system uses the following key technologies:
- **Sharp**: Image processing and manipulation
- **Express.js**: Web server framework
- **MongoDB**: Database for storing records
- **Multer**: File upload handling

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Install additional image processing dependencies
npm install sharp express-rate-limit

# Create .env file with your configuration
cp .env.example .env
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/smartpark

# Server
PORT=5000
NODE_ENV=development

# Optional: For advanced vehicle detection (if using external APIs)
# ROBOFLOW_PROJECT_ID=your_project_id
# ROBOFLOW_VERSION=1
# ROBOFLOW_API_KEY=your_api_key
```

### 3. Database Setup

```bash
# Make sure MongoDB is running
# On Windows: Start MongoDB service
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# The application will automatically create the required collections
```

### 4. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

### 5. Start the Backend Server

```bash
# In a separate terminal, navigate to backend
cd backend

# Start the backend server
npm run dev
# or
npm start
```

## Usage Guide

### Laptop Camera Mode

1. **Access the System**: Navigate to the Enhanced Camera Entry page
2. **Select Camera Type**: Choose "Laptop Camera"
3. **Grant Permissions**: Allow camera access when prompted
4. **Capture Image**: Click "Capture" to take a photo
5. **Process Image**: Click "Process Image" to analyze the vehicle
6. **Save Record**: Click "Save Vehicle Entry" to store the result

### CCTV Camera Mode

1. **Select Camera Type**: Choose "CCTV Camera"
2. **Configure Camera**: Click "Configure" to set up CCTV connection
3. **Enter Details**: Provide IP address, credentials, and stream path
4. **Test Connection**: Use "Test Connection" to verify setup
5. **Save Configuration**: Save for future use
6. **Start Streaming**: The system will connect to your CCTV feed
7. **Capture & Process**: Same workflow as laptop camera

### CCTV Configuration Examples

#### Hikvision Cameras
```
Protocol: RTSP
IP: 192.168.1.100
Port: 554
Username: admin
Password: admin123
Stream Path: /Streaming/Channels/101
```

#### Dahua Cameras
```
Protocol: RTSP
IP: 192.168.1.101
Port: 554
Username: admin
Password: admin
Stream Path: /cam/realmonitor?channel=1&subtype=0
```

#### Generic RTSP
```
Protocol: RTSP
IP: 192.168.1.102
Port: 554
Username: (leave empty if no auth)
Password: (leave empty if no auth)
Stream Path: /stream1
```

## API Endpoints

### Plate Recognition
- `POST /api/plate-recognition/recognize` - Process image for plate recognition
- `POST /api/plate-recognition/save-record` - Save vehicle entry record
- `GET /api/plate-recognition/records` - Get vehicle records
- `PUT /api/plate-recognition/records/:id/exit` - Mark vehicle as exited

### Health Check
- `GET /api/health` - Check API status

## Troubleshooting

### Common Issues

#### Camera Not Working
- **Check Permissions**: Ensure browser has camera access
- **HTTPS Required**: Some browsers require HTTPS for camera access
- **Multiple Cameras**: Use device selection if multiple cameras available

#### CCTV Connection Failed
- **Network Access**: Verify IP address and network connectivity
- **Credentials**: Check username/password
- **Stream Path**: Verify correct stream path for your camera model
- **Firewall**: Ensure port 554 (RTSP) is not blocked

#### API Connection Issues
- **Backend Running**: Ensure backend server is running on port 5000
- **CORS**: Check CORS configuration in backend
- **Network**: Verify frontend can reach backend URL

#### Image Processing Errors
- **File Size**: Ensure images are under 10MB
- **Format**: Only JPEG/PNG images supported
- **Sharp Library**: Verify Sharp is properly installed

### Performance Optimization

#### For Better Detection
- **Good Lighting**: Ensure adequate lighting for clear images
- **Camera Position**: Position camera to capture full vehicle
- **Image Quality**: Use higher resolution cameras for better results
- **Clean Lens**: Keep camera lens clean

#### For CCTV Systems
- **Network Bandwidth**: Ensure sufficient bandwidth for video streams
- **Camera Resolution**: Balance resolution with network capacity
- **Stream Quality**: Use appropriate stream quality settings

## Advanced Configuration

### Custom Vehicle Detection
The system uses basic image processing for vehicle type detection. For production use, consider integrating:

- **YOLO Models**: For more accurate object detection
- **TensorFlow**: For custom trained models
- **OpenCV**: For advanced computer vision

### Enhanced OCR
For better license plate recognition, integrate:

- **Tesseract OCR**: Open-source OCR engine
- **EasyOCR**: Python-based OCR with better accuracy
- **Google Vision API**: Cloud-based OCR service

### Database Optimization
- **Indexing**: Add indexes on frequently queried fields
- **Archiving**: Implement data archiving for old records
- **Backup**: Set up regular database backups

## Security Considerations

### Network Security
- **VPN**: Use VPN for remote CCTV access
- **Firewall**: Restrict access to camera ports
- **SSL/TLS**: Use encrypted connections for CCTV streams

### Data Privacy
- **Image Storage**: Consider not storing captured images
- **Data Retention**: Implement data retention policies
- **Access Control**: Restrict access to vehicle records

## Support and Maintenance

### Regular Maintenance
- **Update Dependencies**: Keep npm packages updated
- **Monitor Performance**: Check system performance regularly
- **Backup Data**: Regular database backups
- **Log Monitoring**: Monitor application logs for errors

### Scaling Considerations
- **Load Balancing**: For multiple camera streams
- **Database Clustering**: For high-volume data
- **CDN**: For serving static assets
- **Microservices**: Split into smaller services for better scalability

## License and Credits

This system is designed for educational and demonstration purposes. For production use, ensure compliance with local regulations and privacy laws.

### Dependencies
- **Sharp**: Image processing library
- **Express.js**: Web framework
- **MongoDB**: Database
- **React**: Frontend framework
- **Tailwind CSS**: Styling framework

## Contact and Support

For technical support or questions about this implementation, please refer to the project documentation or contact the development team.
