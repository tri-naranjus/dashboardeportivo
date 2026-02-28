import { NextRequest, NextResponse } from 'next/server';
import { getIntervalsIcuCredentials } from '@/lib/storage/intervalsIcuCredentials';
import { fetchActivitiesFromIntervalsIcu } from '@/lib/intervals/client';
import { saveActivities } from '@/lib/storage/activities';

export async function GET(_request: NextRequest) {
  try {
    const credentials = await getIntervalsIcuCredentials();

    if (!credentials) {
      return NextResponse.json(
        { error: 'Intervals.icu not connected' },
        { status: 401 }
      );
    }

    // Fetch activities from Intervals.icu (more precise TSS/IF)
    const activities = await fetchActivitiesFromIntervalsIcu(
      credentials.apiKey,
      credentials.athleteId,
      180 // Last 180 days
    );

    // Cache locally
    await saveActivities(activities);

    return NextResponse.json({
      activities,
      source: 'intervals.icu',
      count: activities.length,
    });
  } catch (error) {
    console.error('Intervals.icu activities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities from Intervals.icu' },
      { status: 500 }
    );
  }
}
