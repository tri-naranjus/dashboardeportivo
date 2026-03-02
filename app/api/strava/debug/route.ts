import { NextResponse } from 'next/server';

/** Debug endpoint – shows exactly what redirect_uri the app sends to Strava */
export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri =
    process.env.STRAVA_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`;

  const authUrl = new URL('https://www.strava.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId || 'NOT_SET');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('approval_prompt', 'auto');
  authUrl.searchParams.set('scope', 'read,activity:read_all');

  return NextResponse.json({
    STRAVA_CLIENT_ID: clientId ? `${clientId.substring(0, 4)}***` : 'NOT_SET',
    STRAVA_REDIRECT_URI_env: process.env.STRAVA_REDIRECT_URI || 'NOT_SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    redirect_uri_used: redirectUri,
    full_oauth_url: authUrl.toString(),
    instruction:
      'El campo "Authorization Callback Domain" en strava.com/settings/api debe ser EXACTAMENTE el dominio de redirect_uri_used (sin https:// ni path)',
    domain_to_set_in_strava: redirectUri
      ? new URL(redirectUri).hostname
      : 'ERROR',
  });
}
