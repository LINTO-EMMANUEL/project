// platedetector.js
import { spawn } from "node:child_process";
import { join } from "node:path";
import { cwd } from "node:process";

const VEHICLE_CLASSES = {
  2: "car",
  5: "bus",
  7: "truck",
  3: "motorcycle",
};

const PY_SCRIPT = join(cwd(), "backend/ml/vehicle_detect.py");
// Increase python timeout to 60s to accommodate heavier models on slower machines
const PY_TIMEOUT = 60_000; // ms

/**
 * Detect vehicles in an image using YOLO model
 * @param {Buffer} imageBuffer – raw image bytes
 * @returns {Promise<{
 *   success: boolean,
 *   vehicleType: string | null,
 *   confidence: number,
 *   detectionCount: number,
 *   allPredictions: Array<{type:string,confidence:number,bbox:number[]}>,
 *   rawDetections: {wheelers:Array<any>},
 *   error?: string
 * }>}
 */
export async function detectVehicle(imageBuffer) {
  let py;
  try {
    py = spawn("python", [PY_SCRIPT], { stdio: ["pipe", "pipe", "pipe"] });

    const stdout = [];
    const stderr = [];

    py.stdin.end(imageBuffer); // send image once, then close stdin

    py.stdout.on("data", (c) => stdout.push(c));
    py.stderr.on("data", (c) => stderr.push(c));

    // Create a timeout that will kill the Python process if it takes too long
    let timer = null;
    const closePromise = new Promise((res) => py.on("close", res));
    const timeoutPromise = new Promise((_, rej) => {
      timer = setTimeout(() => {
        try {
          if (!py.killed) py.kill("SIGTERM");
        } catch (e) {
          // ignore kill errors
        }
        rej(new Error(`Python process timed out after ${PY_TIMEOUT}ms`));
      }, PY_TIMEOUT);
    });

    const code = await Promise.race([closePromise, timeoutPromise]);
    if (timer) clearTimeout(timer);

    if (code !== 0)
      throw new Error(
        `Python exited with ${code}: ${Buffer.concat(stderr).toString()}`
      );

    const raw = Buffer.concat(stdout).toString().trim();
    if (!raw) throw new Error("Empty response from Python");

    const { detections } = JSON.parse(raw); // <-- may throw
    if (!Array.isArray(detections))
      throw new Error("Malformed JSON: detections array missing");

    const wheelers = detections.map((d) => ({
      type: VEHICLE_CLASSES[d.class] ?? "unknown",
      confidence: Number(d.confidence) || 0,
      bbox: d.bbox ?? [],
    }));

    const best =
      wheelers.length === 0
        ? { type: null, confidence: 0 }
        : wheelers.reduce((p, c) => (c.confidence > p.confidence ? c : p));

    return {
      success: true,
      vehicleType: best.type,
      confidence: best.confidence,
      detectionCount: wheelers.length,
      allPredictions: wheelers,
      rawDetections: { wheelers },
    };
  } catch (err) {
    if (py && !py.killed) py.kill("SIGTERM");
    return {
      success: false,
      error: err.message || "Unknown detection error",
      vehicleType: null,
      confidence: 0,
      detectionCount: 0,
      allPredictions: [],
      rawDetections: { wheelers: [] },
    };
  }
}
