'use client';

import { useState } from 'react';
import { WeeklyPlan } from '@/types/planning';
import { WeeklyPlanTable } from '@/components/planning/WeeklyPlanTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlanningPage() {
  const [objective, setObjective] = useState('');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ weekObjective: objective }),
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
          Define tu objetivo y genera un plan personalizado basado en tu estado
          de forma
        </p>
      </div>

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
                placeholder="Ej: Preparar maraton de Valencia, mejorar base aerobica, perder peso..."
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
          'Base aerobica y Zona 2',
          'Preparacion maraton',
          'Perder grasa manteniendo musculo',
          'Ganar potencia en subida',
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

      {/* Weekly plan table */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>
              Plan Semanal: {plan.weekObjective}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyPlanTable plan={plan} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
