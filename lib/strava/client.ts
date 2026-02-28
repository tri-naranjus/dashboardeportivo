import 'server-only';
import { StravaActivity } from '@/types/strava';

/**
 * Fetch recent activities from Strava API with pagination
 * Strava allows max 200 per page, so we paginate for large date ranges
 */
export async function fetchActivitiesFromStrava(
  accessToken: string,
  daysBack: number = 180
): Promise<StravaActivity[]> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - daysBack * 24 * 60 * 60;

  const allActivities: StravaActivity[] = [];
  let page = 1;
  const perPage = 200; // Strava max

  while (true) {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${since}&before=${now}&per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.statusText}`);
    }

    const data = (await response.json()) as StravaActivity[];
    allActivities.push(...data);

    // If we got less than perPage, we've reached the end
    if (data.length < perPage) break;
    page++;

    // Safety limit: max 5 pages (1000 activities)
    if (page > 5) break;
  }

  return allActivities;
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
