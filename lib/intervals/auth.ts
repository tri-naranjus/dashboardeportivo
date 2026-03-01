/**
 * Intervals.icu Authentication
 * Uses HTTP Basic Auth: Username = "API_KEY", Password = your API key
 * See: https://intervals.icu/api/v1 → securitySchemes
 */

export interface IntervalsIcuCredentials {
  apiKey: string;
  athleteId: string;
}

/**
 * Build the Authorization header for Intervals.icu API
 * HTTP Basic Auth with username "API_KEY" and password = your actual API key
 */
export function getIntervalsIcuAuthHeader(apiKey: string): string {
  const credentials = Buffer.from(`API_KEY:${apiKey}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Verify Intervals.icu API credentials
 */
export async function verifyIntervalsIcuCredentials(
  apiKey: string,
  athleteId: string
): Promise<{ valid: boolean; error?: string; athleteName?: string }> {
  try {
    const response = await fetch(
      `https://intervals.icu/api/v1/athlete/${athleteId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getIntervalsIcuAuthHeader(apiKey),
          'Accept': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        athleteName: data.name || data.firstname || athleteId,
      };
    }

    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // Could not parse error response
    }

    return { valid: false, error: errorMsg };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
