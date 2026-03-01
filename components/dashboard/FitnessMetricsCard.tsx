'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface FitnessMetricsCardProps {
  ctl: number;
  atl: number;
  tsb: number;
}

export function FitnessMetricsCard({ ctl, atl, tsb }: FitnessMetricsCardProps) {
  // TSB States and colors
  const tsbState =
    tsb > 10
      ? { label: 'Muy Fresca', color: 'bg-green-50 border-green-200', textColor: 'text-green-600', icon: TrendingUp }
      : tsb >= 0
        ? { label: 'Moderadamente Fresca', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-600', icon: Activity }
        : tsb >= -10
          ? { label: 'Fatigada', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-600', icon: TrendingDown }
          : { label: 'Muy Fatigada', color: 'bg-red-50 border-red-200', textColor: 'text-red-600', icon: TrendingDown };

  const Icon = tsbState.icon;

  // CTL & ATL descriptions
  const ctlDescription = ctl < 30 ? 'Base débil' : ctl < 50 ? 'Base moderada' : ctl < 70 ? 'Base sólida' : 'Base excelente';
  const atlDescription = atl < 30 ? 'Fresca' : atl < 50 ? 'Normal' : 'Acumulada';

  return (
    <div className="space-y-4">
      {/* Main TSB Card - Prominent */}
      <Card className={cn('border-2 shadow-lg', tsbState.color)}>
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-5 w-5', tsbState.textColor)} />
                <span className={cn('text-sm font-semibold', tsbState.textColor)}>
                  {tsbState.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Training Stress Balance</p>
                <p className={cn('text-5xl font-bold', tsbState.textColor)}>
                  {tsb > 0 ? '+' : ''}
                  {tsb.toFixed(1)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                CTL {ctl.toFixed(0)} − ATL {atl.toFixed(0)}
              </p>
            </div>

            {/* Visual gauge */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-muted bg-muted/30 flex items-center justify-center">
                <div className={cn('text-center', tsbState.textColor)}>
                  <p className="text-2xl font-bold">{Math.abs(tsb).toFixed(0)}</p>
                  <p className="text-[10px]">{tsb < 0 ? 'fatiga' : 'forma'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTL & ATL Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* CTL Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CTL (Carga de Entrenamiento Crónica)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio móvil de 42 días
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Fitness
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-primary">{ctl.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">TSS promedio</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-semibold text-foreground">{ctlDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATL Card */}
        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent hover:border-secondary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ATL (Carga de Entrenamiento Aguda)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio móvil de 7 días
                </p>
              </div>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                Fatiga
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-secondary">{atl.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">TSS promedio</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-semibold text-foreground">{atlDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50/50 border-blue-200/50">
        <CardContent className="pt-4">
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>💡 Interpretación:</strong> TSB mide tu disponibilidad para el entrenamiento.
            Valores positivos indican capacidad de intensidad. Negativos señalan fatiga acumulada que requiere
            recuperación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
