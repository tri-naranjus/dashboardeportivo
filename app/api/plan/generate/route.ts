import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/recommendations/weeklyPlanEngine';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { getActivities } from '@/lib/storage/activities';
import { getUserProfile } from '@/lib/storage/userProfile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekObjective } = body;

    if (!weekObjective) {
      return NextResponse.json(
        { error: 'weekObjective is required' },
        { status: 400 }
      );
    }

    // Get data
    const activities = await getActivities();
    const profile = await getUserProfile();

    // Compute fitness metrics
    const fitnessMetrics = computeFitnessMetrics(activities);

    // Generate plan
    const plan = generateWeeklyPlan(fitnessMetrics, profile, weekObjective);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
