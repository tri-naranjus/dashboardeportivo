'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FitnessMetrics } from '@/types/fitness';
import { getTrainingRecommendation } from '@/lib/recommendations/trainingRecommendation';
import { getNutritionForSession } from '@/lib/recommendations/nutritionRecommendation';
import { DayTrainingPlan } from '@/types/planning';
import { cn } from '@/lib/utils';

interface SessionAdvisorProps {
  metrics: FitnessMetrics;
  weight: number;
  tdee: number;
}

interface SessionOption {
  label: string;
  type: DayTrainingPlan['sessionType'];
  description: string;
  emoji: string;
}

const sessionOptions: SessionOption[] = [
  {
    label: 'Intervalos VO2max',
    type: 'VO2max',
    description: '4x4 min a tope, descanso entre series',
    emoji: '🔴',
  },
  {
    label: 'Umbral / Threshold',
    type: 'Threshold',
    description: '2x20 min al umbral, trabajo de lactato',
    emoji: '🟡',
  },
  {
    label: 'Zona 2 (aerobico suave)',
    type: 'Zone2',
    description: 'Ritmo conversacional, salud mitocondrial',
    emoji: '🟢',
  },
  {
    label: 'Tirada larga',
    type: 'LongRide',
    description: '+2h de duracion, base aerobica',
    emoji: '🔵',
  },
  {
    label: 'Fuerza / Gimnasio',
    type: 'Strength',
    description: 'ATG Squat, Nordics, Tibialis',
    emoji: '🟣',
  },
  {
    label: 'Series 10K',
    type: 'Intervals',
    description: '5x1km a ritmo 10K, trabajo de velocidad',
    emoji: '🟠',
  },
];

interface Verdict {
  canDo: boolean;
  title: string;
  explanation: string;
  alternative?: string;
  alternativeType?: DayTrainingPlan['sessionType'];
  riskLevel: 'low' | 'moderate' | 'high';
}

function getVerdict(
  requested: DayTrainingPlan['sessionType'],
  tsb: number,
  _ctl: number
): Verdict {
  const rec = getTrainingRecommendation(tsb);

  // High intensity sessions require fresh body
  if (
    (requested === 'VO2max' || requested === 'Race' || requested === 'Intervals') &&
    tsb < -5
  ) {
    return {
      canDo: false,
      title: '⛔ No recomendado hoy',
      explanation: `Tu TSB es ${tsb.toFixed(1)} (fatiga acumulada). Hacer ${requested} con esta fatiga aumenta riesgo de lesion y reduce la calidad del estimulo. El cuerpo no puede producir la potencia necesaria para un estimulo de VO2max efectivo.`,
      alternative: 'Zona 2 para recuperacion activa y proteger la funcion mitocondrial',
      alternativeType: 'Zone2',
      riskLevel: 'high',
    };
  }

  if (requested === 'Threshold' && tsb < -10) {
    return {
      canDo: false,
      title: '⛔ Demasiada fatiga para umbral',
      explanation: `Con TSB de ${tsb.toFixed(1)}, tu sistema nervioso central no puede mantener la intensidad necesaria para un trabajo de umbral efectivo. El riesgo de sobreentrenamiento es alto.`,
      alternative: 'Zona 2 suave o descanso completo para permitir supercompensacion',
      alternativeType: 'Zone2',
      riskLevel: 'high',
    };
  }

  if (requested === 'Threshold' && tsb < 0) {
    return {
      canDo: true,
      title: '⚠️ Posible pero con precaucion',
      explanation: `Tu TSB es ${tsb.toFixed(1)} - ligeramente fatigada. Puedes hacer umbral pero reduce a 1x20 min en vez de 2x20. Si la FC sube mas de lo normal en los primeros 5 min, para y cambia a Zona 2.`,
      riskLevel: 'moderate',
    };
  }

  if (requested === 'LongRide' && tsb < -10) {
    return {
      canDo: false,
      title: '⛔ Tirada larga contraindicada',
      explanation: `Con TSB ${tsb.toFixed(1)}, una sesion larga agotaria tus reservas de glucogeno y profundizaria la fatiga. Riesgo de catabolismo muscular y dano inmunitario.`,
      alternative: 'Zona 2 corta (45-60 min max) o descanso total',
      alternativeType: 'Zone2',
      riskLevel: 'high',
    };
  }

  if ((requested === 'VO2max' || requested === 'Intervals') && tsb >= -5 && tsb < 5) {
    return {
      canDo: true,
      title: '⚠️ Posible pero monitoriza',
      explanation: `TSB de ${tsb.toFixed(1)} es aceptable para VO2max pero no ideal. Reduce a 3x4 min en vez de 4x4. Si en la 2a serie no alcanzas >90% FC max, para y cambia a tempo.`,
      riskLevel: 'moderate',
    };
  }

  // Zone2 is almost always OK
  if (requested === 'Zone2') {
    if (tsb < -15) {
      return {
        canDo: true,
        title: '⚠️ Zona 2 OK pero corta',
        explanation: `Fatiga muy alta (TSB ${tsb.toFixed(1)}). Puedes hacer Zona 2 pero limita a 45 min maximo. Si la FC de reposo esta >5 bpm por encima de lo normal, descansa.`,
        riskLevel: 'moderate',
      };
    }
    return {
      canDo: true,
      title: '✅ Perfecto para hoy',
      explanation: `La Zona 2 es siempre una opcion segura y beneficiosa. Mejora la densidad mitocondrial, el aclaramiento de lactato (MCT1/MCT4) y la oxidacion de grasa. San Millan recomienda 3-4 sesiones/semana.`,
      riskLevel: 'low',
    };
  }

  if (requested === 'Strength') {
    if (tsb < -10) {
      return {
        canDo: true,
        title: '⚠️ Fuerza OK pero reduce volumen',
        explanation: `Con fatiga alta, reduce a 2 series en vez de 3 por ejercicio. Enfocate en rango de movimiento y control, no en carga maxima. Prioriza Tibialis y movilidad.`,
        riskLevel: 'moderate',
      };
    }
    return {
      canDo: true,
      title: '✅ Adelante con la fuerza',
      explanation: `La fuerza estructural (AntiCulturista) es compatible con cualquier estado de forma. Enfoque en tension y rango de movimiento atletico, no volumen muscular.`,
      riskLevel: 'low',
    };
  }

  // Default: all good
  return {
    canDo: true,
    title: '✅ Adelante',
    explanation: `Tu estado de forma (TSB ${tsb.toFixed(1)}) permite esta sesion. ${rec.description}`,
    riskLevel: 'low',
  };
}

