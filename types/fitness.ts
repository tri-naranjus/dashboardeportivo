export interface UserProfile {
  ftp: number; // Functional Threshold Power (watts)
  lthr: number; // Lactate Threshold Heart Rate (bpm)
  maxHR: number;
  weight: number; // kg
  sportFocus: 'running' | 'cycling' | 'both';
  name: string;
  tdee: number; // Total Daily Energy Expenditure (kcal)
}

export interface ActivityData {
  id: string;
  stravaId?: number;
  date: string; // ISO date string
  type: 'Run' | 'Ride' | 'Swim' | 'WeightTraining' | string;
  durationSeconds: number;
  distanceMeters: number;
  averagePower?: number; // watts (cycling)
  averageHeartRate?: number; // bpm
  normalizedPower?: number; // watts
  tss: number; // Calculated Training Stress Score
  intensityFactor: number; // IF = NP / FTP
  zones: ZoneDistribution;
}

export interface ZoneDistribution {
  zone1Seconds: number; // Recovery
  zone2Seconds: number; // Aerobic / Zone 2
  zone3Seconds: number; // Tempo
  zone4Seconds: number; // Threshold
  zone5Seconds: number; // VO2max
}

export interface FitnessMetrics {
  ctl: number; // Chronic Training Load (42-day EMA)
  atl: number; // Acute Training Load (7-day EMA)
  tsb: number; // Training Stress Balance = CTL - ATL
  date: string;
  history: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
    tss: number;
  }>;
}

export type TrainingStatus =
  | 'high_intensity' // TSB > 10
  | 'moderate' // TSB 0-10
  | 'zone2_priority' // TSB -10 to 0
  | 'recovery'; // TSB < -10
