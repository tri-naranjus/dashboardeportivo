import { NextRequest, NextResponse } from 'next/server';
import {
  saveIntervalsIcuCredentials,
  deleteIntervalsIcuCredentials,
} from '@/lib/storage/intervalsIcuCredentials';
import { verifyIntervalsIcuCredentials } from '@/lib/intervals/auth';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, athleteId } = await request.json();

    if (!apiKey || !athleteId) {
      return NextResponse.json(
        { error: 'apiKey and athleteId are required' },
        { status: 400 }
      );
    }

    // Verify credentials work
    const isValid = await verifyIntervalsIcuCredentials(apiKey, athleteId);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key or athlete ID' },
        { status: 401 }
      );
    }

    // Save credentials
    await saveIntervalsIcuCredentials(apiKey, athleteId);

    return NextResponse.json({
      success: true,
      message: 'Intervals.icu connected successfully',
    });
  } catch (error) {
    console.error('Intervals.icu connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Intervals.icu' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    await deleteIntervalsIcuCredentials();
    return NextResponse.json({
      success: true,
      message: 'Intervals.icu disconnected',
    });
  } catch (error) {
    console.error('Intervals.icu disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Intervals.icu' },
      { status: 500 }
    );
  }
}
