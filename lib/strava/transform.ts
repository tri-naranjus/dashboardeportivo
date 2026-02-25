import { StravaActivity } from '@/types/strava';
import { ActivityData } from '@/types/fitness';
import { calculateTSS, calculateIF } from '@/lib/fitness/tss';

/**
 * Transform Strava activity to internal ActivityData format
 * Calculate TSS from power data or estimated from HR
 */
export function transformStravaActivity(
  activity: StravaActivity,
  ftp: number,
  lthr: number
): ActivityData {
  const durationSeconds = activity.moving_time || activity.elapsed_time;
  const normalizedPower = activity.weighted_average_watts;
  const avgHeartRate = activity.average_heartrate;

  const tss = calculateTSS(
    durationSeconds,
    normalizedPower,
    avgHeartRate,
    ftp,
    lthr
  );

  const intensityFactor = calculateIF(
    normalizedPower,
    avgHeartRate,
    ftp,
    lthr
  );

  return {
    id: `strava-${activity.id}`,
    stravaId: activity.id,
    date: activity.start_date.split('T')[0], // ISO date string
    type: activity.sport_type as
      | 'Run'
      | 'Ride'
      | 'Swim'
      | 'WeightTraining'
      | string,
    durationSeconds,
    distanceMeters: Math.round(activity.distance),
    averagePower: normalizedPower,
    averageHeartRate: avgHeartRate,
    normalizedPower,
    tss,
    intensityFactor,
    zones: {
      zone1Seconds: 0, // Strava doesn't provide zone breakdown in basic API
      zone2Seconds: 0,
      zone3Seconds: 0,
      zone4Seconds: 0,
      zone5Seconds: 0,
    },
  };
}
