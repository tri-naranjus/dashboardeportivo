import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { StravaTokens } from '@/types/strava';

const DATA_DIR = process.env.DATA_DIR || './data';
const TOKENS_FILE = path.join(DATA_DIR, 'strava-tokens.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getStravaTokens(): Promise<StravaTokens | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TOKENS_FILE, 'utf-8');
    return JSON.parse(data) as StravaTokens;
  } catch {
    return null;
  }
}

export async function saveStravaTokens(tokens: StravaTokens): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export async function clearStravaTokens(): Promise<void> {
  try {
    await fs.unlink(TOKENS_FILE);
  } catch {
    // File doesn't exist, no-op
  }
}

export async function isStravaConnected(): Promise<boolean> {
  const tokens = await getStravaTokens();
  return tokens !== null;
}
