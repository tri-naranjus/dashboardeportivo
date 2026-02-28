import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

interface IntervalsIcuCredentials {
  apiKey: string;
  athleteId: string;
  connectedAt: string; // ISO timestamp
}

const DATA_DIR = join(process.cwd(), 'data');
const CREDENTIALS_FILE = join(DATA_DIR, 'intervals-icu-credentials.json');

/**
 * Save Intervals.icu API credentials
 */
export async function saveIntervalsIcuCredentials(
  apiKey: string,
  athleteId: string
): Promise<void> {
  const credentials: IntervalsIcuCredentials = {
    apiKey,
    athleteId,
    connectedAt: new Date().toISOString(),
  };

  try {
    await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  } catch (error) {
    console.error('Error saving Intervals.icu credentials:', error);
    throw error;
  }
}

/**
 * Get Intervals.icu API credentials
 */
export async function getIntervalsIcuCredentials(): Promise<IntervalsIcuCredentials | null> {
  try {
    const data = await readFile(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(data) as IntervalsIcuCredentials;
  } catch {
    return null;
  }
}

/**
 * Check if Intervals.icu is connected
 */
export async function hasIntervalsIcuCredentials(): Promise<boolean> {
  try {
    const data = await readFile(CREDENTIALS_FILE, 'utf-8');
    const creds = JSON.parse(data) as IntervalsIcuCredentials;
    return !!(creds.apiKey && creds.athleteId);
  } catch {
    return false;
  }
}

/**
 * Delete Intervals.icu credentials
 */
export async function deleteIntervalsIcuCredentials(): Promise<void> {
  try {
    await unlink(CREDENTIALS_FILE);
  } catch {
    // File doesn't exist, that's ok
  }
}
