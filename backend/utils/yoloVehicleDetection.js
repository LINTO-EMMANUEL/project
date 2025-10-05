import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Detects vehicle type from an image using trained YOLOv8 model
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<{success: boolean, vehicleType: string, confidence: number, bbox?: number[]}>}
 */
export const detectVehicle = async (imageBuffer) => {
  try {
    // Create a temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, "../temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Save the buffer to a temporary file
    const tempImagePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
    await fs.writeFile(tempImagePath, imageBuffer);

    // Path to the Python script
    const scriptPath = path.join(__dirname, "../ml/detect.py");

    return new Promise((resolve, reject) => {
      // Spawn Python process
      const pythonProcess = spawn("python", [scriptPath, tempImagePath], {
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let result = "";
      let error = "";

      // Collect data from stdout
      pythonProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        console.log("Received stdout chunk:", chunk);
        result += chunk;
      });

      // Cleanup function
      const cleanup = async () => {
        try {
          await fs.unlink(tempImagePath);
        } catch (err) {
          console.error("Error cleaning up temp file:", err);
        }
      };

      // Parse only the JSON result between markers
      const parseResult = (output) => {
        console.log("Parsing output:", output);

        // Find the position of markers
        const startIndex = output.lastIndexOf("RESULT_START");
        const endIndex = output.lastIndexOf("RESULT_END");

        if (startIndex === -1 || endIndex === -1) {
          console.error(
            "Missing markers in output. Start marker:",
            startIndex,
            "End marker:",
            endIndex
          );
          console.error("Full output:", output);
          throw new Error("No valid result markers found in output");
        }

        // Extract everything between RESULT_START and RESULT_END, handling any kind of newlines
        const markerContent = output.slice(
          startIndex + "RESULT_START".length,
          endIndex
        );
        const jsonStr = markerContent.replace(/^[\r\n]+|[\r\n]+$/g, "").trim();

        try {
          console.log("Attempting to parse JSON string:", jsonStr);
          const result = JSON.parse(jsonStr);
          console.log("Successfully parsed result:", result);
          return result;
        } catch (err) {
          console.error("Failed to parse JSON. String:", jsonStr);
          console.error("Parse error:", err);
          throw new Error("Failed to parse detection result: " + err.message);
        }
      };

      // Collect any errors
      pythonProcess.stderr.on("data", (data) => {
        const errorMsg = data.toString();
        error += errorMsg;
        console.log("Python stderr:", errorMsg); // Debug log for monitoring detection process
      });

      // Handle process completion
      pythonProcess.on("close", async (code) => {
        // Clean up the temporary file
        try {
          await fs.unlink(tempImagePath);
        } catch (cleanupError) {
          console.error("Error cleaning up temporary file:", cleanupError);
        }

        if (code !== 0) {
          console.error("Python script error:", error);
          reject(new Error("Failed to process image"));
          return;
        }

        try {
          console.log("Raw output before parsing:", result);
          const detection = parseResult(result);

          // Always resolve with the detection result, even if no vehicle was found
          const response = {
            success: detection.success,
            error: detection.error,
            vehicleType: detection.vehicle_type,
            confidence: detection.confidence,
            bbox: detection.bbox,
          };

          console.log("Final response:", response);
          resolve(response);
        } catch (parseError) {
          console.error("Error parsing detection result:", parseError);
          reject(parseError);
        }
      });

      // Handle process error
      pythonProcess.on("error", (err) => {
        console.error("Failed to start Python process:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Vehicle detection error:", error);
    throw error;
  }
};