export function SessionAdvisor({ metrics, weight, tdee }: SessionAdvisorProps) {
  const [selected, setSelected] = useState<SessionOption | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  function handleSelect(option: SessionOption) {
    setSelected(option);
    const v = getVerdict(option.type, metrics.tsb, metrics.ctl);
    setVerdict(v);
  }

  const nutrition = selected
    ? getNutritionForSession(selected.type, 90, weight, tdee)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Que quieres entrenar hoy?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session options */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sessionOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent',
                selected?.type === opt.type && 'border-primary bg-primary/5'
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-muted-foreground">
                {opt.description}
              </span>
            </button>
          ))}
        </div>

        {/* Verdict */}
        {verdict && selected && (
          <div
            className={cn(
              'rounded-lg border p-4 space-y-3',
              verdict.riskLevel === 'low' && 'border-green-200 bg-green-50',
              verdict.riskLevel === 'moderate' && 'border-yellow-200 bg-yellow-50',
              verdict.riskLevel === 'high' && 'border-red-200 bg-red-50'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{verdict.title}</h3>
              <Badge
                variant="outline"
                className={cn(
                  verdict.riskLevel === 'low' && 'border-green-500 text-green-700',
                  verdict.riskLevel === 'moderate' && 'border-yellow-500 text-yellow-700',
                  verdict.riskLevel === 'high' && 'border-red-500 text-red-700'
                )}
              >
                TSB: {metrics.tsb.toFixed(1)}
              </Badge>
            </div>

            <p className="text-sm">{verdict.explanation}</p>

            {verdict.alternative && (
              <div className="rounded-md bg-white/50 p-3">
                <p className="text-sm font-medium">Alternativa recomendada:</p>
                <p className="text-sm text-muted-foreground">
                  {verdict.alternative}
                </p>
                {verdict.alternativeType && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const alt = sessionOptions.find(
                        (o) => o.type === verdict.alternativeType
                      );
                      if (alt) handleSelect(alt);
                    }}
                  >
                    Ver plan para {verdict.alternativeType}
                  </Button>
                )}
              </div>
            )}

            {/* Nutrition advice for this session */}
            {verdict.canDo && nutrition && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-medium">
                  Nutricion para esta sesion:
                </p>
                <div className="grid gap-1 text-sm">
                  <div>
                    <span className="font-medium">Estrategia: </span>
                    <Badge variant="outline" className="text-xs">
                      {nutrition.choStrategy}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Pre: </span>
                    <span className="text-muted-foreground">
                      {nutrition.preworkoutCHO}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Durante: </span>
                    <span className="text-muted-foreground">
                      {nutrition.duringCHO}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Post: </span>
                    <span className="text-muted-foreground">
                      {nutrition.postworkoutCHO}
                    </span>
                  </div>
                </div>
                <p className="text-xs italic text-muted-foreground mt-1">
                  {nutrition.scientificBasis}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
