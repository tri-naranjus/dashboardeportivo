'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityData, FitnessMetrics } from '@/types/fitness';
import {
  analyzeRestNeeds,
  CONSECUTIVE_TRAINING_THRESHOLD,
} from '@/lib/fitness/restDayAnalysis';
import { cn } from '@/lib/utils';

interface RestDaySelectorProps {
  activities: ActivityData[];
  metrics: FitnessMetrics | null;
  selectedRestDay: string;
  onRestDayChange: (day: string) => void;
}

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_LABELS: Record<string, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miercoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sabado',
  Sunday: 'Domingo',
};

const DAY_COLORS: Record<string, string> = {
  Monday: 'bg-blue-50 border-blue-200',
  Tuesday: 'bg-purple-50 border-purple-200',
  Wednesday: 'bg-green-50 border-green-200',
  Thursday: 'bg-orange-50 border-orange-200',
  Friday: 'bg-pink-50 border-pink-200',
  Saturday: 'bg-yellow-50 border-yellow-200',
  Sunday: 'bg-red-50 border-red-200',
};

export function RestDaySelector({
  activities,
  metrics,
  selectedRestDay,
  onRestDayChange,
}: RestDaySelectorProps) {
  const analysis = useMemo(
    () => analyzeRestNeeds(activities, metrics?.tsb || 0),
    [activities, metrics?.tsb]
  );

  const isUrgent = analysis.needsRestUrgently;
  const urgencyColor = isUrgent ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50';

  return (
    <Card className={cn('border-2', urgencyColor)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Día de Descanso</span>
          {isUrgent && (
            <Badge variant="destructive" className="animate-pulse">
              ⚠️ Urgente
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis summary */}
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="text-sm">
            <span className="font-medium">Historial:</span>{' '}
            <span className="text-muted-foreground">
              {analysis.daysSinceLastRest === 0
                ? 'Descansaste ayer o hoy'
                : analysis.daysSinceLastRest === 1
                  ? 'Descansaste hace 1 día'
                  : `Llevas ${analysis.daysSinceLastRest} días sin descanso`}
            </span>
          </div>
          {metrics && (
            <div className="text-sm">
              <span className="font-medium">TSB Actual:</span>{' '}
              <span
                className={cn(
                  'font-mono',
                  metrics.tsb > 10
                    ? 'text-green-600'
                    : metrics.tsb > 0
                      ? 'text-blue-600'
                      : metrics.tsb > -10
                        ? 'text-yellow-600'
                        : 'text-red-600'
                )}
              >
                {metrics.tsb.toFixed(1)}
              </span>
              <span className="text-muted-foreground ml-2">
                {metrics.tsb > 10
                  ? '(Muy fresca - lista para intensidad)'
                  : metrics.tsb > 0
                    ? '(Moderadamente fresca)'
                    : metrics.tsb > -10
                      ? '(Fatigada - prioridad Zona 2)'
                      : '(Muy fatigada - descanso recomendado)'}
              </span>
            </div>
          )}
          <div className="text-sm">
            <span className="font-medium">📋 Recomendación:</span>
            <p className="text-muted-foreground mt-1">{analysis.reason}</p>
          </div>
        </div>

        {/* Guidelines card */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <h4 className="text-sm font-medium">Guías científicas de descanso</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              • <strong>Stephen Seiler (Polarized):</strong> Mín. 1 día descanso/semana. 80% Zona 2 + intensidad.
            </li>
            <li>
              • <strong>Joe Friel:</strong> 5 días entrenamiento + 2 descanso/semana es ideal.
            </li>
            <li>
              • <strong>San Millán:</strong> Descanso crítico para adaptación mitocondrial.
            </li>
            <li>
              • <strong>Regla práctica:</strong> Después de 6-8 días seguidos entrenando, necesitas
              1-2 días de recuperación.
            </li>
            <li>
              • <strong>TSB como indicador:</strong>
              {' '}
              &lt; -15 = descanso urgente, &gt; 10 = puedes entrenar fuerte.
            </li>
            <li>
              • <strong>Deload weeks:</strong> Cada 3-4 semanas de entrenamiento duro.
            </li>
          </ul>
        </div>

        {/* Day selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Elige el día de descanso para esta semana:</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DAY_NAMES.map((day) => {
              // Thursday is locked for calisthenics
              const isThursday = day === 'Thursday';
              const isSelectable = !isThursday;

              return (
                <button
                  key={day}
                  onClick={() => isSelectable && onRestDayChange(day)}
                  disabled={!isSelectable}
                  className={cn(
                    'rounded-lg border-2 px-2 py-2 text-center text-xs font-medium transition-all',
                    DAY_COLORS[day],
                    !isSelectable
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:scale-105',
                    selectedRestDay === day && isSelectable
                      ? 'border-current ring-2 ring-current'
                      : 'border-border opacity-60 hover:opacity-100',
                    day === analysis.recommendedRestDay &&
                      selectedRestDay !== day &&
                      isSelectable &&
                      'ring-1 ring-green-500 ring-offset-1'
                  )}
                  title={isThursday ? 'Jueves: Calistenia FIJA' : ''}
                >
                  <div>{DAY_LABELS[day].slice(0, 3)}</div>
                  {isThursday && (
                    <div className="text-[10px] text-purple-600 font-bold">
                      💪
                    </div>
                  )}
                  {day === analysis.recommendedRestDay &&
                    !isThursday &&
                    selectedRestDay !== day && (
                      <div className="text-[10px] text-green-600 font-bold">
                        ✓ Rec.
                      </div>
                    )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedRestDay === analysis.recommendedRestDay
              ? `✓ ${DAY_LABELS[selectedRestDay]} es la recomendación según tu historial`
              : `Seleccionado: ${DAY_LABELS[selectedRestDay]}`}
          </p>
        </div>

        {/* Warnings */}
        {analysis.daysSinceLastRest >= CONSECUTIVE_TRAINING_THRESHOLD.urgent && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3">
            <p className="text-xs text-red-700 font-medium">
              🚨 <strong>ALERTA OVERTRAINING:</strong> Llevas {analysis.daysSinceLastRest} días
              sin descanso. Riesgo de fatiga crónica, lesiones. Tómate al menos
              2 días de descanso/movimiento muy suave.
            </p>
          </div>
        )}

        {analysis.daysSinceLastRest >= CONSECUTIVE_TRAINING_THRESHOLD.caution &&
          analysis.daysSinceLastRest < CONSECUTIVE_TRAINING_THRESHOLD.urgent && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
              <p className="text-xs text-yellow-700 font-medium">
                ⚠️ <strong>Cuidado:</strong> Llevas {analysis.daysSinceLastRest} días
                entrenando. Tu TSB es{' '}
                {metrics ? metrics.tsb.toFixed(1) : 'desconocido'}. Vigila síntomas de
                fatiga (bajo ánimo, elevada FC en reposo, irritabilidad).
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
