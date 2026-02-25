import 'server-only';
import { StravaActivity } from '@/types/strava';

/**
 * Fetch recent activities from Strava API
 */
export async function fetchActivitiesFromStrava(
  accessToken: string,
  daysBack: number = 28
): Promise<StravaActivity[]> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - daysBack * 24 * 60 * 60; // seconds
  const until = now;

  // Fetch from Strava API - use after parameter for efficiency
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${since}&before=${until}&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data as StravaActivity[];
}

/**
 * Get athlete profile from Strava
 */
export async function fetchAthleteProfile(accessToken: string) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.statusText}`);
  }

  return await response.json();
}
