/**
 * Calculate Training Stress Score (TSS)
 * TSS = (duration_seconds × IF² × 100) / 3600
 * where IF = Normalized Power / FTP
 * or IF ≈ (avgHR - restHR) / (LTHR - restHR) if no power data
 */
export function calculateTSS(
  durationSeconds: number,
  normalizedPower: number | undefined,
  avgHeartRate: number | undefined,
  ftp: number,
  lthr: number,
  restHR = 50
): number {
  let intensityFactor: number;

  if (normalizedPower && ftp > 0) {
    intensityFactor = normalizedPower / ftp;
  } else if (avgHeartRate && lthr > 0) {
    intensityFactor = (avgHeartRate - restHR) / (lthr - restHR);
    // Cap at 120% to avoid unrealistic values
    intensityFactor = Math.min(intensityFactor, 1.2);
  } else {
    // Default conservative estimate for missing data
    intensityFactor = 0.65;
  }

  // TSS formula
  const tss = (durationSeconds * Math.pow(intensityFactor, 2) * 100) / 3600;
  return Math.round(tss * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate Intensity Factor from power or HR
 */
export function calculateIF(
  normalizedPower: number | undefined,
  avgHeartRate: number | undefined,
  ftp: number,
  lthr: number,
  restHR = 50
): number {
  if (normalizedPower && ftp > 0) {
    return Math.round((normalizedPower / ftp) * 1000) / 1000;
  } else if (avgHeartRate && lthr > 0) {
    let ifValue = (avgHeartRate - restHR) / (lthr - restHR);
    ifValue = Math.min(ifValue, 1.2);
    return Math.round(ifValue * 1000) / 1000;
  }
  return 0.65;
}
