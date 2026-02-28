'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WeeklyPlan, DayPlan, SportType } from '@/types/planning';
import { EditDayDialog } from './EditDayDialog';
import { cn } from '@/lib/utils';

interface WeeklyPlanTableProps {
  plan: WeeklyPlan;
  onPlanChange: (updatedPlan: WeeklyPlan) => void;
  weight: number;
  tdee: number;
}

const dayNames: Record<string, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miercoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sabado',
  Sunday: 'Domingo',
};

const sportEmojis: Record<SportType | 'rest', string> = {
  cycling: '🚴',
  running: '🏃',
  trail: '⛰️',
  swimming: '🏊',
  calisthenics: '💪',
  rest: '😴',
};

const sessionColors: Record<string, string> = {
  Rest: 'bg-gray-100 text-gray-600 border-gray-200',
  Zone2: 'bg-green-100 text-green-700 border-green-200',
  Threshold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  VO2max: 'bg-red-100 text-red-700 border-red-200',
  LongRide: 'bg-blue-100 text-blue-700 border-blue-200',
  Strength: 'bg-purple-100 text-purple-700 border-purple-200',
  Race: 'bg-orange-100 text-orange-700 border-orange-200',
  Intervals: 'bg-rose-100 text-rose-700 border-rose-200',
};

const loadColors: Record<string, string> = {
  Low: 'text-green-600',
  Moderate: 'text-yellow-600',
  High: 'text-orange-600',
  'Very High': 'text-red-600',
};

export function WeeklyPlanTable({
  plan,
  onPlanChange,
  weight,
  tdee,
}: WeeklyPlanTableProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);

  function handleDaySave(dayIndex: number, updated: DayPlan) {
    const newDays = [...plan.days];
    newDays[dayIndex] = updated;
    onPlanChange({ ...plan, days: newDays });
  }

  // Calculate weekly totals
  const weeklyTSS = plan.days.reduce(
    (sum, d) =>
      sum + d.training.tssEstimate + (d.secondTraining?.tssEstimate || 0),
    0
  );
  const weeklyDuration = plan.days.reduce(
    (sum, d) =>
      sum +
      d.training.durationMinutes +
      (d.secondTraining?.durationMinutes || 0),
    0
  );
  const weeklyHours = Math.floor(weeklyDuration / 60);
  const weeklyMins = weeklyDuration % 60;

  return (
    <div className="space-y-4">
      {/* Weekly summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">TSB:</span>
          <Badge variant="outline">
            {plan.fitnessSnapshot.tsb.toFixed(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">TSS semanal:</span>
          <span className="font-semibold">{weeklyTSS}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Horas:</span>
          <span className="font-semibold">
            {weeklyHours}h {weeklyMins > 0 ? `${weeklyMins}m` : ''}
          </span>
        </div>
      </div>

      {/* Day cards */}
      <div className="grid gap-3">
        {plan.days.map((day, i) => (
          <DayCard
            key={i}
            day={day}
            dayIndex={i}
            onEdit={() => setEditingDay(i)}
          />
        ))}
      </div>

      {/* Edit dialog */}
      {editingDay !== null && (
        <EditDayDialog
          day={plan.days[editingDay]}
          dayIndex={editingDay}
          open={true}
          onClose={() => setEditingDay(null)}
          onSave={handleDaySave}
          weight={weight}
          tdee={tdee}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  dayIndex: _dayIndex,
  onEdit,
}: {
  day: DayPlan;
  dayIndex: number;
  onEdit: () => void;
}) {
  const t = day.training;
  const t2 = day.secondTraining;
  const isRest = t.sessionType === 'Rest';
  const totalTSS = t.tssEstimate + (t2?.tssEstimate || 0);

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card transition-all hover:shadow-sm',
        t.isFixed && 'ring-1 ring-purple-300',
        isRest && 'opacity-70'
      )}
    >
      <div className="flex items-stretch">
        {/* Day label */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r bg-muted/30 px-2 py-3 sm:w-24">
          <span className="text-xs font-medium text-muted-foreground">
            {dayNames[t.dayOfWeek]?.slice(0, 3) || t.dayOfWeek.slice(0, 3)}
          </span>
          <span className="text-2xl mt-0.5">
            {sportEmojis[t.sport] || '🏅'}
          </span>
          {!isRest && (
            <span className="text-xs font-mono mt-1">TSS {totalTSS}</span>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 space-y-1.5">
          {/* Primary session */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-medium',
                    sessionColors[t.sessionType]
                  )}
                >
                  {t.description || t.sessionType}
                </Badge>
                {!isRest && (
                  <span className="text-xs text-muted-foreground">
                    {t.durationMinutes} min
                  </span>
                )}
                {t.isFixed && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-purple-300 text-purple-600"
                  >
                    FIJO
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {t.physiologicalObjective}
              </p>
            </div>
            {!isRest && (
              <span
                className={cn(
                  'text-[10px] font-medium shrink-0',
                  loadColors[t.perceivedLoad]
                )}
              >
                {t.perceivedLoad}
              </span>
            )}
          </div>

          {/* Second session */}
          {t2 && (
            <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
              <span className="text-sm">
                {sportEmojis[t2.sport] || '🏅'}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px]',
                  sessionColors[t2.sessionType]
                )}
              >
                {t2.description || t2.sessionType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t2.durationMinutes} min
              </span>
            </div>
          )}

          {/* Nutrition row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              {day.nutrition.choStrategy}
            </Badge>
            {!isRest && (
              <span className="truncate">{day.nutrition.duringCHO}</span>
            )}
          </div>

          {/* Strength exercises */}
          {day.strength && (
            <div className="text-[10px] text-muted-foreground">
              💪{' '}
              {day.strength.exercises
                .slice(0, 3)
                .map((e) => e.name)
                .join(', ')}
              {day.strength.exercises.length > 3 && '...'}
            </div>
          )}
        </div>

        {/* Edit button */}
        <div className="flex items-center px-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100"
            onClick={onEdit}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
