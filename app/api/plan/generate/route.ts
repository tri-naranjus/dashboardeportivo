import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/recommendations/weeklyPlanEngine';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { getActivities } from '@/lib/storage/activities';
import { getUserProfile } from '@/lib/storage/userProfile';
import { getIntervalsIcuCredentials } from '@/lib/storage/intervalsIcuCredentials';
import { fetchActivitiesFromIntervalsIcu } from '@/lib/intervals/client';
import { getValidAccessToken } from '@/lib/strava/auth';
import { fetchActivitiesFromStrava } from '@/lib/strava/client';
import { transformStravaActivity } from '@/lib/strava/transform';
import { ActivityData } from '@/types/fitness';

const DAYS_BACK = 180;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekObjective, restDayOfWeek } = body;

    if (!weekObjective) {
      return NextResponse.json(
        { error: 'weekObjective is required' },
        { status: 400 }
      );
    }

    const profile = await getUserProfile();
    let activities: ActivityData[] = [];

    // Priority 1: Intervals.icu (same source as dashboard)
    try {
      const credentials = await getIntervalsIcuCredentials();
      if (credentials) {
        activities = await fetchActivitiesFromIntervalsIcu(
          credentials.apiKey,
          credentials.athleteId,
          DAYS_BACK
        );
      }
    } catch {
      // Intervals.icu not available
    }

    // Priority 2: Strava fallback
    if (activities.length === 0) {
      try {
        const accessToken = await getValidAccessToken();
        const stravaActivities = await fetchActivitiesFromStrava(accessToken, DAYS_BACK);
        activities = stravaActivities.map((a) =>
          transformStravaActivity(a, profile.ftp, profile.lthr)
        );
      } catch {
        // Strava not available
      }
    }

    // Priority 3: local cache as last resort
    if (activities.length === 0) {
      activities = await getActivities();
    }

    // Use same 180-day window as dashboard
    const fitnessMetrics = computeFitnessMetrics(activities, DAYS_BACK);

    const plan = generateWeeklyPlan(
      fitnessMetrics,
      profile,
      weekObjective,
      restDayOfWeek
    );

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
