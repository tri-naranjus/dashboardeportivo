/**
 * Intervals.icu Authentication
 * API Key authentication (header: x-api-key)
 */

export async function getIntervalsIcuAuthUrl(apiKey: string): Promise<string> {
  // Intervals.icu uses API Key auth via header
  // No OAuth flow needed - just pass x-api-key header
  return apiKey;
}

export interface IntervalsIcuCredentials {
  apiKey: string;
  athleteId: string;
}

/**
 * Verify Intervals.icu API credentials
 */
export async function verifyIntervalsIcuCredentials(
  apiKey: string,
  athleteId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://intervals.icu/api/v1/athlete/${athleteId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
