export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  athleteId: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_watts?: number;
  weighted_average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kilojoules?: number;
  suffer_score?: number;
  perceived_exertion?: number;
  zones?: StravaActivityZones;
}

export interface StravaActivityZones {
  distribution_buckets: Array<{
    max: number;
    min: number;
    time: number;
  }>;
  type: 'heartrate' | 'power';
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
}
