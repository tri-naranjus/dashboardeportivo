import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/strava/auth';
import { fetchActivitiesFromStrava } from '@/lib/strava/client';
import { transformStravaActivity } from '@/lib/strava/transform';
import { saveActivities } from '@/lib/storage/activities';
import { getUserProfile } from '@/lib/storage/userProfile';

export async function GET(request: NextRequest) {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken();

    // Get user profile for FTP/LTHR
    const profile = await getUserProfile();

    // Fetch from Strava (last 28 days)
    const stravaActivities = await fetchActivitiesFromStrava(accessToken, 28);

    // Transform to internal format with TSS calculations
    const activities = stravaActivities.map((a) =>
      transformStravaActivity(a, profile.ftp, profile.lthr)
    );

    // Save to cache
    await saveActivities(activities);

    return NextResponse.json({ activities, count: activities.length });
  } catch (error) {
    console.error('Fetch activities error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Not connected to Strava')
    ) {
      return NextResponse.json(
        { error: 'Not connected to Strava' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
