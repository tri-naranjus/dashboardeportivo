import { ActivityData } from '@/types/fitness';

/**
 * Análisis de días de descanso basado en:
 * 1. Cuántos días llevas sin descanso en el historial
 * 2. TSB (fatiga acumulativa)
 */

export interface RestAnalysis {
  daysSinceLastRest: number;
  lastRestDate: string | null;
  recommendedRestDay: string; // 'Monday' | 'Tuesday' | ... | 'Sunday'
  needsRestUrgently: boolean; // TSB < -10 o > 10 días sin descanso
  reason: string;
  maxConsecutiveDays: number; // días consecutivos de entrenamiento
}

/**
 * Analiza el historial de entrenamientos y recomienda día de descanso
 * Datos: últimas 2 semanas de historial
 */
export function analyzeRestNeeds(
  activities: ActivityData[],
  tsb: number
): RestAnalysis {
  // Filtrar actividades de los últimos 14 días
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

  const recentActivities = activities.filter((a) => a.date >= twoWeeksAgoStr);

  // Ordenar por fecha
  const sorted = recentActivities.sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sorted.length === 0) {
    // Sin historial: recomendar descanso el domingo (descanso tradicional)
    return {
      daysSinceLastRest: 0,
      lastRestDate: null,
      recommendedRestDay: 'Sunday',
      needsRestUrgently: false,
      reason: 'No hay historial. Descanso recomendado: domingo (tradición)',
      maxConsecutiveDays: 0,
    };
  }

  // Buscar el último descanso (día sin actividades)
  let lastRestDate: string | null = null;
  let daysSinceLastRest = 0;

  const today = new Date();

  // Crear un set de días con actividades
  const daysWithActivity = new Set(sorted.map((a) => a.date));

  // Iterar hacia atrás desde hoy para encontrar el último descanso
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];

    if (!daysWithActivity.has(checkDateStr)) {
      lastRestDate = checkDateStr;
      daysSinceLastRest = i;
      break;
    }
  }

  // Si no encontró descanso en 30 días (muy raro)
  if (lastRestDate === null) {
    daysSinceLastRest = 30;
  }

  // Calcular máximo de días consecutivos de entrenamiento
  let maxConsecutiveDays = 0;
  let currentStreak = 0;

  for (let i = 30; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];

    if (daysWithActivity.has(checkDateStr)) {
      currentStreak++;
    } else {
      if (currentStreak > maxConsecutiveDays) {
        maxConsecutiveDays = currentStreak;
      }
      currentStreak = 0;
    }
  }

  // Recomendación de día de descanso
  let recommendedRestDay = 'Sunday'; // Por defecto
  let needsRestUrgently = false;
  let reason = '';

  // Lógica de recomendación
  if (daysSinceLastRest >= 10) {
    // Lleva 10+ días sin descanso: URGENTE
    needsRestUrgently = true;
    recommendedRestDay = getNextDayInWeek(new Date(), 1); // Mañana o próximo disponible
    reason = `⚠️ URGENTE: ${daysSinceLastRest} días sin descanso. Riesgo de overtraining.`;
  } else if (daysSinceLastRest >= 7) {
    // 7-9 días sin descanso
    needsRestUrgently = true;
    recommendedRestDay = 'Sunday'; // Domingo típicamente
    reason = `Recomendado: ${daysSinceLastRest} días sin descanso. Necesitas 1-2 días de recuperación.`;
  } else if (tsb < -15) {
    // TSB muy negativo: muy fatigada
    needsRestUrgently = true;
    recommendedRestDay = 'Sunday';
    reason = `TSB muy bajo (${tsb.toFixed(1)}). Fatiga acumulada: descansa 1-2 días.`;
  } else if (daysSinceLastRest >= 5) {
    // 5-6 días: recomendable descansar
    recommendedRestDay = 'Sunday';
    reason = `Llevas ${daysSinceLastRest} días entrenando. Un descanso te sentará bien.`;
  } else if (daysSinceLastRest >= 3) {
    // 3-4 días: flexible
    recommendedRestDay = 'Sunday';
    reason = `Normal: ${daysSinceLastRest} días de entrenamiento. Descanso flexible.`;
  } else {
    // Muy pocos días o descanso reciente
    recommendedRestDay = 'Sunday';
    reason = `Descanso reciente (hace ${daysSinceLastRest} día${daysSinceLastRest === 1 ? '' : 's'}). Ritmo de recuperación bueno.`;
  }

  return {
    daysSinceLastRest,
    lastRestDate,
    recommendedRestDay,
    needsRestUrgently,
    reason,
    maxConsecutiveDays,
  };
}

function getNextDayInWeek(fromDate: Date, offset: number = 0): string {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + offset);

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return dayNames[d.getDay()];
}

/**
 * Reglas de descanso según el contexto de entrenamiento
 */
export const REST_DAY_GUIDELINES = {
  minimal: {
    description: 'Entrenamiento minimalista',
    restDaysPerWeek: 1,
    recommendations:
      'Al menos 1 día completo de descanso. Ideal: domingo o lunes.',
  },
  polarized: {
    description: 'Entrenamiento polarizado (Seiler)',
    restDaysPerWeek: 1,
    recommendations:
      '80% Zona 2 + 1-2 días duros. Mínimo 1 día descanso (domingo). Algunos atletas: 2 días con ejercicio muy suave.',
  },
  intense: {
    description: 'Entrenamiento intenso (fase de competición)',
    restDaysPerWeek: 1,
    recommendations:
      'Necesitas 1-2 días completos de descanso. Monitorea TSB: si < -10, tómate 2 días.',
  },
  periodized: {
    description: 'Entrenamiento periodizado (Friel/ATT)',
    restDaysPerWeek: 2,
    recommendations:
      'Semana típica: 5 días de entrenamiento + 2 de descanso. Cada 3-4 semanas: deload week (50% volumen).',
  },
  recovery: {
    description: 'Semana de recuperación / Deload',
    restDaysPerWeek: 2,
    recommendations:
      'Reduce volumen 40-50%. Enfoque: movimiento suave, Zona 2, flexibilidad. TSB debería subir hacia +10.',
  },
};

/**
 * Regla: después de cuántos días de entrenamiento necesitas descanso
 * Basado en la ciencia de la fatiga neuromuscular
 */
export const CONSECUTIVE_TRAINING_THRESHOLD = {
  safe: 6, // 6 días seguidos es seguro para la mayoría
  caution: 8, // 8 días: cuidado, vigila TSB y síntomas
  urgent: 10, // 10+ días: casi seguro overtraining
};
