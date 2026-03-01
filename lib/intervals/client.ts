/**
 * Intervals.icu API Client
 * Fetches activities with precise TSS, IF, and power data
 * Auth: HTTP Basic (username=API_KEY, password=your_api_key)
 */

import { ActivityData, ZoneDistribution } from '@/types/fitness';
import { getIntervalsIcuAuthHeader } from './auth';

/**
 * Fetch activities from Intervals.icu for the last N days
 * Much more accurate TSS/IF than Strava
 *
 * API: GET /api/v1/athlete/{id}/activities
 * Params: oldest (required), newest (optional), limit
 *
 * Note: the API returns all activities in the date range in a single call.
 * Setting 'newest' to tomorrow is required to include today's activities.
 */
export async function fetchActivitiesFromIntervalsIcu(
  apiKey: string,
  athleteId: string,
  daysBack: number = 180
): Promise<ActivityData[]> {
  const activities: ActivityData[] = [];

  try {
    const url = new URL(
      `https://intervals.icu/api/v1/athlete/${athleteId}/activities`
    );

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    url.searchParams.set('oldest', fromDate.toISOString().split('T')[0]);

    // Set newest to tomorrow so today's activities are always included
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 1);
    url.searchParams.set('newest', toDate.toISOString().split('T')[0]);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: getIntervalsIcuAuthHeader(apiKey),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Intervals.icu API error: ${response.status}`);
      return [];
    }

    const rawActivities = await response.json();
    const activityList: Record<string, any>[] = Array.isArray(rawActivities)
      ? rawActivities
      : rawActivities.activities || [];

    for (const activity of activityList) {
      const activityData = transformIntervalsActivity(activity);
      if (activityData) {
        activities.push(activityData);
      }
    }

    return activities;
  } catch (error) {
    console.error('Error fetching from Intervals.icu:', error);
    return [];
  }
}

/**
 * Transform Intervals.icu Activity schema to our internal ActivityData format
 *
 * Intervals.icu Activity fields (from OpenAPI spec):
 *  - id: string
 *  - start_date_local: string
 *  - type: string (Ride, Run, Swim, TrailRun, WeightTraining, etc.)
 *  - moving_time: int (seconds)
 *  - distance: float (meters)
 *  - icu_training_load: int (TSS equivalent)
 *  - icu_intensity: float (IF equivalent)
 *  - icu_ftp: int
 *  - average_heartrate: int
 *  - max_heartrate: int
 *  - icu_weighted_avg_watts: int (Normalized Power)
 *  - icu_average_watts: int
 *  - icu_hr_zone_times: int[] (seconds in each HR zone)
 *  - pace: float
 */
function transformIntervalsActivity(
  activity: Record<string, any>
): ActivityData | null {
  if (!activity.start_date_local) {
    return null;
  }

  // Duration: prefer moving_time, fallback to elapsed_time or icu_recording_time
  const durationSeconds =
    activity.moving_time || activity.elapsed_time || activity.icu_recording_time || 0;

  if (durationSeconds === 0) return null;

  // Parse type — Intervals.icu uses standard type names
  const typeMap: Record<string, string> = {
    Ride: 'Ride',
    VirtualRide: 'Ride',
    EBikeRide: 'Ride',
    GravelRide: 'Ride',
    MountainBikeRide: 'Ride',
    Run: 'Run',
    VirtualRun: 'Run',
    TrailRun: 'Run',
    Swim: 'Swim',
    OpenWaterSwim: 'Swim',
    Walk: 'Run',
    Hike: 'Run',
    WeightTraining: 'WeightTraining',
    NordicSki: 'Run',
    AlpineSki: 'Run',
    Rowing: 'Swim',
    Kayaking: 'Swim',
    Yoga: 'WeightTraining',
  };
  const type = typeMap[activity.type] || activity.type || 'Run';

  // TSS: Intervals.icu provides icu_training_load (equivalent to TSS)
  const tss = activity.icu_training_load || estimateTSS(durationSeconds, activity);

  // IF (Intensity Factor): icu_intensity from Intervals.icu is in percentage (0-100)
  // Convert to decimal (0-1) for our internal format
  let intensityFactor = 0.7; // default
  if (activity.icu_intensity) {
    // Values > 2 are clearly percentages (e.g. 91.58 → 0.9158)
    intensityFactor = activity.icu_intensity > 2
      ? activity.icu_intensity / 100
      : activity.icu_intensity;
  }

  // Zones from HR zone times (if available)
  const hrZoneTimes: number[] = activity.icu_hr_zone_times || [];
  const zones: ZoneDistribution = hrZoneTimes.length >= 5
    ? {
        zone1Seconds: hrZoneTimes[0] || 0,
        zone2Seconds: hrZoneTimes[1] || 0,
        zone3Seconds: hrZoneTimes[2] || 0,
        zone4Seconds: hrZoneTimes[3] || 0,
        zone5Seconds: hrZoneTimes[4] || 0,
      }
    : {
        zone1Seconds: 0,
        zone2Seconds: durationSeconds,
        zone3Seconds: 0,
        zone4Seconds: 0,
        zone5Seconds: 0,
      };

  return {
    id: `intervals_${activity.id}`,
    date: activity.start_date_local.split('T')[0],
    type: type as ActivityData['type'],
    durationSeconds,
    distanceMeters: activity.distance || activity.icu_distance || 0,
    averagePower: activity.icu_average_watts || undefined,
    averageHeartRate: activity.average_heartrate || undefined,
    normalizedPower: activity.icu_weighted_avg_watts || undefined,
    tss,
    intensityFactor,
    zones,
  };
}

/**
 * Estimate TSS if not provided by Intervals.icu
 * Formula: TSS = (duration_seconds × IF² × 100) / 3600
 */
function estimateTSS(
  durationSeconds: number,
  activity: Record<string, any>
): number {
  const durationHours = durationSeconds / 3600;
  const np = activity.icu_weighted_avg_watts || activity.icu_average_watts || 0;
  const ftp = activity.icu_ftp || 250; // Use activity's FTP if available

  if (!np) {
    // Fallback: estimate based on duration
    const estimatedIF = 0.75; // Conservative default
    return Math.round(durationHours * estimatedIF ** 2 * 100);
  }

  const IF = np / ftp;
  return Math.round(durationHours * IF ** 2 * 100);
}

/**
 * Get a single activity details from Intervals.icu
 */
export async function fetchActivityFromIntervalsIcu(
  apiKey: string,
  athleteId: string,
  activityId: string
): Promise<ActivityData | null> {
  try {
    const response = await fetch(
      `https://intervals.icu/api/v1/activity/${activityId}`,
      {
        method: 'GET',
        headers: {
          Authorization: getIntervalsIcuAuthHeader(apiKey),
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const activity = await response.json();
    return transformIntervalsActivity(activity);
  } catch {
    return null;
  }
}
