/**
 * Calculate edge density in the image
 */
async function calculateEdgeDensity(imageBuffer, width, height) {
  try {
    const { data } = await sharp(imageBuffer)
      .sharpen()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let edges = 0;
    const threshold = 30;

    // Analyze horizontal and vertical edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const diffX = Math.abs(data[idx] - data[idx + 1]);
        const diffY = Math.abs(data[idx] - data[idx + width]);

        if (diffX > threshold || diffY > threshold) {
          edges++;
        }
      }
    }

    return edges / (width * height);
  } catch (error) {
    console.error("Edge density calculation error:", error);
    return THRESHOLD.EDGE_DENSITY;
  }
}

/**
 * Determine if the vehicle is likely a two-wheeler
 */
function detectTwoWheeler(aspectRatio, edgeDensity, width, height) {
  const aspectRatioMatch =
    aspectRatio >= THRESHOLD.ASPECT_RATIO_MIN &&
    aspectRatio <= THRESHOLD.ASPECT_RATIO_MAX;

  const edgeDensityMatch = edgeDensity >= THRESHOLD.EDGE_DENSITY;

  const sizeRatio = width / height;
  const verticalOrientation = sizeRatio < 1.2;

  // Weight different factors
  const score =
    (aspectRatioMatch ? 0.4 : 0) +
    (edgeDensityMatch ? 0.4 : 0) +
    (verticalOrientation ? 0.2 : 0);

  return score >= 0.6;
}

/**
 * Calculate confidence score based on multiple factors
 */
function calculateConfidence(aspectRatio, edgeDensity, is2Wheeler) {
  const aspectConfidence = Math.min(
    1.0,
    is2Wheeler
      ? Math.abs(aspectRatio - 0.65) < 0.15
        ? 0.8
        : 0.5
      : Math.abs(aspectRatio - 1.5) < 0.3
      ? 0.8
      : 0.5
  );

  const edgeConfidence = Math.min(
    1.0,
    is2Wheeler
      ? edgeDensity >= THRESHOLD.EDGE_DENSITY
        ? 0.8
        : 0.5
      : edgeDensity < THRESHOLD.EDGE_DENSITY
      ? 0.8
      : 0.5
  );

  return Math.min(
    0.95,
    THRESHOLD.CONFIDENCE_BASE + aspectConfidence * 0.15 + edgeConfidence * 0.15
  );
}

export default {
  determineVehicleType,
};
