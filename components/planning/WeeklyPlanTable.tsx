'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WeeklyPlan } from '@/types/planning';
import { cn } from '@/lib/utils';

interface WeeklyPlanTableProps {
  plan: WeeklyPlan;
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

const sessionColors: Record<string, string> = {
  Rest: 'bg-gray-100 text-gray-700',
  Zone2: 'bg-green-100 text-green-700',
  Threshold: 'bg-yellow-100 text-yellow-700',
  VO2max: 'bg-red-100 text-red-700',
  LongRide: 'bg-blue-100 text-blue-700',
  Strength: 'bg-purple-100 text-purple-700',
  Race: 'bg-orange-100 text-orange-700',
};

export function WeeklyPlanTable({ plan }: WeeklyPlanTableProps) {
  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>CTL: {plan.fitnessSnapshot.ctl.toFixed(1)}</span>
        <span>ATL: {plan.fitnessSnapshot.atl.toFixed(1)}</span>
        <span>TSB: {plan.fitnessSnapshot.tsb.toFixed(1)}</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Dia</TableHead>
              <TableHead>Sesion</TableHead>
              <TableHead>Objetivo Fisiologico</TableHead>
              <TableHead>Nutricion</TableHead>
              <TableHead>CHO Durante</TableHead>
              <TableHead>Fuerza</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.days.map((day, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  {dayNames[day.training.dayOfWeek] || day.training.dayOfWeek}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'font-medium',
                      sessionColors[day.training.sessionType]
                    )}
                  >
                    {day.training.sessionType}
                  </Badge>
                  {day.training.durationMinutes > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {day.training.durationMinutes} min
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] text-sm">
                  {day.training.physiologicalObjective}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {day.nutrition.choStrategy}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {day.nutrition.duringCHO}
                </TableCell>
                <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                  {day.strength
                    ? day.strength.exercises
                        .map((e) => `${e.name} ${e.sets}x${e.reps}`)
                        .join(', ')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {plan.days.map((day, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {dayNames[day.training.dayOfWeek] || day.training.dayOfWeek}
              </span>
              <Badge
                variant="secondary"
                className={cn(sessionColors[day.training.sessionType])}
              >
                {day.training.sessionType}
                {day.training.durationMinutes > 0 &&
                  ` ${day.training.durationMinutes}min`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {day.training.physiologicalObjective}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{day.nutrition.choStrategy}</Badge>
              <span className="text-muted-foreground">
                {day.nutrition.duringCHO}
              </span>
            </div>
            {day.strength && (
              <div className="text-xs text-muted-foreground">
                Fuerza:{' '}
                {day.strength.exercises.map((e) => e.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
