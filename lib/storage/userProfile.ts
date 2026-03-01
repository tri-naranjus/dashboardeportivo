import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { UserProfile } from '@/types/fitness';

const DATA_DIR = process.env.DATA_DIR || './data';
const PROFILE_FILE = path.join(DATA_DIR, 'user-profile.json');

const DEFAULT_PROFILE: UserProfile = {
  ftp: 250,
  lthr: 160,
  maxHR: 185,
  weight: 65,
  sports: ['running', 'cycling'],
  name: 'Athlete',
  tdee: 2200,
};

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PROFILE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Record<string, unknown>;
    // Migrate old sportFocus field to sports array
    if (!parsed.sports && parsed.sportFocus) {
      const migrateMap: Record<string, string[]> = {
        running: ['running'],
        cycling: ['cycling'],
        both: ['running', 'cycling'],
      };
      parsed.sports = migrateMap[parsed.sportFocus as string] || ['running', 'cycling'];
      delete parsed.sportFocus;
    } else if (!parsed.sports) {
      parsed.sports = ['running', 'cycling'];
    }
    return parsed as unknown as UserProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2));
}
