'use client';

import { useEffect, useState } from 'react';
import { ActivityData } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GitCompare, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MatchedActivity {
  strava: ActivityData;
  intervals: ActivityData;
  tssDiff: number;
  ifDiff: number;
}

interface CompareResult {
  matched: MatchedActivity[];
  stravaOnly: ActivityData[];
  intervalsOnly: ActivityData[];
}

function normalizeType(type: string) {
  const t = type.toLowerCase();
  if (t.includes('ride') || t.includes('cycl') || t.includes('gravel') || t.includes('bike')) return 'cycling';
  if (t.includes('run') || t.includes('trail') || t.includes('hike') || t.includes('walk')) return 'running';
  if (t.includes('swim')) return 'swim';
  return t;
}

function matchActivities(stravaActs: ActivityData[], intervalsActs: ActivityData[]): CompareResult {
  const matched: MatchedActivity[] = [];
  const stravaOnly: ActivityData[] = [];
  const remaining = [...intervalsActs];

  for (const s of stravaActs) {
    const idx = remaining.findIndex((int) => {
      const sameDate = int.date === s.date;
      const sameType = normalizeType(int.type) === normalizeType(s.type);
      const durDiff = s.durationSeconds > 0
        ? Math.abs(int.durationSeconds - s.durationSeconds) / s.durationSeconds
        : 1;
      return sameDate && sameType && durDiff < 0.3;
    });

    if (idx >= 0) {
      const int = remaining.splice(idx, 1)[0];
      matched.push({
        strava: s,
        intervals: int,
        tssDiff: int.tss - s.tss,
        ifDiff: int.intensityFactor - s.intensityFactor,
      });
    } else {
      stravaOnly.push(s);
    }
  }

  return { matched, stravaOnly, intervalsOnly: remaining };
}

function DiffBadge({ diff, decimals = 0 }: { diff: number; decimals?: number }) {
  const val = Math.abs(diff).toFixed(decimals);
  if (Math.abs(diff) < (decimals === 0 ? 1 : 0.01)) {
    return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-3 w-3" />0</span>;
  }
  if (diff > 0) {
    return <span className="flex items-center gap-1 text-green-600 font-medium"><TrendingUp className="h-3 w-3" />+{val}</span>;
  }
  return <span className="flex items-center gap-1 text-red-500 font-medium"><TrendingDown className="h-3 w-3" />-{val}</span>;
}

