import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { ActivityData } from '@/types/fitness';

const DATA_DIR = process.env.DATA_DIR || './data';
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getActivities(): Promise<ActivityData[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ACTIVITIES_FILE, 'utf-8');
    return JSON.parse(data) as ActivityData[];
  } catch {
    return [];
  }
}

export async function saveActivities(activities: ActivityData[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2));
}

export async function addActivity(activity: ActivityData): Promise<void> {
  const activities = await getActivities();
  // Avoid duplicates by stravaId
  const filtered = activities.filter(
    (a) => a.stravaId !== activity.stravaId
  );
  filtered.push(activity);
  // Keep only last 6 months (180 days)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
  const recent = filtered.filter((a) => new Date(a.date) >= sixMonthsAgo);
  await saveActivities(recent);
}

export async function clearActivities(): Promise<void> {
  await saveActivities([]);
}
