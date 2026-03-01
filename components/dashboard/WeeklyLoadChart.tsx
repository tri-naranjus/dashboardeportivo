'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WeeklyLoadChartProps {
  history: Array<{
    date: string;
    tss: number;
    ctl?: number;
  }>;
}

const RANGE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '28d', value: 28 },
  { label: '56d', value: 56 },
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

/** Color bar by TSS intensity */
function tssColor(tss: number) {
  if (tss === 0) return 'hsl(var(--muted))';
  if (tss < 50) return '#22c55e';   // easy
  if (tss < 100) return '#3b82f6';  // moderate
  if (tss < 150) return '#f97316';  // hard
  return '#ef4444';                  // very hard
}

interface ChartBodyProps {
  data: Array<{ label: string; tss: number; ctl?: number }>;
  showTarget: boolean;
  targetTSS: number;
  height: number;
}

function ChartBody({ data, showTarget, targetTSS, height }: ChartBodyProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis className="text-xs" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | undefined) => [value != null ? `${Math.round(value)} TSS` : '–', 'Carga']}
          />
          {showTarget && (
            <ReferenceLine
              y={targetTSS}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `Objetivo ${targetTSS}`, position: 'right', fontSize: 10, fill: '#f59e0b' }}
            />
          )}
          <Bar dataKey="tss" radius={[4, 4, 0, 0]} name="TSS">
            {data.map((entry, index) => (
              <Cell key={index} fill={tssColor(entry.tss)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartControlsProps {
  daysBack: number;
  setDaysBack: (v: number) => void;
  showTarget: boolean;
  setShowTarget: (v: boolean) => void;
  targetTSS: number;
  setTargetTSS: (v: number) => void;
}

function ChartControls({
  daysBack, setDaysBack,
  showTarget, setShowTarget,
  targetTSS, setTargetTSS,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Range */}
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

      {/* Target line toggle */}
      <button
        type="button"
        onClick={() => setShowTarget(!showTarget)}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
          showTarget ? 'opacity-100 border-amber-400 text-amber-600' : 'opacity-40 border-border text-muted-foreground'
        }`}
      >
        <span className="inline-block h-0.5 w-4 bg-amber-400" style={{ borderTop: '2px dashed #f59e0b' }} />
        Objetivo diario
      </button>

      {/* Target TSS input — only visible when target is shown */}
      {showTarget && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">TSS:</span>
          <input
            type="number"
            value={targetTSS}
            min={10}
            max={300}
            step={5}
            onChange={(e) => setTargetTSS(Number(e.target.value))}
            className="w-16 rounded border px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Color legend */}
      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-500 inline-block" />Suave</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />Moderado</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-500 inline-block" />Duro</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />Muy duro</span>
      </div>
    </div>
  );
}

export function WeeklyLoadChart({ history }: WeeklyLoadChartProps) {
  const [expanded, setExpanded] = useState(false);
  const [daysBack, setDaysBack] = useState(7);
  const [showTarget, setShowTarget] = useState(false);
  const [targetTSS, setTargetTSS] = useState(80);

  const sliced = history.slice(-daysBack);

  const data = sliced.map((d) => ({
    ...d,
    label:
      daysBack <= 14
        ? new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
        : new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
  }));

  // Summary stats
  const totalTSS = data.reduce((s, d) => s + d.tss, 0);
  const avgTSS = data.length ? Math.round(totalTSS / data.length) : 0;
  const maxTSS = data.length ? Math.max(...data.map((d) => d.tss)) : 0;

  const controls = (
    <ChartControls
      daysBack={daysBack} setDaysBack={setDaysBack}
      showTarget={showTarget} setShowTarget={setShowTarget}
      targetTSS={targetTSS} setTargetTSS={setTargetTSS}
    />
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Carga Diaria (TSS)</CardTitle>
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
          <ChartBody data={data} showTarget={showTarget} targetTSS={targetTSS} height={250} />
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-8">
              <DialogTitle>Carga Diaria (TSS) — Detalle</DialogTitle>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="mt-1">{controls}</div>

          <ChartBody data={data} showTarget={showTarget} targetTSS={targetTSS} height={420} />

          {/* Summary stats */}
          <div className="mt-2 grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground">TSS Total</p>
              <p className="text-lg font-bold">{Math.round(totalTSS)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Media diaria</p>
              <p className="text-lg font-bold">{avgTSS}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sesión más dura</p>
              <p className="text-lg font-bold">{Math.round(maxTSS)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
