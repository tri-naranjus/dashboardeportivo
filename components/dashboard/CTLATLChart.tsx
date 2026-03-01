'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Maximize2, Minimize2 } from 'lucide-react';

interface CTLATLChartProps {
  history: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
  }>;
}

const RANGE_OPTIONS = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface ChartControlsProps {
  daysBack: number;
  setDaysBack: (v: number) => void;
  showCTL: boolean;
  setShowCTL: (v: boolean) => void;
  showATL: boolean;
  setShowATL: (v: boolean) => void;
  showTSB: boolean;
  setShowTSB: (v: boolean) => void;
}

function ChartControls({
  daysBack, setDaysBack,
  showCTL, setShowCTL,
  showATL, setShowATL,
  showTSB, setShowTSB,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date range */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDaysBack(opt.value)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              daysBack === opt.value
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Line toggles */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCTL(!showCTL)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
            showCTL ? 'opacity-100' : 'opacity-40'
          }`}
          style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
        >
          <span className="inline-block h-2 w-4 rounded" style={{ background: '#3b82f6' }} />
          CTL
        </button>
        <button
          type="button"
          onClick={() => setShowATL(!showATL)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
            showATL ? 'opacity-100' : 'opacity-40'
          }`}
          style={{ borderColor: '#ef4444', color: '#ef4444' }}
        >
          <span className="inline-block h-2 w-4 rounded" style={{ background: '#ef4444' }} />
          ATL
        </button>
        <button
          type="button"
          onClick={() => setShowTSB(!showTSB)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
            showTSB ? 'opacity-100' : 'opacity-40'
          }`}
          style={{ borderColor: '#22c55e', color: '#22c55e' }}
        >
          <span
            className="inline-block h-2 w-4 rounded"
            style={{
              background: 'repeating-linear-gradient(90deg,#22c55e 0,#22c55e 4px,transparent 4px,transparent 8px)',
            }}
          />
          TSB
        </button>
      </div>
    </div>
  );
}

interface ChartBodyProps {
  data: Array<{ day: string; ctl: number; atl: number; tsb: number }>;
  showCTL: boolean;
  showATL: boolean;
  showTSB: boolean;
  daysBack: number;
  height: number;
}

function ChartBody({ data, showCTL, showATL, showTSB, daysBack, height }: ChartBodyProps) {
  const interval = Math.max(1, Math.floor(daysBack / 7) - 1);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="day" className="text-xs" interval={interval} tick={{ fontSize: 11 }} />
          <YAxis className="text-xs" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          {showCTL && (
            <Line
              type="monotone"
              dataKey="ctl"
              stroke="#3b82f6"
              name="CTL (Fitness)"
              strokeWidth={2}
              dot={false}
            />
          )}
          {showATL && (
            <Line
              type="monotone"
              dataKey="atl"
              stroke="#ef4444"
              name="ATL (Fatiga)"
              strokeWidth={2}
              dot={false}
            />
          )}
          {showTSB && (
            <Line
              type="monotone"
              dataKey="tsb"
              stroke="#22c55e"
              name="TSB (Forma)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CTLATLChart({ history }: CTLATLChartProps) {
  const [expanded, setExpanded] = useState(false);
  const [daysBack, setDaysBack] = useState(90);
  const [showCTL, setShowCTL] = useState(true);
  const [showATL, setShowATL] = useState(true);
  const [showTSB, setShowTSB] = useState(true);

  const sliced = history.slice(-daysBack);
  const data = sliced.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  const controls = (
    <ChartControls
      daysBack={daysBack} setDaysBack={setDaysBack}
      showCTL={showCTL} setShowCTL={setShowCTL}
      showATL={showATL} setShowATL={setShowATL}
      showTSB={showTSB} setShowTSB={setShowTSB}
    />
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">CTL / ATL / TSB</CardTitle>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Ampliar gráfico"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">{controls}</div>
        </CardHeader>
        <CardContent>
          <ChartBody
            data={data}
            showCTL={showCTL} showATL={showATL} showTSB={showTSB}
            daysBack={daysBack}
            height={300}
          />
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-8">
              <DialogTitle>CTL / ATL / TSB — Historial de Forma</DialogTitle>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Cerrar"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          <div className="mt-1">{controls}</div>
          <ChartBody
            data={data}
            showCTL={showCTL} showATL={showATL} showTSB={showTSB}
            daysBack={daysBack}
            height={480}
          />
          {/* Info panel */}
          <div className="mt-2 grid grid-cols-3 gap-3 rounded-lg border p-3 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-blue-600">CTL (Fitness)</span>
              <p className="mt-0.5">Media exponencial 42 días del TSS diario. Refleja la condición aeróbica acumulada.</p>
            </div>
            <div>
              <span className="font-semibold text-red-500">ATL (Fatiga)</span>
              <p className="mt-0.5">Media exponencial 7 días. Representa la fatiga aguda reciente.</p>
            </div>
            <div>
              <span className="font-semibold text-green-600">TSB (Forma)</span>
              <p className="mt-0.5">CTL − ATL. Positivo = descansado, negativo = acumulando carga.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
