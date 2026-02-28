/**
 * Intervals.icu API Client
 * Fetches activities with precise TSS, IF, and power data
 */

import { ActivityData, ZoneDistribution } from '@/types/fitness';

interface IntervalsActivity {
  id: number;
  start_date_local: string; // ISO date string
  type: string; // 'Ride', 'Run', 'Swim', etc.
  name: string;
  description?: string;
  // Power metrics (cycling)
  metrics?: {
    tss?: number;
    intensity_factor?: number;
    normalised_power?: number;
    avg_power?: number;
    max_power?: number;
  };
  // HR metrics (all sports)
  avg_heart_rate?: number;
  max_heart_rate?: number;
  // Duration & distance
  duration_seconds?: number;
  distance_meters?: number;
  // Zone data (if available)
  zones?: {
    z1_seconds?: number;
    z2_seconds?: number;
    z3_seconds?: number;
    z4_seconds?: number;
    z5_seconds?: number;
    z6_seconds?: number;
    z7_seconds?: number;
  };
}

/**
 * Fetch activities from Intervals.icu for the last N days
 * Much more accurate TSS/IF than Strava
 */
export async function fetchActivitiesFromIntervalsIcu(
  apiKey: string,
  athleteId: string,
  daysBack: number = 180
): Promise<ActivityData[]> {
  const activities: ActivityData[] = [];

  try {
    // Intervals.icu endpoint: /api/v1/athlete/{id}/activities
    // By default returns recent activities
    const url = new URL(`https://intervals.icu/api/v1/athlete/${athleteId}/activities`);

    // Add date filter if needed (check API docs for exact parameter name)
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    url.searchParams.append('from', fromDate.toISOString().split('T')[0]);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Intervals.icu API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawActivities: IntervalsActivity[] = Array.isArray(data)
      ? data
      : data.activities || [];

    // Transform each activity to our ActivityData format
    for (const activity of rawActivities) {
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
 * Transform Intervals.icu activity to our internal ActivityData format
 */
function transformIntervalsActivity(
  activity: IntervalsActivity
): ActivityData | null {
  if (!activity.start_date_local || !activity.duration_seconds) {
    return null;
  }

  // Parse type
  const typeMap: Record<string, string> = {
    Ride: 'Ride',
    Run: 'Run',
    Swim: 'Swim',
    Walk: 'Run',
    Hike: 'Run',
    'Cross Country Ski': 'Run',
    Rowing: 'Swim',
  };
  const type = typeMap[activity.type] || activity.type || 'Run';

  // TSS: use Intervals.icu value if available, otherwise estimate
  const tss = activity.metrics?.tss || estimateTSS(activity);

  // IF (Intensity Factor)
  const intensityFactor = activity.metrics?.intensity_factor || 0.7;

  // Zones from activity (if available)
  const zones: ZoneDistribution = activity.zones
    ? {
        zone1Seconds: activity.zones.z1_seconds || 0,
        zone2Seconds: activity.zones.z2_seconds || 0,
        zone3Seconds: activity.zones.z3_seconds || 0,
        zone4Seconds: activity.zones.z4_seconds || 0,
        zone5Seconds: activity.zones.z5_seconds || 0,
      }
    : {
        zone1Seconds: 0,
        zone2Seconds: activity.duration_seconds,
        zone3Seconds: 0,
        zone4Seconds: 0,
        zone5Seconds: 0,
      };

  return {
    id: `intervals_${activity.id}`,
    date: activity.start_date_local.split('T')[0],
    type: type as ActivityData['type'],
    durationSeconds: activity.duration_seconds,
    distanceMeters: activity.distance_meters || 0,
    averagePower: activity.metrics?.avg_power,
    averageHeartRate: activity.avg_heart_rate,
    normalizedPower: activity.metrics?.normalised_power,
    tss,
    intensityFactor,
    zones,
  };
}

/**
 * Estimate TSS if not provided by Intervals.icu
 * Formula: TSS = (duration_seconds × IF² × 100) / 3600
 */
function estimateTSS(activity: IntervalsActivity): number {
  if (!activity.duration_seconds) return 0;

  const durationHours = activity.duration_seconds / 3600;
  const normalizedPower = activity.metrics?.normalised_power || activity.metrics?.avg_power || 0;
  const ftp = 250; // Default FTP assumption - should come from user profile

  if (!normalizedPower) {
    // Fallback: estimate based on duration and intensity
    // Zone 2 = 0.75 IF, Zone 4 = 1.0 IF, Zone 5 = 1.15 IF
    const estimatedIF = 0.75; // Conservative default
    return Math.round(durationHours * (estimatedIF ** 2) * 100);
  }

  const IF = normalizedPower / ftp;
  return Math.round(durationHours * (IF ** 2) * 100);
}

/**
 * Get a single activity details from Intervals.icu
 */
export async function fetchActivityFromIntervalsIcu(
  apiKey: string,
  athleteId: string,
  activityId: number
): Promise<ActivityData | null> {
  try {
    const response = await fetch(
      `https://intervals.icu/api/v1/athlete/${athleteId}/workouts/${activityId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const activity: IntervalsActivity = await response.json();
    return transformIntervalsActivity(activity);
  } catch {
    return null;
  }
}
