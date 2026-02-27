'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CTLATLChartProps {
  history: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
  }>;
}

export function CTLATLChart({ history }: CTLATLChartProps) {
  const data = history.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>CTL / ATL / TSB (90 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" interval={13} />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Line
                type="monotone"
                dataKey="ctl"
                stroke="#3b82f6"
                name="CTL (Fitness)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="atl"
                stroke="#ef4444"
                name="ATL (Fatiga)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tsb"
                stroke="#22c55e"
                name="TSB (Forma)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
