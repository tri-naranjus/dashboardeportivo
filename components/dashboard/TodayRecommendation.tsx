'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityData } from '@/types/fitness';
import { getNutritionForSession } from '@/lib/recommendations/nutritionRecommendation';
import { CheckCircle, Dumbbell, Bike, Waves, Mountain, Footprints, Timer, HeartPulse, Zap } from 'lucide-react';

// ── Flexible weekly template ─────────────────────────────────────────────────
// 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
const WEEKLY_TEMPLATE: Record<number, {
  label: string;
  options: string[];
  icon: React.ElementType;
  sessionType: 'Zone2' | 'Threshold' | 'LongRide' | 'Strength' | 'Intervals';
  durationMinutes: number;
  intensityZones: string;
  physiologicalObjective: string;
}> = {
  0: {
    label: 'Domingo',
    options: ['Bici suave', 'Rodaje suave', 'Bici + Correr (ladrillo)'],
    icon: Bike,
    sessionType: 'Zone2',
    durationMinutes: 90,
    intensityZones: '100% Zona 2 (55-75% FTP / 60-70% FC máx)',
    physiologicalObjective: 'Recuperación activa, base aeróbica, salud mitocondrial',
  },
  1: {
    label: 'Lunes',
    options: ['Natación', 'Pesas / fuerza', 'Rodaje suave'],
    icon: Waves,
    sessionType: 'Zone2',
    durationMinutes: 60,
    intensityZones: 'Zona 2 aeróbica o fuerza funcional',
    physiologicalObjective: 'Reinicio de semana con carga baja, técnica y fuerza',
  },
  2: {
    label: 'Martes',
    options: ['Rodaje con series', 'Rodaje Zona 2'],
    icon: Footprints,
    sessionType: 'Intervals',
    durationMinutes: 60,
    intensityZones: 'Rodaje: Z2 base + series opcionales Z4-Z5 si TSB lo permite',
    physiologicalObjective: 'Running específico, economía de carrera, velocidad',
  },
  3: {
    label: 'Miércoles',
    options: ['Trail suave', 'Trail con desnivel'],
    icon: Mountain,
    sessionType: 'Zone2',
    durationMinutes: 75,
    intensityZones: '100% Zona 2 en terreno irregular',
    physiologicalObjective: 'Propiocepción, fuerza excéntrica, base aeróbica en trail',
  },
  4: {
    label: 'Jueves',
    options: ['Calistenia', 'Fuerza peso corporal'],
    icon: Dumbbell,
    sessionType: 'Strength',
    durationMinutes: 90,
    intensityZones: 'Fuerza funcional: dominadas, dips, sentadillas, core',
    physiologicalObjective: 'Fuerza peso corporal, prevención de lesiones, movilidad',
  },
  5: {
    label: 'Viernes',
    options: ['Rodaje', 'Natación', 'Bici'],
    icon: Footprints,
    sessionType: 'Zone2',
    durationMinutes: 60,
    intensityZones: 'Zona 2 aeróbica, intensidad según TSB',
    physiologicalObjective: 'Mantenimiento aeróbico, preparación para el fin de semana',
  },
  6: {
    label: 'Sábado',
    options: ['Bici larga', 'Salida en grupo', 'Gravel largo'],
    icon: Bike,
    sessionType: 'LongRide',
    durationMinutes: 180,
    intensityZones: '80-90% Zona 2, 10-20% Zona 3',
    physiologicalObjective: 'Volumen aeróbico, eficiencia lipídica, resistencia de base',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDistance(meters: number) {
  if (!meters) return null;
  return (meters / 1000).toFixed(1) + ' km';
}

function activityIcon(type: string): React.ElementType {
  const t = type.toLowerCase();
  if (t.includes('swim')) return Waves;
  if (t.includes('ride') || t.includes('cycl') || t.includes('gravel')) return Bike;
  if (t.includes('trail')) return Mountain;
  if (t.includes('weight') || t.includes('strength')) return Dumbbell;
  return Footprints;
}

function activityLabel(type: string): string {
  const map: Record<string, string> = {
    Run: 'Carrera', TrailRun: 'Trail', Ride: 'Ciclismo', GravelRide: 'Gravel',
    Swim: 'Natación', WeightTraining: 'Fuerza', VirtualRide: 'Bici Virtual',
  };
  return map[type] || type;
}

/** Infer session type from a completed activity (for nutrition) */
function sessionTypeFromActivity(a: ActivityData): 'Zone2' | 'Threshold' | 'Intervals' | 'LongRide' | 'Strength' {
  if (a.type === 'WeightTraining') return 'Strength';
  if (a.durationSeconds > 7200) return 'LongRide';
  if (a.intensityFactor > 0.85 || a.tss > 100) return 'Intervals';
  if (a.intensityFactor > 0.75 || a.tss > 65) return 'Threshold';
  return 'Zone2';
}

/** Adjust proposed session based on TSB (fatigue) */
function adjustForTSB(template: typeof WEEKLY_TEMPLATE[0], tsb: number) {
  if (tsb < -15) {
    return {
      ...template,
      sessionType: 'Zone2' as const,
      durationMinutes: Math.round(template.durationMinutes * 0.6),
      intensityZones: 'Zona 2 suave — fatiga alta, reducir duración e intensidad',
      physiologicalObjective: template.physiologicalObjective + ' (reducido por fatiga acumulada)',
    };
  }
  if (tsb < -8 && template.sessionType === 'Intervals') {
    return {
      ...template,
      sessionType: 'Zone2' as const,
      intensityZones: 'Zona 2 — omite series hoy, TSB negativo',
    };
  }
  return template;
}

// ── Props & Component ─────────────────────────────────────────────────────────

interface TodayRecommendationProps {
  tsb: number;
  weight: number;
  tdee: number;
  activities: ActivityData[];
}

export function TodayRecommendation({ tsb, weight, tdee, activities }: TodayRecommendationProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter(a => a.date === today);
  const hasTrained = todayActivities.length > 0;
  const dow = new Date().getDay(); // 0=Sun … 6=Sat
  const template = WEEKLY_TEMPLATE[dow];

  // ── MODE A: Already trained ───────────────────────────────────────────────
  if (hasTrained) {
    const totalTSS = todayActivities.reduce((s, a) => s + a.tss, 0);
    const totalDuration = todayActivities.reduce((s, a) => s + a.durationSeconds, 0);
    const hardest = [...todayActivities].sort((a, b) => b.tss - a.tss)[0];
    const mainSessionType = sessionTypeFromActivity(hardest);
    const nutrition = getNutritionForSession(mainSessionType, Math.round(totalDuration / 60), weight, tdee);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-5 py-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              {todayActivities.length === 1
                ? '¡Entrenamiento completado hoy!'
                : `¡${todayActivities.length} entrenamientos completados hoy!`}
            </p>
            <p className="text-xs text-green-700">
              {formatDuration(totalDuration)} · TSS total: {Math.round(totalTSS)} · TSB: {tsb > 0 ? '+' : ''}{tsb.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Workouts done */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lo que hiciste hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayActivities.map((a, i) => {
                const Icon = activityIcon(a.type);
                return (
                  <div key={i} className="rounded-lg bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{activityLabel(a.type)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">TSS {Math.round(a.tss)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />{formatDuration(a.durationSeconds)}
                      </span>
                      {formatDistance(a.distanceMeters) && (
                        <span>{formatDistance(a.distanceMeters)}</span>
                      )}
                      {a.averageHeartRate && (
                        <span className="flex items-center gap-1">
                          <HeartPulse className="h-3 w-3" />{Math.round(a.averageHeartRate)} bpm
                        </span>
                      )}
                      {a.normalizedPower && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />{a.normalizedPower}W NP
                        </span>
                      )}
                      <span>IF: {a.intensityFactor.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {/* Recovery state */}
              <div className={`rounded-lg p-3 text-sm ${
                totalTSS > 100
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : totalTSS > 60
                  ? 'bg-orange-50 text-orange-800 border border-orange-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {totalTSS > 100
                  ? '🔴 Sesión muy exigente — recuperación prioritaria hoy'
                  : totalTSS > 60
                  ? '🟡 Sesión moderada-alta — buena recuperación esta tarde'
                  : '🟢 Sesión suave — ya puedes descansar tranquila'}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition for the rest of the day */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nutrición para el resto del día</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-primary/5 p-3">
                <p className="font-semibold text-primary text-sm">
                  Estrategia: {nutrition.choStrategy}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basado en {activityLabel(hardest.type)} (TSS {Math.round(hardest.tss)})
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Post-entreno ahora:</span>{' '}
                  <span className="text-muted-foreground">{nutrition.postworkoutCHO}</span>
                </div>
                <div>
                  <span className="font-medium">Proteína diaria:</span>{' '}
                  <span className="text-muted-foreground">{nutrition.dailyProtein}</span>
                </div>
                <div>
                  <span className="font-medium">Calorías hoy:</span>{' '}
                  <span className="text-muted-foreground">{nutrition.dailyCalories}</span>
                </div>
                <div>
                  <span className="font-medium">Hidratación:</span>{' '}
                  <span className="text-muted-foreground">{nutrition.hydration} — recuperación activa</span>
                </div>
                {totalTSS > 80 && (
                  <div className="rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                    💡 Sesión exigente: prioriza CHO en las próximas 2h para rellenar glucógeno muscular
                  </div>
                )}
              </div>
              <p className="text-xs italic text-muted-foreground">{nutrition.scientificBasis}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── MODE B: Not trained yet ───────────────────────────────────────────────
  const proposed = adjustForTSB(template, tsb);
  const nutrition = getNutritionForSession(proposed.sessionType, proposed.durationMinutes, weight, tdee);
  const Icon = template.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-5 py-3">
        <Icon className="h-6 w-6 text-primary flex-shrink-0" />
        <div>
          <p className="font-semibold text-foreground">
            {template.label} — Propuesta de hoy
          </p>
          <p className="text-xs text-muted-foreground">
            {template.options.join(' · ')}
            {tsb < -8 && (
              <span className="text-orange-600 ml-1">
                · intensidad reducida por fatiga (TSB {tsb.toFixed(1)})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Proposed session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="h-4 w-4" />
              Entrenamiento Propuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-primary/5 p-3">
              <p className="font-semibold text-primary">
                {template.options[0]} — {proposed.durationMinutes} min
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{proposed.intensityZones}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Objetivo fisiológico</p>
              <p className="text-sm text-muted-foreground">{proposed.physiologicalObjective}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Opciones para hoy (escoge la que más te apetezca):
              </p>
              <div className="flex flex-wrap gap-2">
                {template.options.map((opt, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{opt}</Badge>
                ))}
              </div>
            </div>

            <div className={`rounded-lg p-2 text-xs ${
              tsb > 5
                ? 'bg-green-50 text-green-800 border border-green-200'
                : tsb >= -8
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-orange-50 text-orange-800 border border-orange-200'
            }`}>
              {tsb > 5
                ? `✅ TSB ${tsb.toFixed(1)}: cuerpo fresco — puedes añadir intensidad si quieres`
                : tsb >= -8
                ? `🟡 TSB ${tsb.toFixed(1)}: algo de fatiga — mantén Zona 2 sin forzar`
                : `🔴 TSB ${tsb.toFixed(1)}: fatiga alta — sesión corta y suave`}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nutrición para hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-primary/5 p-3">
              <p className="font-semibold text-primary text-sm">
                Estrategia: {nutrition.choStrategy}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Pre-entreno:</span>{' '}
                <span className="text-muted-foreground">{nutrition.preworkoutCHO}</span>
              </div>
              <div>
                <span className="font-medium">Durante:</span>{' '}
                <span className="text-muted-foreground">{nutrition.duringCHO}</span>
              </div>
              <div>
                <span className="font-medium">Post-entreno:</span>{' '}
                <span className="text-muted-foreground">{nutrition.postworkoutCHO}</span>
              </div>
              <div>
                <span className="font-medium">Proteína diaria:</span>{' '}
                <span className="text-muted-foreground">{nutrition.dailyProtein}</span>
              </div>
              <div>
                <span className="font-medium">Calorías:</span>{' '}
                <span className="text-muted-foreground">{nutrition.dailyCalories}</span>
              </div>
            </div>
            <p className="text-xs italic text-muted-foreground">{nutrition.scientificBasis}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
