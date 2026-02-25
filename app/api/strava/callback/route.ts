import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/strava/auth';
import { saveStravaTokens } from '@/lib/storage/stravaTokens';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/strava?error=access_denied`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code);

    // Save tokens
    await saveStravaTokens(tokens);

    // Redirect to Strava page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/strava?connected=true`
    );
  } catch (error) {
    console.error('Strava callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/strava?error=token_exchange_failed`
    );
  }
}
