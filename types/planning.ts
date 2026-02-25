export interface DayTrainingPlan {
  dayOfWeek: string; // "Monday" etc.
  date: string;
  sessionType:
    | 'Rest'
    | 'Zone2'
    | 'Threshold'
    | 'VO2max'
    | 'LongRide'
    | 'Strength'
    | 'Race';
  durationMinutes: number;
  intensityZones: string; // e.g. "70% Zone 2, 30% Zone 3"
  physiologicalObjective: string; // e.g. "Mitochondrial adaptation, fat oxidation"
  perceivedLoad: 'Low' | 'Moderate' | 'High' | 'Very High';
  tssEstimate: number;
}

export interface DayNutritionPlan {
  dayOfWeek: string;
  choStrategy: 'Train Low' | 'Train High' | 'Race Protocol' | 'Recovery';
  preworkoutCHO: string; // e.g. "1.5g/kg CHO 2h before"
  duringCHO: string; // e.g. "60-90g CHO/hr (glucose:fructose 2:1)"
  postworkoutCHO: string;
  dailyProtein: string; // e.g. "2.0g/kg"
  dailyCalories: string; // e.g. "TDEE + 300 kcal"
  hydration: string;
  scientificBasis: string; // Reference to Brooks/San Millán/Viribay
}

export interface DayStrengthPlan {
  dayOfWeek: string;
  exercises: Array<{
    name: string; // e.g. "Tibialis raises"
    sets: number;
    reps: string; // e.g. "15 each leg"
    notes: string;
  }>;
}

export interface WeeklyPlan {
  weekStartDate: string;
  weekObjective: string;
  fitnessSnapshot: { ctl: number; atl: number; tsb: number };
  days: Array<{
    training: DayTrainingPlan;
    nutrition: DayNutritionPlan;
    strength?: DayStrengthPlan;
  }>;
  generatedAt: string;
}
