import { ActivityData, FitnessMetrics } from '@/types/fitness';

/**
 * Calculate Exponential Moving Average (EMA)
 * @param dailyTSS Array of daily TSS values sorted by date (oldest first)
 * @param tau Time constant in days (42 for CTL, 7 for ATL)
 * @returns Array of EMA values
 */
function computeEMA(
  dailyTSS: number[],
  tau: number
): number[] {
  const result: number[] = [];
  let ema = 0;

  for (const tss of dailyTSS) {
    // EMA formula: EMA = EMA_prev + (TSS - EMA_prev) / tau
    ema = ema + (tss - ema) * (1 - Math.exp(-1 / tau));
    result.push(Math.round(ema * 10) / 10);
  }

  return result;
}

/**
 * Fill daily TSS array for a given number of days
 * If no activity on a day, TSS = 0
 */
function fillDailyTSS(
  activities: ActivityData[],
  daysBack: number
): number[] {
  const dailyTSS: number[] = [];
  const today = new Date();

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayActivities = activities.filter((a) => a.date === dateStr);
    const tssForDay = dayActivities.reduce((sum, a) => sum + a.tss, 0);
    dailyTSS.push(tssForDay);
  }

  return dailyTSS;
}

/**
 * Compute fitness metrics (CTL, ATL, TSB) from activities
 */
export function computeFitnessMetrics(
  activities: ActivityData[],
  daysBack: number = 90
): FitnessMetrics {
  const dailyTSS = fillDailyTSS(activities, daysBack);
  const ctlValues = computeEMA(dailyTSS, 42);
  const atlValues = computeEMA(dailyTSS, 7);

  const today = new Date().toISOString().split('T')[0];
  const currentCTL = ctlValues[ctlValues.length - 1] || 0;
  const currentATL = atlValues[atlValues.length - 1] || 0;
  const currentTSB = currentCTL - currentATL;

  // Build history array for charting (last 90 days)
  const history = [];
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysBack - 1 - i));
    const dateStr = date.toISOString().split('T')[0];

    history.push({
      date: dateStr,
      ctl: ctlValues[i] || 0,
      atl: atlValues[i] || 0,
      tsb: (ctlValues[i] || 0) - (atlValues[i] || 0),
      tss: dailyTSS[i] || 0,
    });
  }

  return {
    ctl: currentCTL,
    atl: currentATL,
    tsb: currentTSB,
    date: today,
    history,
  };
}

/**
 * Get training status based on TSB value
 */
export function getTrainingStatusLabel(tsb: number): string {
  if (tsb > 10) return 'high_intensity';
  if (tsb >= 0) return 'moderate';
  if (tsb >= -10) return 'zone2_priority';
  return 'recovery';
}
