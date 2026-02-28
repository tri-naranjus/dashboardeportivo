import { NextResponse } from 'next/server';
import { hasIntervalsIcuCredentials } from '@/lib/storage/intervalsIcuCredentials';

export async function GET() {
  try {
    const connected = await hasIntervalsIcuCredentials();
    return NextResponse.json({ connected });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
