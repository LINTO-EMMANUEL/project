/**
 * Test script to verify backend setup and dependencies
 * Run with: node test-setup.js
 */

import sharp from 'sharp';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Smart Park Backend Setup...\n');

// Test 1: Environment Variables
console.log('1. Testing Environment Variables:');
const requiredEnvVars = ['MONGO_URI', 'PORT'];
let envVarsOk = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`   ❌ ${varName}: Not set`);
    envVarsOk = false;
  }
});

if (!envVarsOk) {
  console.log('\n⚠️  Please set missing environment variables in .env file');
}

// Test 2: Sharp Image Processing
console.log('\n2. Testing Sharp Image Processing:');
try {
  // Create a test image buffer
  const testImage = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  }).jpeg().toBuffer();
  
  console.log('   ✅ Sharp library working correctly');
  console.log(`   📊 Test image size: ${testImage.length} bytes`);
} catch (error) {
  console.log('   ❌ Sharp library error:', error.message);
}

// Test 3: MongoDB Connection
console.log('\n3. Testing MongoDB Connection:');
try {
  if (!process.env.MONGO_URI) {
    console.log('   ⚠️  MONGO_URI not set, skipping MongoDB test');
  } else {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('   ✅ MongoDB connection successful');
    await mongoose.disconnect();
  }
} catch (error) {
  console.log('   ❌ MongoDB connection failed:', error.message);
}

// Test 4: Import Vehicle Detection
console.log('\n4. Testing Vehicle Detection Module:');
try {
  const { determineVehicleType } = await import('./utils/vehicleDetection.js');
  console.log('   ✅ Vehicle detection module imported successfully');
  
  // Test with a simple image
  const testImage = await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 128, g: 128, b: 128 }
    }
  }).jpeg().toBuffer();
  
  const result = await determineVehicleType(testImage);
  console.log('   📊 Test detection result:', result);
} catch (error) {
  console.log('   ❌ Vehicle detection error:', error.message);
}

// Test 5: Import Plate Recognition
console.log('\n5. Testing Plate Recognition Module:');
try {
  const { extractLicensePlateText } = await import('./utils/PlateRecognition.js');
  console.log('   ✅ Plate recognition module imported successfully');
  
  // Test with a simple image
  const testImage = await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 200, g: 200, b: 200 }
    }
  }).jpeg().toBuffer();
  
  const result = await extractLicensePlateText(testImage);
  console.log('   📊 Test recognition result:', {
    plate: result.plateNumber,
    vehicleType: result.vehicleType,
    confidence: result.confidence
  });
} catch (error) {
  console.log('   ❌ Plate recognition error:', error.message);
}

console.log('\n🎉 Backend setup test completed!');
console.log('\n📝 Next steps:');
console.log('   1. Fix any errors shown above');
console.log('   2. Start the backend server: npm run dev');
console.log('   3. Test the API endpoints');
console.log('   4. Start the frontend: npm run dev (from project root)');
