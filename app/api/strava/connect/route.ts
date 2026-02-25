import { NextResponse } from 'next/server';
import { getStravaAuthUrl } from '@/lib/strava/auth';

export async function GET() {
  try {
    const authUrl = getStravaAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Strava connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Strava connection' },
      { status: 500 }
    );
  }
}
