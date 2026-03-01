import { NextRequest, NextResponse } from 'next/server';
import { getIntervalsIcuAuthHeader } from '@/lib/intervals/auth';

/**
 * Test endpoint for Intervals.icu API troubleshooting
 * POST with apiKey and athleteId to test authentication
 *
 * Auth method: HTTP Basic (username=API_KEY, password=your_api_key)
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey, athleteId } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'apiKey is required' },
        { status: 400 }
      );
    }

    const authHeader = getIntervalsIcuAuthHeader(apiKey);
    const results: Record<string, any>[] = [];

    // Test 1: Try to get athlete profile with provided athlete ID
    if (athleteId) {
      try {
        const response = await fetch(
          `https://intervals.icu/api/v1/athlete/${athleteId}`,
          {
            method: 'GET',
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            test: `Athlete profile for "${athleteId}"`,
            status: response.status,
            success: true,
            athleteName: data.name || data.firstname || 'Unknown',
            athleteId: data.id,
          });
        } else {
          let errorMsg = '';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || '';
          } catch { /* ignore */ }

          results.push({
            test: `Athlete profile for "${athleteId}"`,
            status: response.status,
            success: false,
            error: errorMsg || `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        results.push({
          test: `Athlete profile for "${athleteId}"`,
          error: error instanceof Error ? error.message : 'Network error',
          success: false,
        });
      }
    }

    // Test 2: Try fetching recent activities
    if (athleteId) {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const oldest = sevenDaysAgo.toISOString().split('T')[0];

        const response = await fetch(
          `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldest}`,
          {
            method: 'GET',
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 0;
          results.push({
            test: `Recent activities (last 7 days)`,
            status: response.status,
            success: true,
            activitiesFound: count,
          });
        } else {
          results.push({
            test: `Recent activities`,
            status: response.status,
            success: false,
          });
        }
      } catch (error) {
        results.push({
          test: `Recent activities`,
          error: error instanceof Error ? error.message : 'Network error',
          success: false,
        });
      }
    }

    // Test 3: Try fetching wellness data
    if (athleteId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `https://intervals.icu/api/v1/athlete/${athleteId}/wellness/${today}`,
          {
            method: 'GET',
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            test: `Wellness data (CTL/ATL)`,
            status: response.status,
            success: true,
            ctl: data.ctl,
            atl: data.atl,
          });
        } else {
          results.push({
            test: `Wellness data`,
            status: response.status,
            success: false,
          });
        }
      } catch (error) {
        results.push({
          test: `Wellness data`,
          error: error instanceof Error ? error.message : 'Network error',
          success: false,
        });
      }
    }

    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      authMethod: 'HTTP Basic (API_KEY:password)',
      apiKey: apiKey.substring(0, 8) + '...',
      testResults: results,
      recommendation: allSuccess
        ? 'All tests passed! You can connect now.'
        : results.some((r) => r.success)
          ? 'Some tests passed. Check results above.'
          : 'All tests failed. Verify your API Key and Athlete ID at intervals.icu/settings',
    });
  } catch (error) {
    console.error('Intervals.icu test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Intervals.icu connection' },
      { status: 500 }
    );
  }
}
