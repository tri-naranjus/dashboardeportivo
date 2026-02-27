'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyLoadChartProps {
  history: Array<{
    date: string;
    tss: number;
  }>;
}

export function WeeklyLoadChart({ history }: WeeklyLoadChartProps) {
  // Last 7 days
  const last7 = history.slice(-7).map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Semanal (TSS)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="tss"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
