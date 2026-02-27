'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FitnessMetricsCardProps {
  ctl: number;
  atl: number;
  tsb: number;
}

export function FitnessMetricsCard({ ctl, atl, tsb }: FitnessMetricsCardProps) {
  const tsbColor =
    tsb > 10
      ? 'text-green-500'
      : tsb >= 0
        ? 'text-blue-500'
        : tsb >= -10
          ? 'text-orange-500'
          : 'text-red-500';

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            CTL (Fitness)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{ctl.toFixed(1)}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Media 42 d&iacute;as de TSS
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ATL (Fatiga)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{atl.toFixed(1)}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Media 7 d&iacute;as de TSS
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            TSB (Forma)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('text-3xl font-bold', tsbColor)}>
            {tsb > 0 ? '+' : ''}
            {tsb.toFixed(1)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">CTL - ATL</p>
        </CardContent>
      </Card>
    </div>
  );
}
