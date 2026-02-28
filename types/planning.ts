export type SportType = 'cycling' | 'running' | 'trail' | 'swimming' | 'calisthenics';

export interface DayTrainingPlan {
  dayOfWeek: string;
  date: string;
  sport: SportType | 'rest';
  sessionType:
    | 'Rest'
    | 'Zone2'
    | 'Threshold'
    | 'VO2max'
    | 'LongRide'
    | 'Strength'
    | 'Race'
    | 'Intervals';
  description: string; // "Series 10K: 5x1km", "Zona 2 ciclismo", etc.
  durationMinutes: number;
  intensityZones: string;
  physiologicalObjective: string;
  perceivedLoad: 'Low' | 'Moderate' | 'High' | 'Very High';
  tssEstimate: number;
  isFixed?: boolean; // true = can't be removed (e.g. Thursday calisthenics)
}

export interface DayNutritionPlan {
  dayOfWeek: string;
  choStrategy: 'Train Low' | 'Train High' | 'Race Protocol' | 'Recovery';
  preworkoutCHO: string;
  duringCHO: string;
  postworkoutCHO: string;
  dailyProtein: string;
  dailyCalories: string;
  hydration: string;
  scientificBasis: string;
}

export interface DayStrengthPlan {
  dayOfWeek: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    notes: string;
  }>;
}

export interface DayPlan {
  training: DayTrainingPlan;
  secondTraining?: DayTrainingPlan;
  nutrition: DayNutritionPlan;
  strength?: DayStrengthPlan;
}

export interface WeeklyPlan {
  weekStartDate: string;
  weekObjective: string;
  fitnessSnapshot: { ctl: number; atl: number; tsb: number };
  days: DayPlan[];
  generatedAt: string;
}

// Available session options for the edit dialog
export interface SessionTemplate {
  sport: SportType;
  sessionType: DayTrainingPlan['sessionType'];
  label: string;
  description: string;
  emoji: string;
  defaultDuration: number;
  defaultTSS: number;
}
