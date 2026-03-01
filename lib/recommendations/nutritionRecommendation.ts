import { DayTrainingPlan, DayNutritionPlan } from '@/types/planning';

/**
 * Get nutrition plan for a training session
 * Based on Viribay's Nutritional Periodization and Brooks' Lactate Shuttle
 */
export function getNutritionForSession(
  sessionType: DayTrainingPlan['sessionType'],
  durationMinutes: number,
  weight: number,
  tdee: number
): DayNutritionPlan {
  const dayOfWeek = '';
  const w = Math.round(weight);

  switch (sessionType) {
    case 'Intervals':
    case 'VO2max':
    case 'Threshold':
      // High intensity: Train High
      // Reference: Brooks (2020) - lactate oxidation at high intensity
      return {
        dayOfWeek,
        choStrategy: 'Train High',
        preworkoutCHO: `1-2g/kg CHO 2-3h antes (${w}-${Math.round(2 * weight)}g para ${w}kg)`,
        duringCHO:
          durationMinutes > 90
            ? '60-90g CHO/hr (glucosa:fructosa 2:1)'
            : '30-45g CHO/hr si <90 min',
        postworkoutCHO: `1.2g/kg glucosa en los primeros 30 min (${Math.round(1.2 * weight)}g para ${w}kg)`,
        dailyProtein: `2.0g/kg (${Math.round(2.0 * weight)}g para ${w}kg)`,
        dailyCalories: `TDEE + 300-500 kcal (${tdee + 300}-${tdee + 500})`,
        hydration: '500-750ml/hr según sudoración',
        scientificBasis:
          'Brooks (2020): Lactate Shuttle - oxidación de lactato como combustible a alta intensidad. Viribay: máxima disponibilidad de CHO para rendimiento.',
      };

    case 'Zone2':
      // Aerobic: Train Low (fasted or low CHO)
      // Reference: San Millán & Brooks (2018)
      return {
        dayOfWeek,
        choStrategy: 'Train Low',
        preworkoutCHO: 'En ayunas o solo proteína + grasas',
        duringCHO:
          durationMinutes > 90
            ? '20-40g CHO/hr si >90min (principalmente electrolitos)'
            : 'Solo agua y electrolitos',
        postworkoutCHO: `0.5g/kg CHO (${Math.round(0.5 * weight)}g para ${w}kg) + proteína para iniciar recuperación`,
        dailyProtein: `1.6-1.8g/kg (${Math.round(1.6 * weight)}-${Math.round(1.8 * weight)}g para ${w}kg)`,
        dailyCalories: `TDEE o ligeramente bajo (${tdee - 100}-${tdee})`,
        hydration: '400-600ml/hr según sudoración',
        scientificBasis:
          'San Millán & Brooks (2018): Zona 2 para salud mitocondrial y oxidación de grasa. Train Low promueve adaptaciones aeróbicas.',
      };

    case 'LongRide':
      // Long endurance: Race simulation protocol
      return {
        dayOfWeek,
        choStrategy: 'Race Protocol',
        preworkoutCHO: `1.5g/kg CHO 2-3h antes (${Math.round(1.5 * weight)}g para ${w}kg)`,
        duringCHO:
          '60-90g CHO/hr (preferiblemente glucosa:fructosa 2:1 para GI alto)',
        postworkoutCHO: `1.2g/kg glucosa en los primeros 30 min (${Math.round(1.2 * weight)}g para ${w}kg)`,
        dailyProtein: `1.8g/kg (${Math.round(1.8 * weight)}g para ${w}kg)`,
        dailyCalories: `TDEE + 500-800 kcal (${tdee + 500}-${tdee + 800}) - alto gasto energético`,
        hydration: '600-800ml/hr con sodio (400-700mg)',
        scientificBasis:
          'Protocolo de simulación de carrera: entrena sistema digestivo a tolerar 90g CHO/hr necesarios en competición.',
      };

    case 'Strength':
      // Strength: protein focus, moderate CHO
      return {
        dayOfWeek,
        choStrategy: 'Train High',
        preworkoutCHO: `0.5-1g/kg CHO 1-2h antes (${Math.round(0.5 * weight)}-${w}g para ${w}kg)`,
        duringCHO: 'Solo agua',
        postworkoutCHO:
          `0.5-0.7g/kg CHO (${Math.round(0.5 * weight)}-${Math.round(0.7 * weight)}g) + proteína en los 30 min post`,
        dailyProtein: `2.2-2.5g/kg (${Math.round(2.2 * weight)}-${Math.round(2.5 * weight)}g para ${w}kg) - máximo para reparación`,
        dailyCalories: `TDEE o +100-200 kcal para supercompensación anabólica (${tdee}-${tdee + 200})`,
        hydration: '400-600ml/hr + electrolitos',
        scientificBasis:
          'Reparación muscular: proteína alta para MPS (síntesis proteica muscular), CHO moderado para glucógeno muscular.',
      };

    case 'Rest':
      // Rest day: low CHO, high protein
      return {
        dayOfWeek,
        choStrategy: 'Recovery',
        preworkoutCHO: 'N/A',
        duringCHO: 'N/A',
        postworkoutCHO: 'N/A',
        dailyProtein: `1.8-2.0g/kg (${Math.round(1.8 * weight)}-${Math.round(2.0 * weight)}g para ${w}kg)`,
        dailyCalories: `TDEE o -100-200 kcal si buscas pérdida de peso (${tdee - 200}-${tdee})`,
        hydration: '2-3L agua sin restricción',
        scientificBasis:
          'Día de descanso: reduce CHO para promover oxidación de grasa y recuperación hormonal. Proteína para reparación de tejidos.',
      };

    case 'Race':
      // Race simulation
      return {
        dayOfWeek,
        choStrategy: 'Race Protocol',
        preworkoutCHO: `1.5-2g/kg CHO 2-3h antes (${Math.round(1.5 * weight)}-${Math.round(2 * weight)}g para ${w}kg)`,
        duringCHO: '90g CHO/hr (60g glucosa + 30g fructosa)',
        postworkoutCHO: `1.5g/kg glucosa en 30 min post (${Math.round(1.5 * weight)}g para ${w}kg)`,
        dailyProtein: `2.0g/kg (${Math.round(2.0 * weight)}g para ${w}kg)`,
        dailyCalories: `TDEE + 600-1000 kcal según intensidad (${tdee + 600}-${tdee + 1000})`,
        hydration: '750-1000ml/hr con sodio (600-800mg)',
        scientificBasis:
          'Especificidad de carrera: simula energía y distribución de nutrientes en competición real.',
      };

    default:
      // Default (unknown type)
      return {
        dayOfWeek,
        choStrategy: 'Train High',
        preworkoutCHO: `1g/kg CHO 2h antes (${w}g para ${w}kg)`,
        duringCHO: '60g CHO/hr',
        postworkoutCHO: `1g/kg CHO en 30 min post (${w}g para ${w}kg)`,
        dailyProtein: `1.8g/kg (${Math.round(1.8 * weight)}g para ${w}kg)`,
        dailyCalories: `${tdee}`,
        hydration: '500-750ml/hr',
        scientificBasis: 'Valores por defecto',
      };
  }
}
