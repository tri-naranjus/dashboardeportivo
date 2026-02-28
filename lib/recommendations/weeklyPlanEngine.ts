import { UserProfile, FitnessMetrics } from '@/types/fitness';
import {
  WeeklyPlan,
  DayTrainingPlan,
  DayStrengthPlan,
  DayPlan,
  SportType,
  SessionTemplate,
} from '@/types/planning';
import { getNutritionForSession } from './nutritionRecommendation';

// ──────────────────────────────────────────────────────────────
// Session templates: all the building blocks for a training week
// ──────────────────────────────────────────────────────────────
export const SESSION_TEMPLATES: SessionTemplate[] = [
  // Cycling
  {
    sport: 'cycling',
    sessionType: 'Zone2',
    label: 'Zona 2 Ciclismo',
    description: 'Ritmo conversacional, salud mitocondrial',
    emoji: '🚴',
    defaultDuration: 75,
    defaultTSS: 50,
  },
  {
    sport: 'cycling',
    sessionType: 'Threshold',
    label: 'Umbral Ciclismo',
    description: '2x20 min al umbral',
    emoji: '🚴',
    defaultDuration: 90,
    defaultTSS: 75,
  },
  {
    sport: 'cycling',
    sessionType: 'LongRide',
    label: 'Tirada larga Ciclismo',
    description: '+2h base aerobica',
    emoji: '🚴',
    defaultDuration: 150,
    defaultTSS: 100,
  },
  {
    sport: 'cycling',
    sessionType: 'VO2max',
    label: 'VO2max Ciclismo',
    description: '4x4 min a tope',
    emoji: '🚴',
    defaultDuration: 75,
    defaultTSS: 85,
  },
  // Running
  {
    sport: 'running',
    sessionType: 'Intervals',
    label: 'Series 10K',
    description: '5x1km a ritmo 10K, rec 2min',
    emoji: '🏃',
    defaultDuration: 60,
    defaultTSS: 70,
  },
  {
    sport: 'running',
    sessionType: 'VO2max',
    label: 'Series cortas Running',
    description: '8x400m, rec 90s',
    emoji: '🏃',
    defaultDuration: 50,
    defaultTSS: 65,
  },
  {
    sport: 'running',
    sessionType: 'Threshold',
    label: 'Tempo Run',
    description: '30 min a ritmo umbral',
    emoji: '🏃',
    defaultDuration: 50,
    defaultTSS: 60,
  },
  {
    sport: 'running',
    sessionType: 'Zone2',
    label: 'Rodaje suave',
    description: 'Ritmo conversacional',
    emoji: '🏃',
    defaultDuration: 50,
    defaultTSS: 35,
  },
  // Trail
  {
    sport: 'trail',
    sessionType: 'LongRide',
    label: 'Trail largo',
    description: 'Salida larga por montana',
    emoji: '⛰️',
    defaultDuration: 150,
    defaultTSS: 120,
  },
  {
    sport: 'trail',
    sessionType: 'Zone2',
    label: 'Trail suave',
    description: 'Montana a ritmo aerobico',
    emoji: '⛰️',
    defaultDuration: 90,
    defaultTSS: 60,
  },
  {
    sport: 'trail',
    sessionType: 'Threshold',
    label: 'Trail cuestas',
    description: 'Repeticiones en subida',
    emoji: '⛰️',
    defaultDuration: 75,
    defaultTSS: 70,
  },
  // Swimming
  {
    sport: 'swimming',
    sessionType: 'Zone2',
    label: 'Natacion tecnica',
    description: 'Tecnica + aerobico suave',
    emoji: '🏊',
    defaultDuration: 45,
    defaultTSS: 30,
  },
  {
    sport: 'swimming',
    sessionType: 'Intervals',
    label: 'Natacion series',
    description: '10x100m, rec 20s',
    emoji: '🏊',
    defaultDuration: 60,
    defaultTSS: 50,
  },
  {
    sport: 'swimming',
    sessionType: 'Threshold',
    label: 'Natacion umbral',
    description: '4x200m al umbral',
    emoji: '🏊',
    defaultDuration: 50,
    defaultTSS: 45,
  },
  // Calisthenics
  {
    sport: 'calisthenics',
    sessionType: 'Strength',
    label: 'Calistenia',
    description: 'Fuerza con peso corporal',
    emoji: '💪',
    defaultDuration: 90,
    defaultTSS: 50,
  },
];

