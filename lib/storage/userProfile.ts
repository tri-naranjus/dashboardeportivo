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
  sportFocus: 'both',
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
    return JSON.parse(data) as UserProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2));
}
