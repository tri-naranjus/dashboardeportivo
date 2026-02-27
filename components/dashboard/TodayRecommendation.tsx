'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrainingRecommendation } from '@/lib/recommendations/trainingRecommendation';
import { getNutritionForSession } from '@/lib/recommendations/nutritionRecommendation';

interface TodayRecommendationProps {
  tsb: number;
  weight: number;
  tdee: number;
}

export function TodayRecommendation({
  tsb,
  weight,
  tdee,
}: TodayRecommendationProps) {
  const rec = getTrainingRecommendation(tsb);
  const nutrition = getNutritionForSession(
    rec.sessionType,
    rec.durationMinutes,
    weight,
    tdee
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Training card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Entrenamiento Hoy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-primary/5 p-3">
            <p className="font-semibold text-primary">
              {rec.sessionType === 'Rest'
                ? 'Descanso Completo'
                : `${rec.sessionType} - ${rec.durationMinutes} min`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {rec.intensityZones}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Objetivo Fisiologico</p>
            <p className="text-sm text-muted-foreground">
              {rec.physiologicalObjective}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Razonamiento</p>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition card */}
      <Card>
        <CardHeader>
          <CardTitle>Nutricion Hoy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-primary/5 p-3">
            <p className="font-semibold text-primary">
              Estrategia: {nutrition.choStrategy}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Pre-entreno:</span>{' '}
              <span className="text-muted-foreground">
                {nutrition.preworkoutCHO}
              </span>
            </div>
            <div>
              <span className="font-medium">Durante:</span>{' '}
              <span className="text-muted-foreground">
                {nutrition.duringCHO}
              </span>
            </div>
            <div>
              <span className="font-medium">Post-entreno:</span>{' '}
              <span className="text-muted-foreground">
                {nutrition.postworkoutCHO}
              </span>
            </div>
            <div>
              <span className="font-medium">Proteina diaria:</span>{' '}
              <span className="text-muted-foreground">
                {nutrition.dailyProtein}
              </span>
            </div>
            <div>
              <span className="font-medium">Calorias:</span>{' '}
              <span className="text-muted-foreground">
                {nutrition.dailyCalories}
              </span>
            </div>
          </div>
          <p className="text-xs italic text-muted-foreground">
            {nutrition.scientificBasis}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
