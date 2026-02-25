import { UserProfile, FitnessMetrics } from '@/types/fitness';
import { WeeklyPlan, DayTrainingPlan, DayStrengthPlan } from '@/types/planning';
import { KnowledgeDocument } from '@/types/knowledge';
import { getNutritionForSession } from './nutritionRecommendation';

/**
 * Core rule engine: generate full 7-day weekly plan
 */
export function generateWeeklyPlan(
  fitnessMetrics: FitnessMetrics,
  userProfile: UserProfile,
  weekObjective: string
): WeeklyPlan {
  const { tsb, ctl, atl } = fitnessMetrics;
  const weekTemplate = buildWeekTemplate(tsb);

  const mondayOfThisWeek = getMonday(new Date());
  const days = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayDate = new Date(mondayOfThisWeek);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayOfWeek = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ][dayIndex];

    const sessionType = weekTemplate[dayIndex];

    // Build training day
    const training = buildTrainingDay(
      sessionType,
      dayOfWeek,
      dateStr,
      userProfile
    );

    // Build nutrition day
    const nutrition = getNutritionForSession(
      training.sessionType,
      training.durationMinutes,
      userProfile.weight,
      userProfile.tdee
    );
    nutrition.dayOfWeek = dayOfWeek;

    // Build strength day if applicable
    const strength = shouldAddStrength(dayIndex, weekTemplate)
      ? buildStrengthSession(dayOfWeek, userProfile.sportFocus)
      : undefined;

    days.push({
      training,
      nutrition,
      strength,
    });
  }

  return {
    weekStartDate: mondayOfThisWeek.toISOString().split('T')[0],
    weekObjective,
    fitnessSnapshot: { ctl, atl, tsb },
    days,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build week template based on TSB
 * Returns array of 7 session types
 */
function buildWeekTemplate(tsb: number): DayTrainingPlan['sessionType'][] {
  if (tsb > 10) {
    // Fresh: 2 hard days, 3 Zone2, 1 strength, 1 rest
    return ['Zone2', 'VO2max', 'Zone2', 'Threshold', 'Zone2', 'Strength', 'Rest'];
  } else if (tsb >= 0 && tsb <= 10) {
    // Moderately fresh: 1 hard, 1 threshold, strength, rest
    return ['Zone2', 'Threshold', 'Zone2', 'Zone2', 'Strength', 'Zone2', 'Rest'];
  } else if (tsb >= -10 && tsb < 0) {
    // Fatigued: mostly Zone2 with light strength
    return ['Zone2', 'Zone2', 'Strength', 'Zone2', 'Zone2', 'LongRide', 'Rest'];
  } else {
    // Very fatigued: minimal load
    return ['Rest', 'Zone2', 'Zone2', 'Strength', 'Zone2', 'Zone2', 'Rest'];
  }
}

/**
 * Should we add strength on this day?
 */
function shouldAddStrength(
  dayIndex: number,
  template: DayTrainingPlan['sessionType'][]
): boolean {
  return template[dayIndex] === 'Strength';
}

/**
 * Build a single training day
 */
function buildTrainingDay(
  sessionType: DayTrainingPlan['sessionType'],
  dayOfWeek: string,
  date: string,
  userProfile: UserProfile
): DayTrainingPlan {
  const baseDetails: Record<DayTrainingPlan['sessionType'], Partial<DayTrainingPlan>> =
    {
      Rest: {
        sessionType: 'Rest',
        durationMinutes: 0,
        intensityZones: 'Descanso completo',
        physiologicalObjective: 'Recuperación del SNC',
        perceivedLoad: 'Low',
        tssEstimate: 0,
      },
      Zone2: {
        sessionType: 'Zone2',
        durationMinutes:
          userProfile.sportFocus === 'running' ? 60 : 75,
        intensityZones: '100% Zona 2 (55-75% FTP / 85-95% LTHR)',
        physiologicalObjective:
          'Salud mitocondrial, oxidación de grasa, aclaramiento de lactato',
        perceivedLoad: 'Low',
        tssEstimate:
          userProfile.sportFocus === 'running'
            ? Math.round(60 * Math.pow(0.65, 2) * 100) / 3600
            : Math.round(75 * Math.pow(0.65, 2) * 100) / 3600,
      },
      Threshold: {
        sessionType: 'Threshold',
        durationMinutes: 90,
        intensityZones: '2x20 min Zona 4 (90-105% FTP / 105-120% LTHR)',
        physiologicalObjective:
          'Aclaramiento de lactato, mejora metabólica, potencia de resistencia',
        perceivedLoad: 'High',
        tssEstimate: Math.round((90 * Math.pow(1.0, 2) * 100) / 3600),
      },
      VO2max: {
        sessionType: 'VO2max',
        durationMinutes: 75,
        intensityZones: '4x4 min Zona 5 (>120% FTP / >120% LTHR)',
        physiologicalObjective:
          'Capacidad aeróbica, VO2max, potencia anaeróbica, lactate shuttle',
        perceivedLoad: 'Very High',
        tssEstimate: Math.round((75 * Math.pow(1.15, 2) * 100) / 3600),
      },
      LongRide: {
        sessionType: 'LongRide',
        durationMinutes: 180,
        intensityZones: '90% Zona 2, 10% Zona 3',
        physiologicalObjective:
          'Base aeróbica, resistencia, mecanismos de oxidación de grasa',
        perceivedLoad: 'Moderate',
        tssEstimate: Math.round((180 * Math.pow(0.7, 2) * 100) / 3600),
      },
      Strength: {
        sessionType: 'Strength',
        durationMinutes: 45,
        intensityZones: 'Fuerza de tensión, rango de movimiento atlético',
        physiologicalObjective:
          'Prevención de lesiones, fuerza funcional, integridad estructural',
        perceivedLoad: 'Moderate',
        tssEstimate: 30, // Fixed estimate for strength
      },
      Race: {
        sessionType: 'Race',
        durationMinutes: 120,
        intensityZones: 'Zonas variadas 2-5 simulando carrera real',
        physiologicalObjective:
          'Especificidad de competencia, metabolismo mixto, tolerancia a lactato',
        perceivedLoad: 'Very High',
        tssEstimate: Math.round((120 * Math.pow(1.0, 2) * 100) / 3600),
      },
    };

  const details = baseDetails[sessionType] || baseDetails.Zone2;

  return {
    dayOfWeek,
    date,
    sessionType: sessionType as DayTrainingPlan['sessionType'],
    durationMinutes: details.durationMinutes || 0,
    intensityZones: details.intensityZones || '',
    physiologicalObjective: details.physiologicalObjective || '',
    perceivedLoad: details.perceivedLoad || 'Low',
    tssEstimate: details.tssEstimate || 0,
  };
}

/**
 * Build a strength/maintenance session
 */
function buildStrengthSession(
  dayOfWeek: string,
  sportFocus: UserProfile['sportFocus']
): DayStrengthPlan {
  const baseExercises = [
    {
      name: 'Tibialis raises',
      sets: 3,
      reps: '15 cada pierna',
      notes: 'Salud de rodilla y tobillo - crítico para corredores',
    },
    {
      name: 'ATG Split Squat (AntiCulturista)',
      sets: 3,
      reps: '8 rango completo',
      notes: 'Fuerza de flexor de cadera, rango de movimiento, prevención',
    },
    {
      name: 'Nordic Hamstring Curls',
      sets: 3,
      reps: '6 excéntrico lento (3-5 segundos)',
      notes: 'Prevención de lesiones isquiotibiales, fuerza excéntrica',
    },
    {
      name: 'Calf raises monopodal',
      sets: 3,
      reps: '15 excéntrico lento',
      notes: 'Salud del tendón de Aquiles, resistencia de la cadena posterior',
    },
  ];

  return {
    dayOfWeek,
    exercises: baseExercises,
  };
}

/**
 * Get Monday of the current week
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}