export default function ComparePage() {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComparison();
  }, []);

  async function loadComparison() {
    setLoading(true);
    setError('');
    try {
      const [stravaRes, intervalsStatusRes] = await Promise.all([
        fetch('/api/strava/activities'),
        fetch('/api/intervals/status'),
      ]);

      if (!stravaRes.ok) {
        setError('No se pudo obtener actividades de Strava. Verifica la conexión.');
        return;
      }

      const stravaData = await stravaRes.json();
      const stravaActs: ActivityData[] = stravaData.activities || [];

      const statusData = await intervalsStatusRes.json();
      if (!statusData.connected) {
        setError('Intervals.icu no está conectado. Configúralo en Ajustes.');
        return;
      }

      const intervalsRes = await fetch('/api/intervals/activities');
      if (!intervalsRes.ok) {
        setError('No se pudo obtener actividades de Intervals.icu.');
        return;
      }

      const intervalsData = await intervalsRes.json();
      const intervalsActs: ActivityData[] = intervalsData.activities || [];

      setResult(matchActivities(stravaActs, intervalsActs));
    } catch {
      setError('Error al cargar los datos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const avgTssDiff = result && result.matched.length > 0
    ? result.matched.reduce((s, m) => s + m.tssDiff, 0) / result.matched.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comparar Fuentes</h1>
          <p className="text-muted-foreground">
            Strava (TSS estimado) vs Intervals.icu (TSS preciso del archivo FIT)
          </p>
        </div>
        <Button onClick={loadComparison} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      {result && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Coincidencias</p>
              <p className="text-3xl font-bold">{result.matched.length}</p>
              <p className="text-xs text-muted-foreground">en ambas fuentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Solo Strava</p>
              <p className="text-3xl font-bold text-orange-500">{result.stravaOnly.length}</p>
              <p className="text-xs text-muted-foreground">sin match en Intervals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Solo Intervals</p>
              <p className="text-3xl font-bold text-blue-500">{result.intervalsOnly.length}</p>
              <p className="text-xs text-muted-foreground">sin match en Strava</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Diferencia TSS media</p>
              <p className={`text-3xl font-bold ${avgTssDiff > 0 ? 'text-green-600' : avgTssDiff < 0 ? 'text-red-500' : ''}`}>
                {avgTssDiff > 0 ? '+' : ''}{avgTssDiff.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Intervals − Strava</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla comparativa principal */}
      {result && result.matched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Actividades en Ambas Fuentes ({result.matched.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="text-orange-500">TSS Strava</TableHead>
                    <TableHead className="text-blue-500">TSS Intervals</TableHead>
                    <TableHead>Δ TSS</TableHead>
                    <TableHead className="text-orange-500">IF Strava</TableHead>
                    <TableHead className="text-blue-500">IF Intervals</TableHead>
                    <TableHead>Δ IF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.matched.map((m, i) => (
                    <TableRow key={i} className={Math.abs(m.tssDiff) > 20 ? 'bg-yellow-50' : ''}>
                      <TableCell>{new Date(m.strava.date).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell><Badge variant="outline">{m.strava.type}</Badge></TableCell>
                      <TableCell>{formatDuration(m.strava.durationSeconds)}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{m.strava.tss.toFixed(0)}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{m.intervals.tss.toFixed(0)}</TableCell>
                      <TableCell><DiffBadge diff={m.tssDiff} /></TableCell>
                      <TableCell className="text-orange-600">{m.strava.intensityFactor.toFixed(2)}</TableCell>
                      <TableCell className="text-blue-600">{m.intervals.intensityFactor.toFixed(2)}</TableCell>
                      <TableCell><DiffBadge diff={m.ifDiff} decimals={2} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground hidden md:block">
              Las filas en amarillo tienen diferencia de TSS &gt; 20 puntos.
            </p>

            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {result.matched.map((m, i) => (
                <div key={i} className={`rounded-lg border p-3 space-y-2 ${Math.abs(m.tssDiff) > 20 ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{new Date(m.strava.date).toLocaleDateString('es-ES')}</span>
                    <Badge variant="outline" className="text-xs">{m.strava.type}</Badge>
                  </div>
                  <div className="grid grid-cols-3 text-xs text-center">
                    <div>
                      <p className="text-muted-foreground">Strava TSS</p>
                      <p className="font-medium text-orange-600">{m.strava.tss.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Δ</p>
                      <DiffBadge diff={m.tssDiff} />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Intervals TSS</p>
                      <p className="font-medium text-blue-600">{m.intervals.tss.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solo en Strava */}
      {result && result.stravaOnly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Solo en Strava ({result.stravaOnly.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.stravaOnly.map((a, i) => (
                <Badge key={i} variant="outline" className="text-orange-600 border-orange-200">
                  {new Date(a.date).toLocaleDateString('es-ES')} · {a.type} · TSS {a.tss.toFixed(0)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solo en Intervals */}
      {result && result.intervalsOnly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Solo en Intervals.icu ({result.intervalsOnly.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.intervalsOnly.map((a, i) => (
                <Badge key={i} variant="outline" className="text-blue-600 border-blue-200">
                  {new Date(a.date).toLocaleDateString('es-ES')} · {a.type} · TSS {a.tss.toFixed(0)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !result && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin opacity-30 mb-3" />
            <p>Cargando actividades de ambas fuentes...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
