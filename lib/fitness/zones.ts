/**
 * Power zones based on FTP (for cycling)
 * Standard Coggan zones
 */
export function getPowerZones(ftp: number) {
  return {
    zone1: { min: 0, max: Math.round(ftp * 0.55) }, // Recovery
    zone2: { min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75) }, // Aerobic
    zone3: { min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.9) }, // Tempo
    zone4: { min: Math.round(ftp * 0.9), max: Math.round(ftp * 1.05) }, // Threshold
    zone5: { min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.2) }, // VO2max
    zone6: { min: Math.round(ftp * 1.2), max: Math.round(ftp * 1.5) }, // Anaerobic
    zone7: { min: Math.round(ftp * 1.5), max: Math.round(ftp * 2.5) }, // Neuromuscular
  };
}

/**
 * Heart rate zones based on LTHR (for running and general cardio)
 * Estimated % of LTHR
 */
export function getHeartRateZones(lthr: number) {
  return {
    zone1: { min: 0, max: Math.round(lthr * 0.85) }, // Recovery
    zone2: { min: Math.round(lthr * 0.85), max: Math.round(lthr * 0.95) }, // Aerobic / Z2
    zone3: { min: Math.round(lthr * 0.95), max: Math.round(lthr * 1.05) }, // Tempo
    zone4: { min: Math.round(lthr * 1.05), max: Math.round(lthr * 1.2) }, // Threshold
    zone5: { min: Math.round(lthr * 1.2), max: Math.round(lthr * 1.5) }, // VO2max
  };
}

/**
 * Classify power into zone (1-7)
 */
export function getPowerZone(power: number, ftp: number): number {
  const ifValue = power / ftp;
  if (ifValue < 0.55) return 1;
  if (ifValue < 0.75) return 2;
  if (ifValue < 0.9) return 3;
  if (ifValue < 1.05) return 4;
  if (ifValue < 1.2) return 5;
  if (ifValue < 1.5) return 6;
  return 7;
}

/**
 * Classify heart rate into zone (1-5)
 */
export function getHeartRateZone(hr: number, lthr: number): number {
  const hrPercent = hr / lthr;
  if (hrPercent < 0.85) return 1;
  if (hrPercent < 0.95) return 2;
  if (hrPercent < 1.05) return 3;
  if (hrPercent < 1.2) return 4;
  return 5;
}
