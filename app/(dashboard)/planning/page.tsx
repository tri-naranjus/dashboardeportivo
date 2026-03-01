'use client';

import { useState, useEffect } from 'react';
import { WeeklyPlan } from '@/types/planning';
import { FitnessMetrics, ActivityData, UserProfile } from '@/types/fitness';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { WeeklyPlanTable } from '@/components/planning/WeeklyPlanTable';
import { SessionAdvisor } from '@/components/planning/SessionAdvisor';
import { RestDaySelector } from '@/components/planning/RestDaySelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlanningPage() {
  const [objective, setObjective] = useState('');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<FitnessMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restDay, setRestDay] = useState('Sunday');

  // Auto-regenerate when rest day changes (if a plan is already showing)
  useEffect(() => {
    if (!plan || !objective.trim()) return;
    setLoading(true);
    setError('');
    fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekObjective: objective, restDayOfWeek: restDay }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setPlan(data))
      .catch(() => setError('Error al actualizar el plan.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restDay]);

  useEffect(() => {
    async function loadMetricsAndActivities() {
      try {
        let acts: ActivityData[] = [];

        // Priority 1: Intervals.icu (same as dashboard)
        try {
          const statusRes = await fetch('/api/intervals/status');
          if (statusRes.ok) {
            const status = await statusRes.json();
            if (status.connected) {
              const intervalsRes = await fetch('/api/intervals/activities');
              if (intervalsRes.ok) {
                const data = await intervalsRes.json();
                acts = data.activities || [];
              }
            }
          }
        } catch {
          // Intervals.icu not available
        }

        // Priority 2: Fallback to Strava
        if (acts.length === 0) {
          try {
            const stravaRes = await fetch('/api/strava/activities');
            if (stravaRes.ok) {
              const data = await stravaRes.json();
              acts = data.activities || [];
            }
          } catch {
            // Strava not available
          }
        }

        setActivities(acts);
        setMetrics(computeFitnessMetrics(acts, 180));

        // Load user profile for weight/tdee
        try {
          const profileRes = await fetch('/api/profile');
          if (profileRes.ok) setProfile(await profileRes.json());
        } catch {
          // Use defaults
        }
      } catch {
        setActivities([]);
        setMetrics(computeFitnessMetrics([], 180));
      }
    }
    loadMetricsAndActivities();
  }, []);

  async function handleGenerate() {
    if (!objective.trim()) {
      setError('Escribe un objetivo para la semana');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekObjective: objective,
          restDayOfWeek: restDay,
        }),
      });

      if (!res.ok) throw new Error('Error generando plan');

      const data = await res.json();
      setPlan(data);
    } catch {
      setError('Error al generar el plan. Verifica tu configuracion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planificacion Semanal</h1>
        <p className="text-muted-foreground">
          Define tu objetivo y elige tu día de descanso. Luego edita cualquier
          día para adaptarlo.
        </p>
      </div>

      {/* Rest day selector */}
      {metrics && (
        <RestDaySelector
          activities={activities}
          metrics={metrics}
          selectedRestDay={restDay}
          onRestDayChange={setRestDay}
        />
      )}

      {/* Generator form */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="objective">Objetivo de la semana</Label>
              <Input
                id="objective"
                placeholder="Ej: Preparar 10K, base aerobica, trail largo, perder grasa..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generando...' : 'Generar Plan'}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick objective buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          'Preparar 10K con series',
          'Base aerobica Zona 2',
          'Trail y montana',
          'Ciclismo potencia',
          'Perder grasa manteniendo musculo',
          'Recuperacion activa',
        ].map((obj) => (
          <Button
            key={obj}
            variant="outline"
            size="sm"
            onClick={() => {
              setObjective(obj);
            }}
          >
            {obj}
          </Button>
        ))}
      </div>

      {/* Weekly plan table (editable) */}
      {plan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan Semanal: {plan.weekObjective}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Haz click en el lapiz para editar cada dia
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyPlanTable
              plan={plan}
              onPlanChange={setPlan}
              weight={profile?.weight ?? 65}
              tdee={profile?.tdee ?? 2200}
            />
          </CardContent>
        </Card>
      )}

      {/* Session Advisor */}
      {metrics && (
        <SessionAdvisor metrics={metrics} weight={profile?.weight ?? 65} tdee={profile?.tdee ?? 2200} />
      )}
    </div>
  );
}
