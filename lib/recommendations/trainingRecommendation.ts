import { TrainingStatus } from '@/types/fitness';
import { DayTrainingPlan } from '@/types/planning';

export interface TrainingRecommendation {
  status: TrainingStatus;
  badge: string;
  badgeColor: 'green' | 'blue' | 'orange' | 'red';
  sessionType: DayTrainingPlan['sessionType'];
  description: string;
  durationMinutes: number;
  intensityZones: string;
  physiologicalObjective: string;
  perceivedLoad: 'Low' | 'Moderate' | 'High' | 'Very High';
}

/**
 * Get training recommendation based on TSB
 * TSB (Training Stress Balance) = CTL - ATL
 */
export function getTrainingRecommendation(tsb: number): TrainingRecommendation {
  if (tsb > 10) {
    return {
      status: 'high_intensity',
      badge: '✅ Lista para Alta Intensidad',
      badgeColor: 'green',
      sessionType: 'VO2max',
      description:
        'TSB alto: cuerpo fresco y bien adaptado. Ideal para trabajo de VO2max, lactato y alta potencia.',
      durationMinutes: 75,
      intensityZones: '5-10 min calentamiento + 4x4 min VO2max + 10 min enfriamiento',
      physiologicalObjective: 'Estímulo de VO2max, oxidación de lactato, potencia anaeróbica',
      perceivedLoad: 'Very High',
    };
  } else if (tsb >= 0 && tsb <= 10) {
    return {
      status: 'moderate',
      badge: '🟢 Moderadamente Fresco',
      badgeColor: 'blue',
      sessionType: 'Threshold',
      description:
        'TSB moderado: cuerpo adaptado pero no completamente fresco. Bueno para trabajo de umbral.',
      durationMinutes: 90,
      intensityZones: '20-30 min Z2 + 2x20 min Z4 Umbral + 10 min enfriamiento',
      physiologicalObjective:
        'Adaptación al umbral, mejora de economía metabólica',
      perceivedLoad: 'High',
    };
  } else if (tsb >= -10 && tsb < 0) {
    return {
      status: 'zone2_priority',
      badge: '🟡 Prioridad Zona 2',
      badgeColor: 'orange',
      sessionType: 'Zone2',
      description:
        'TSB negativo: cuerpo fatigado acumulativamente. Mantén en Zona 2 para permitir recuperación mientras proteges la salud mitocondrial.',
      durationMinutes: 75,
      intensityZones: '100% Zona 2 (85-95% LTHR, ~55-75% FTP)',
      physiologicalObjective:
        'Salud mitocondrial, oxidación de grasa, recuperación activa',
      perceivedLoad: 'Low',
    };
  } else {
    // TSB < -10
    return {
      status: 'recovery',
      badge: '🔴 Recuperación Total',
      badgeColor: 'red',
      sessionType: 'Rest',
      description:
        'TSB muy negativo: fatiga alta. Considera descanso completo o sesión muy suave de recuperación activa.',
      durationMinutes: 0,
      intensityZones: 'Descanso o movimiento suave',
      physiologicalObjective:
        'Recuperación del SNC, prevención del overtraining',
      perceivedLoad: 'Low',
    };
  }
}

/**
 * Get session type description and details
 */
export function getSessionTypeDetails(sessionType: DayTrainingPlan['sessionType']) {
  const details: Record<DayTrainingPlan['sessionType'], Partial<TrainingRecommendation>> = {
    Rest: {
      description: 'Día de descanso completo',
      durationMinutes: 0,
      physiologicalObjective: 'Recuperación total',
      perceivedLoad: 'Low',
    },
    Zone2: {
      description: 'Sesión aeróbica en Zona 2',
      durationMinutes: 60,
      intensityZones: '100% Zona 2',
      physiologicalObjective: 'Salud mitocondrial, oxidación de grasa',
      perceivedLoad: 'Low',
    },
    Threshold: {
      description: 'Trabajo de umbral',
      durationMinutes: 90,
      intensityZones: '2x20 min Z4',
      physiologicalObjective: 'Aclaramiento de lactato, mejora metabólica',
      perceivedLoad: 'High',
    },
    VO2max: {
      description: 'Intervalos de VO2max',
      durationMinutes: 75,
      intensityZones: '4x4 min Z5',
      physiologicalObjective: 'Capacidad aeróbica, potencia',
      perceivedLoad: 'Very High',
    },
    LongRide: {
      description: 'Salida larga aeróbica',
      durationMinutes: 180,
      intensityZones: '90% Zona 2, 10% Z3',
      physiologicalObjective: 'Base aeróbica, resistencia',
      perceivedLoad: 'Moderate',
    },
    Strength: {
      description: 'Sesión de fuerza estructural',
      durationMinutes: 45,
      intensityZones: 'Fuerza de tensión y rango de movimiento',
      physiologicalObjective: 'Prevención de lesiones, fuerza funcional',
      perceivedLoad: 'Moderate',
    },
    Race: {
      description: 'Sesión tipo carrera',
      durationMinutes: 120,
      intensityZones: 'Variado Z2-Z5',
      physiologicalObjective: 'Especificidad de carrera, metabolismo mixto',
      perceivedLoad: 'Very High',
    },
    Intervals: {
      description: 'Series de velocidad (10K)',
      durationMinutes: 60,
      intensityZones: '5x1km Z4-Z5, rec 2min',
      physiologicalObjective: 'Velocidad especifica, economia de carrera',
      perceivedLoad: 'High',
    },
  };

  return details[sessionType] || {};
}