// ──────────────────────────────────────────────────────────────
// Core engine: generates a 7-day plan respecting user constraints
// ──────────────────────────────────────────────────────────────
export function generateWeeklyPlan(
  fitnessMetrics: FitnessMetrics,
  userProfile: UserProfile,
  weekObjective: string,
  restDayOfWeek?: string // e.g., 'Sunday', 'Monday'
): WeeklyPlan {
  const { tsb, ctl, atl } = fitnessMetrics;
  const mondayOfThisWeek = getMonday(new Date());
  const days: DayPlan[] = [];

  // Build the sport-aware week template
  const weekTemplate = buildSportWeekTemplate(tsb, weekObjective, restDayOfWeek);

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayDate = new Date(mondayOfThisWeek);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayOfWeek = DAY_NAMES_EN[dayIndex];

    const slot = weekTemplate[dayIndex];

    // Primary training
    const training = buildTrainingFromTemplate(
      slot.primary,
      dayOfWeek,
      dateStr,
      slot.isFixed
    );

    // Optional second session
    const secondTraining = slot.secondary
      ? buildTrainingFromTemplate(slot.secondary, dayOfWeek, dateStr, false)
      : undefined;

    // Nutrition: based on the hardest session of the day
    const mainSession = secondTraining
      ? getHarderSession(training, secondTraining)
      : training;
    const totalDuration =
      training.durationMinutes + (secondTraining?.durationMinutes || 0);

    const nutrition = getNutritionForSession(
      mainSession.sessionType,
      totalDuration,
      userProfile.weight,
      userProfile.tdee
    );
    nutrition.dayOfWeek = dayOfWeek;

    // Strength: only for calisthenics days
    const strength =
      training.sport === 'calisthenics'
        ? buildCalisthenicsStrength(dayOfWeek)
        : undefined;

    days.push({ training, secondTraining, nutrition, strength });
  }

  return {
    weekStartDate: mondayOfThisWeek.toISOString().split('T')[0],
    weekObjective,
    fitnessSnapshot: { ctl, atl, tsb },
    days,
    generatedAt: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Week template builder: distributes sports across 7 days
// Constraints:
//   - Thursday ALWAYS = Calisthenics (1h30, TSS 50) + optional 2nd
//   - Swimming at least 1x/week
//   - Running intervals for 10K prep
//   - Cycling and trail distributed
//   - Respects TSB for intensity decisions
// ──────────────────────────────────────────────────────────────
interface DaySlot {
  primary: SessionTemplate;
  secondary?: SessionTemplate;
  isFixed?: boolean;
}

const CALISTHENICS_TEMPLATE = SESSION_TEMPLATES.find(
  (t) => t.sport === 'calisthenics'
)!;

function buildSportWeekTemplate(
  tsb: number,
  objective: string,
  restDayOfWeek?: string
): DaySlot[] {
  const obj = objective.toLowerCase();

  // Convertir el día de descanso elegido a índice (0=Monday, 6=Sunday)
  let restDayIndex = restDayOfWeek
    ? DAY_NAMES_EN.indexOf(restDayOfWeek)
    : 6; // Por defecto domingo

  // Safety: Thursday (3) is ALWAYS calisthenics, never a rest day
  if (restDayIndex === 3) {
    restDayIndex = 6; // Fall back to Sunday
  }

  // Determine intensity level from TSB
  const canDoHard = tsb > 5;
  const canDoModerate = tsb > -5;
  // const needsRecovery = tsb < -10;

  // Helpers to find templates
  const find = (sport: SportType, session: string) =>
    SESSION_TEMPLATES.find(
      (t) => t.sport === sport && t.sessionType === session
    )!;
  const restTemplate: SessionTemplate = {
    sport: 'running',
    sessionType: 'Rest',
    label: 'Descanso',
    description: 'Recuperacion completa',
    emoji: '😴',
    defaultDuration: 0,
    defaultTSS: 0,
  };

  // ── Detect objective to tailor the week ──
  const is10K =
    obj.includes('10k') ||
    obj.includes('10 k') ||
    obj.includes('series') ||
    obj.includes('running');
  const isMarathon =
    obj.includes('maraton') || obj.includes('marathon');
  const isBase =
    obj.includes('base') ||
    obj.includes('zona 2') ||
    obj.includes('aerob');
  const isTrail = obj.includes('trail') || obj.includes('montana');
  const isFatLoss =
    obj.includes('grasa') ||
    obj.includes('perder') ||
    obj.includes('peso');
  const isCycling =
    obj.includes('ciclismo') ||
    obj.includes('bici') ||
    obj.includes('potencia') ||
    obj.includes('subida');

  // ── Build 7-day template ──
  // Index: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const week: DaySlot[] = new Array(7);

  // FIXED: Thursday (index 3) = Calisthenics ALWAYS
  week[3] = {
    primary: CALISTHENICS_TEMPLATE,
    isFixed: true,
  };

  // FIXED: Rest day will be set at the end (see below)

  if (is10K) {
    // 10K prep: intervals, threshold, cycling base, swimming
    week[0] = { primary: find('cycling', 'Zone2') }; // Lunes
    week[1] = {
      primary: canDoHard
        ? find('running', 'Intervals')
        : find('running', 'Zone2'),
    }; // Martes
    week[2] = { primary: find('swimming', 'Zone2') }; // Miercoles
    // Thursday already set (calisthenics)
    if (canDoModerate) {
      week[3].secondary = find('running', 'Zone2'); // 2nd session Thursday
    }
    week[4] = {
      primary: canDoModerate
        ? find('running', 'Threshold')
        : find('running', 'Zone2'),
    }; // Viernes
    week[5] = { primary: find('trail', 'LongRide') }; // Sabado
  } else if (isMarathon) {
    week[0] = { primary: find('running', 'Zone2') };
    week[1] = {
      primary: canDoHard
        ? find('running', 'Threshold')
        : find('running', 'Zone2'),
    };
    week[2] = { primary: find('swimming', 'Zone2') };
    if (canDoModerate) {
      week[3].secondary = find('running', 'Zone2');
    }
    week[4] = { primary: find('cycling', 'Zone2') };
    week[5] = {
      primary: {
        ...find('trail', 'LongRide'),
        defaultDuration: 180,
        defaultTSS: 130,
        label: 'Tirada larga preparacion maraton',
        description: '+2h30 ritmo objetivo maraton',
      },
    };
  } else if (isTrail) {
    week[0] = { primary: find('cycling', 'Zone2') };
    week[1] = {
      primary: canDoHard
        ? find('trail', 'Threshold')
        : find('trail', 'Zone2'),
    };
    week[2] = { primary: find('swimming', 'Zone2') };
    if (canDoModerate) {
      week[3].secondary = find('cycling', 'Zone2');
    }
    week[4] = {
      primary: canDoModerate
        ? find('running', 'Intervals')
        : find('running', 'Zone2'),
    };
    week[5] = { primary: find('trail', 'LongRide') };
  } else if (isCycling) {
    week[0] = { primary: find('cycling', 'Zone2') };
    week[1] = {
      primary: canDoHard
        ? find('cycling', 'VO2max')
        : find('cycling', 'Zone2'),
    };
    week[2] = { primary: find('swimming', 'Zone2') };
    if (canDoModerate) {
      week[3].secondary = find('running', 'Zone2');
    }
    week[4] = {
      primary: canDoModerate
        ? find('cycling', 'Threshold')
        : find('cycling', 'Zone2'),
    };
    week[5] = { primary: find('cycling', 'LongRide') };
  } else if (isFatLoss) {
    // More Zone2 for fat oxidation, Train Low
    week[0] = { primary: find('cycling', 'Zone2') };
    week[1] = { primary: find('running', 'Zone2') };
    week[2] = { primary: find('swimming', 'Zone2') };
    if (canDoModerate) {
      week[3].secondary = find('cycling', 'Zone2');
    }
    week[4] = {
      primary: canDoModerate
        ? find('running', 'Intervals')
        : find('running', 'Zone2'),
    };
    week[5] = { primary: find('trail', 'LongRide') };
  } else if (isBase) {
    week[0] = { primary: find('cycling', 'Zone2') };
    week[1] = { primary: find('running', 'Zone2') };
    week[2] = { primary: find('swimming', 'Zone2') };
    if (canDoModerate) {
      week[3].secondary = find('running', 'Zone2');
    }
    week[4] = { primary: find('cycling', 'Zone2') };
    week[5] = { primary: find('trail', 'Zone2') };
  } else {
    // Default: balanced multisport week
    week[0] = { primary: find('cycling', 'Zone2') };
    week[1] = {
      primary: canDoHard
        ? find('running', 'Intervals')
        : find('running', 'Zone2'),
    };
    week[2] = { primary: find('swimming', 'Zone2') };
    // Thursday already set
    if (canDoModerate) {
      week[3].secondary = find('running', 'Zone2');
    }
    week[4] = {
      primary: canDoModerate
        ? find('cycling', 'Threshold')
        : find('cycling', 'Zone2'),
    };
    week[5] = { primary: find('trail', 'LongRide') };
  }

  // Safety: if very fatigued (TSB < -10), downgrade everything to Zone2 or rest
  if (tsb < -10) {
    for (let i = 0; i < 7; i++) {
      if (i === 3) continue; // Keep Thursday calisthenics
      if (i === restDayIndex) continue; // Keep the chosen rest day
      const slot = week[i];
      if (
        slot.primary.sessionType !== 'Rest' &&
        slot.primary.sessionType !== 'Zone2'
      ) {
        const z2 = SESSION_TEMPLATES.find(
          (t) => t.sport === slot.primary.sport && t.sessionType === 'Zone2'
        );
        if (z2) slot.primary = z2;
      }
      slot.secondary = undefined; // Remove double sessions when very fatigued
    }
  }

  // OVERRIDE: Enforce rest day at the chosen index
  // (restDayIndex should never be 3 at this point due to safety check above)
  week[restDayIndex] = { primary: restTemplate };

  return week;
}

// ──────────────────────────────────────────────────────────────
// Build a training day from a session template
// ──────────────────────────────────────────────────────────────
function buildTrainingFromTemplate(
  template: SessionTemplate,
  dayOfWeek: string,
  date: string,
  isFixed?: boolean
): DayTrainingPlan {
  if (template.sessionType === 'Rest') {
    return {
      dayOfWeek,
      date,
      sport: 'rest',
      sessionType: 'Rest',
      description: 'Descanso completo',
      durationMinutes: 0,
      intensityZones: 'Descanso completo',
      physiologicalObjective: 'Recuperacion del SNC y supercompensacion',
      perceivedLoad: 'Low',
      tssEstimate: 0,
    };
  }

  const objectives = getPhysiologicalObjective(
    template.sport,
    template.sessionType
  );

  return {
    dayOfWeek,
    date,
    sport: template.sport,
    sessionType: template.sessionType,
    description: template.label,
    durationMinutes: template.defaultDuration,
    intensityZones: getIntensityDescription(template.sessionType),
    physiologicalObjective: objectives,
    perceivedLoad: getPerceivedLoad(template.sessionType),
    tssEstimate: template.defaultTSS,
    isFixed,
  };
}

function getPhysiologicalObjective(
  sport: SportType,
  sessionType: DayTrainingPlan['sessionType']
): string {
  const base: Record<string, string> = {
    Zone2: 'Salud mitocondrial, oxidacion de grasa, MCT1/MCT4 (San Millan)',
    Threshold:
      'Aclaramiento de lactato, potencia de resistencia (Lactate Shuttle)',
    VO2max: 'Capacidad aerobica maxima, potencia anaerobica',
    LongRide: 'Base aerobica, resistencia, oxidacion de grasa prolongada',
    Strength:
      'Fuerza funcional, prevencion de lesiones, integridad estructural',
    Race: 'Especificidad de competicion, metabolismo mixto',
    Intervals: 'Velocidad especifica, economia de carrera, VO2max',
    Rest: 'Recuperacion',
  };

  const sportSpecific: Partial<Record<SportType, Partial<Record<string, string>>>> = {
    running: {
      Intervals: 'Velocidad 10K, economia de carrera, aclaramiento de lactato',
      Zone2: 'Base aerobica, salud mitocondrial, ahorro de glucogeno',
    },
    swimming: {
      Zone2: 'Tecnica de nado, recuperacion activa, trabajo aerobico sin impacto',
      Intervals: 'Capacidad anaerobica en agua, economia de brazada',
    },
    trail: {
      LongRide: 'Resistencia en montana, fuerza de subida, adaptacion desnivel',
      Zone2: 'Aerobico en terreno irregular, propiocepcion, fuerza de piernas',
    },
    calisthenics: {
      Strength:
        'Fuerza peso corporal, movilidad, prevencion lesiones, Core + tren superior',
    },
  };

  return (
    sportSpecific[sport]?.[sessionType] ||
    base[sessionType] ||
    'Entrenamiento general'
  );
}

function getIntensityDescription(
  sessionType: DayTrainingPlan['sessionType']
): string {
  const map: Record<string, string> = {
    Zone2: '100% Zona 2 (55-75% FTP / 60-70% FCmax)',
    Threshold: 'Zona 4 (90-105% FTP / 85-90% FCmax)',
    VO2max: 'Zona 5 (>120% FTP / >90% FCmax)',
    LongRide: '90% Zona 2, 10% Zona 3',
    Strength: 'Fuerza funcional, control de movimiento',
    Race: 'Zonas variadas 2-5 simulando carrera',
    Intervals: 'Zona 4-5 en intervalos, Zona 1-2 en recuperacion',
    Rest: 'Descanso completo',
  };
  return map[sessionType] || '';
}

function getPerceivedLoad(
  sessionType: DayTrainingPlan['sessionType']
): DayTrainingPlan['perceivedLoad'] {
  const map: Record<string, DayTrainingPlan['perceivedLoad']> = {
    Zone2: 'Low',
    Threshold: 'High',
    VO2max: 'Very High',
    LongRide: 'Moderate',
    Strength: 'Moderate',
    Race: 'Very High',
    Intervals: 'High',
    Rest: 'Low',
  };
  return map[sessionType] || 'Moderate';
}

function getHarderSession(
  a: DayTrainingPlan,
  b: DayTrainingPlan
): DayTrainingPlan {
  const priority: Record<string, number> = {
    Rest: 0,
    Zone2: 1,
    LongRide: 2,
    Strength: 2,
    Threshold: 3,
    Intervals: 4,
    VO2max: 5,
    Race: 5,
  };
  return (priority[a.sessionType] || 0) >= (priority[b.sessionType] || 0)
    ? a
    : b;
}

function buildCalisthenicsStrength(dayOfWeek: string): DayStrengthPlan {
  return {
    dayOfWeek,
    exercises: [
      {
        name: 'Pull-ups / Dominadas',
        sets: 4,
        reps: '8-12',
        notes: 'Rango completo, control excentrico',
      },
      {
        name: 'Dips en paralelas',
        sets: 3,
        reps: '10-15',
        notes: 'Profundidad completa si movilidad lo permite',
      },
      {
        name: 'Pistol squat progresion',
        sets: 3,
        reps: '6 cada pierna',
        notes: 'Con asistencia si necesario, rango ATG',
      },
      {
        name: 'L-sit / Hollow body',
        sets: 3,
        reps: '20-30s hold',
        notes: 'Core isometrico, activacion completa',
      },
      {
        name: 'Nordic Hamstring Curls',
        sets: 3,
        reps: '6 excentrico lento',
        notes: 'Prevencion isquiotibiales',
      },
      {
        name: 'Tibialis raises',
        sets: 3,
        reps: '15 cada pierna',
        notes: 'Salud de rodilla y tobillo',
      },
    ],
  };
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const DAY_NAMES_EN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
