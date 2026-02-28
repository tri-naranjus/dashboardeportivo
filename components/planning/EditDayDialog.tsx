'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DayPlan, DayTrainingPlan, SportType, SessionTemplate } from '@/types/planning';
import { SESSION_TEMPLATES } from '@/lib/recommendations/weeklyPlanEngine';
import { getNutritionForSession } from '@/lib/recommendations/nutritionRecommendation';
import { cn } from '@/lib/utils';

interface EditDayDialogProps {
  day: DayPlan;
  dayIndex: number;
  open: boolean;
  onClose: () => void;
  onSave: (dayIndex: number, updated: DayPlan) => void;
  weight: number;
  tdee: number;
}

const sportLabels: Record<SportType | 'rest', string> = {
  cycling: '🚴 Ciclismo',
  running: '🏃 Running',
  trail: '⛰️ Trail',
  swimming: '🏊 Natacion',
  calisthenics: '💪 Calistenia',
  rest: '😴 Descanso',
};

const dayNames: Record<string, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miercoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sabado',
  Sunday: 'Domingo',
};

export function EditDayDialog({
  day,
  dayIndex,
  open,
  onClose,
  onSave,
  weight,
  tdee,
}: EditDayDialogProps) {
  const [sport, setSport] = useState<SportType | 'rest'>(day.training.sport);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(
    () => {
      if (day.training.sport === 'rest') return null;
      return (
        SESSION_TEMPLATES.find(
          (t) =>
            t.sport === day.training.sport &&
            t.sessionType === day.training.sessionType
        ) || null
      );
    }
  );
  const [duration, setDuration] = useState(day.training.durationMinutes);

  // Second session
  const [hasSecond, setHasSecond] = useState(!!day.secondTraining);
  const [secondSport, setSecondSport] = useState<SportType>(
    (day.secondTraining?.sport as SportType) || 'running'
  );
  const [secondTemplate, setSecondTemplate] = useState<SessionTemplate | null>(
    () => {
      if (!day.secondTraining) return null;
      return (
        SESSION_TEMPLATES.find(
          (t) =>
            t.sport === day.secondTraining!.sport &&
            t.sessionType === day.secondTraining!.sessionType
        ) || null
      );
    }
  );
  const [secondDuration, setSecondDuration] = useState(
    day.secondTraining?.durationMinutes || 40
  );

  const isFixed = day.training.isFixed;
  const templatesForSport = SESSION_TEMPLATES.filter((t) => t.sport === sport);
  const secondTemplatesForSport = SESSION_TEMPLATES.filter(
    (t) => t.sport === secondSport
  );

  function handleSportChange(newSport: SportType | 'rest') {
    setSport(newSport);
    if (newSport === 'rest') {
      setSelectedTemplate(null);
      setDuration(0);
    } else {
      const first = SESSION_TEMPLATES.find((t) => t.sport === newSport);
      setSelectedTemplate(first || null);
      setDuration(first?.defaultDuration || 60);
    }
  }

  function handleTemplateChange(templateLabel: string) {
    const tmpl = templatesForSport.find((t) => t.label === templateLabel);
    if (tmpl) {
      setSelectedTemplate(tmpl);
      setDuration(tmpl.defaultDuration);
    }
  }

  function handleSecondSportChange(newSport: SportType) {
    setSecondSport(newSport);
    const first = SESSION_TEMPLATES.find((t) => t.sport === newSport);
    setSecondTemplate(first || null);
    setSecondDuration(first?.defaultDuration || 40);
  }

  function handleSave() {
    let training: DayTrainingPlan;

    if (sport === 'rest') {
      training = {
        dayOfWeek: day.training.dayOfWeek,
        date: day.training.date,
        sport: 'rest',
        sessionType: 'Rest',
        description: 'Descanso completo',
        durationMinutes: 0,
        intensityZones: 'Descanso completo',
        physiologicalObjective: 'Recuperacion del SNC',
        perceivedLoad: 'Low',
        tssEstimate: 0,
      };
    } else if (selectedTemplate) {
      training = {
        dayOfWeek: day.training.dayOfWeek,
        date: day.training.date,
        sport: selectedTemplate.sport,
        sessionType: selectedTemplate.sessionType,
        description: selectedTemplate.label,
        durationMinutes: duration,
        intensityZones: day.training.intensityZones,
        physiologicalObjective: day.training.physiologicalObjective,
        perceivedLoad: day.training.perceivedLoad,
        tssEstimate: Math.round(
          selectedTemplate.defaultTSS * (duration / selectedTemplate.defaultDuration)
        ),
        isFixed: day.training.isFixed,
      };
    } else {
      training = day.training;
    }

    let secondTraining: DayTrainingPlan | undefined;
    if (hasSecond && secondTemplate) {
      secondTraining = {
        dayOfWeek: day.training.dayOfWeek,
        date: day.training.date,
        sport: secondTemplate.sport,
        sessionType: secondTemplate.sessionType,
        description: secondTemplate.label,
        durationMinutes: secondDuration,
        intensityZones: '',
        physiologicalObjective: '',
        perceivedLoad: 'Moderate',
        tssEstimate: Math.round(
          secondTemplate.defaultTSS *
            (secondDuration / secondTemplate.defaultDuration)
        ),
      };
    }

    // Recalculate nutrition based on hardest session
    const mainSessionType =
      secondTraining &&
      getSessionPriority(secondTraining.sessionType) >
        getSessionPriority(training.sessionType)
        ? secondTraining.sessionType
        : training.sessionType;
    const totalDuration =
      training.durationMinutes + (secondTraining?.durationMinutes || 0);

    const nutrition = getNutritionForSession(
      mainSessionType,
      totalDuration,
      weight,
      tdee
    );
    nutrition.dayOfWeek = day.training.dayOfWeek;

    onSave(dayIndex, {
      training,
      secondTraining,
      nutrition,
      strength: day.strength,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar {dayNames[day.training.dayOfWeek] || day.training.dayOfWeek}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Fixed session notice */}
          {isFixed && (
            <div className="rounded-md bg-purple-50 border border-purple-200 p-3 text-sm">
              <span className="font-medium">💪 Sesion fija:</span> Calistenia
              los jueves (1h30, TSS 50). Puedes anadir una segunda sesion.
            </div>
          )}

          {/* Primary session */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Sesion principal</h4>

            {/* Sport selector */}
            {!isFixed && (
              <div className="space-y-1">
                <Label className="text-xs">Deporte</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    ['cycling', 'running', 'trail', 'swimming', 'calisthenics', 'rest'] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSportChange(s)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-colors',
                        sport === s
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      {sportLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Session type selector */}
            {sport !== 'rest' && templatesForSport.length > 0 && !isFixed && (
              <div className="space-y-1">
                <Label className="text-xs">Tipo de sesion</Label>
                <Select
                  value={selectedTemplate?.label || ''}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sesion" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesForSport.map((t) => (
                      <SelectItem key={t.label} value={t.label}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
            )}

            {/* Duration */}
            {sport !== 'rest' && !isFixed && (
              <div className="space-y-1">
                <Label className="text-xs">Duracion (min)</Label>
                <Input
                  type="number"
                  min={15}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            )}

            {/* TSS estimate */}
            {selectedTemplate && sport !== 'rest' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  TSS estimado:{' '}
                  {Math.round(
                    selectedTemplate.defaultTSS *
                      (duration / selectedTemplate.defaultDuration)
                  )}
                </Badge>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Second session toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Segunda sesion</h4>
              <Button
                variant={hasSecond ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHasSecond(!hasSecond)}
              >
                {hasSecond ? 'Quitar' : 'Anadir 2a sesion'}
              </Button>
            </div>

            {hasSecond && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Deporte</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ['cycling', 'running', 'trail', 'swimming'] as const
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSecondSportChange(s)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs transition-colors',
                          secondSport === s
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-border hover:bg-accent'
                        )}
                      >
                        {sportLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {secondTemplatesForSport.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de sesion</Label>
                    <Select
                      value={secondTemplate?.label || ''}
                      onValueChange={(val) => {
                        const tmpl = secondTemplatesForSport.find(
                          (t) => t.label === val
                        );
                        if (tmpl) {
                          setSecondTemplate(tmpl);
                          setSecondDuration(tmpl.defaultDuration);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona sesion" />
                      </SelectTrigger>
                      <SelectContent>
                        {secondTemplatesForSport.map((t) => (
                          <SelectItem key={t.label} value={t.label}>
                            {t.emoji} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Duracion (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={secondDuration}
                    onChange={(e) => setSecondDuration(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              Guardar cambios
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getSessionPriority(sessionType: DayTrainingPlan['sessionType']): number {
  const map: Record<string, number> = {
    Rest: 0,
    Zone2: 1,
    LongRide: 2,
    Strength: 2,
    Threshold: 3,
    Intervals: 4,
    VO2max: 5,
    Race: 5,
  };
  return map[sessionType] || 0;
}
