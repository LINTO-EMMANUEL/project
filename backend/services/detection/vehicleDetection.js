import sharp from "sharp";

// your original constants
const THRESHOLD = {
  EDGE_DENSITY: 0.4,
  ASPECT_RATIO_MIN: 0.5,
  ASPECT_RATIO_MAX: 0.8,
  CONFIDENCE_BASE: 0.7,
};

/* -------------------------------------------------
   1.  your original helpers (unchanged)
-------------------------------------------------- */
async function calculateEdgeDensity(imageBuffer, width, height) {
  try {
    const { data } = await sharp(imageBuffer)
      .sharpen()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let edges = 0;
    const threshold = 30;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const diffX = Math.abs(data[idx] - data[idx + 1]);
        const diffY = Math.abs(data[idx] - data[idx + width]);
        if (diffX > threshold || diffY > threshold) edges++;
      }
    }
    return edges / (width * height);
  } catch (err) {
    console.error("Edge density calculation error:", err);
    return THRESHOLD.EDGE_DENSITY;
  }
}

function detectTwoWheeler(aspectRatio, edgeDensity, width, height) {
  const aspectOk =
    aspectRatio >= THRESHOLD.ASPECT_RATIO_MIN &&
    aspectRatio <= THRESHOLD.ASPECT_RATIO_MAX;
  const edgeOk = edgeDensity >= THRESHOLD.EDGE_DENSITY;
  const vertical = width / height < 1.2;
  const score = (aspectOk ? 0.4 : 0) + (edgeOk ? 0.4 : 0) + (vertical ? 0.2 : 0);
  return score >= 0.6;
}

function calculateConfidence(aspectRatio, edgeDensity, is2Wheeler) {
  const aspConf = is2Wheeler
    ? Math.abs(aspectRatio - 0.65) < 0.15 ? 0.8 : 0.5
    : Math.abs(aspectRatio - 1.5) < 0.3 ? 0.8 : 0.5;

  const edgeConf = is2Wheeler
    ? edgeDensity >= THRESHOLD.EDGE_DENSITY ? 0.8 : 0.5
    : edgeDensity < THRESHOLD.EDGE_DENSITY ? 0.8 : 0.5;

  return Math.min(0.95, THRESHOLD.CONFIDENCE_BASE + aspConf * 0.15 + edgeConf * 0.15);
}

/* -------------------------------------------------
   2.  your ORIGINAL export (unchanged signature)
-------------------------------------------------- */
export const determineVehicleType = async (imageBuffer) => {
  try {
    const { width, height } = await sharp(imageBuffer).metadata();
    const aspectRatio = width / height;

    const processed = await sharp(imageBuffer).greyscale().normalize().toBuffer();
    const edgeDensity = await calculateEdgeDensity(processed, width, height);
    const is2Wheeler = detectTwoWheeler(aspectRatio, edgeDensity, width, height);
    const confidence = calculateConfidence(aspectRatio, edgeDensity, is2Wheeler);

    return {
      type: is2Wheeler ? "2-wheeler" : "4-wheeler",
      confidence,
      metadata: { aspectRatio, edgeDensity, dimensions: { width, height } },
    };
  } catch (err) {
    console.error("Vehicle detection error:", err);
    return { type: "4-wheeler", confidence: 0.3, error: err.message };
  }
};

/* -------------------------------------------------
   3.  NEW helper (optional) – returns BOTH vehicle
       type AND plate crop (you can ignore this)
-------------------------------------------------- */
export const detectVehicleAndPlate = async (imageBuffer) => {
  const vehicle = await determineVehicleType(imageBuffer);   // your original logic
  const plate = await detectPlate(imageBuffer);              // see plateDetector.js
  return { vehicle, plate };
};

/* -------------------------------------------------
   4.  default export kept for compatibility
-------------------------------------------------- */
export default { determineVehicleType, detectVehicleAndPlate };