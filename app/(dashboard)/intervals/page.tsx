'use client';

import { useEffect, useState } from 'react';
import { ActivityData } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, RefreshCw, GitCompare } from 'lucide-react';
import Link from 'next/link';

export default function IntervalsPage() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch('/api/intervals/status');
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
        if (data.connected) syncActivities();
      }
    } catch {
      setIsConnected(false);
    }
  }

  async function syncActivities() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/intervals/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setLastSync(new Date().toLocaleTimeString('es-ES'));
      } else {
        setError('Error al sincronizar. Verifica tu conexión en Configuración.');
      }
    } catch {
      setError('No se pudo conectar con Intervals.icu.');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function formatDistance(meters: number) {
    if (!meters) return '—';
    return (meters / 1000).toFixed(1) + ' km';
  }

  const totalTSS = activities.reduce((s, a) => s + a.tss, 0);
  const avgTSS = activities.length ? Math.round(totalTSS / activities.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intervals.icu</h1>
        <p className="text-muted-foreground">
          Actividades con TSS e IF precisos calculados por Intervals.icu
        </p>
      </div>

      {/* Estado y botones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estado de Sincronización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-600' : ''}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            {activities.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {activities.length} actividades · {lastSync && `última sync: ${lastSync}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {isConnected ? (
              <Button onClick={syncActivities} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar Actividades'}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/settings">Configurar Intervals.icu</Link>
              </Button>
            )}
            {activities.length > 0 && (
              <Button asChild variant="outline">
                <Link href="/compare">
                  <GitCompare className="mr-2 h-4 w-4" />
                  Comparar con Strava
                </Link>
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats resumen */}
      {activities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Actividades</p>
              <p className="text-3xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">últimos 180 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">TSS Total</p>
              <p className="text-3xl font-bold">{Math.round(totalTSS)}</p>
              <p className="text-xs text-muted-foreground">carga acumulada</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">TSS Medio</p>
              <p className="text-3xl font-bold">{avgTSS}</p>
              <p className="text-xs text-muted-foreground">por sesión</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de actividades */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividades (Intervals.icu)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Distancia</TableHead>
                    <TableHead>FC Media</TableHead>
                    <TableHead>Potencia NP</TableHead>
                    <TableHead>TSS</TableHead>
                    <TableHead>IF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.date).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                      <TableCell>{formatDuration(a.durationSeconds)}</TableCell>
                      <TableCell>{formatDistance(a.distanceMeters)}</TableCell>
                      <TableCell>{a.averageHeartRate ? `${Math.round(a.averageHeartRate)} bpm` : '—'}</TableCell>
                      <TableCell>{a.normalizedPower ? `${a.normalizedPower}W` : '—'}</TableCell>
                      <TableCell className="font-medium">{a.tss.toFixed(0)}</TableCell>
                      <TableCell>{a.intensityFactor.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {activities.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{new Date(a.date).toLocaleDateString('es-ES')}</span>
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatDuration(a.durationSeconds)}</span>
                    <span>{formatDistance(a.distanceMeters)}</span>
                    <span className="font-medium text-foreground">TSS: {a.tss.toFixed(0)}</span>
                    <span>IF: {a.intensityFactor.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isConnected && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <Zap className="mx-auto h-8 w-8 opacity-30" />
            <p>Intervals.icu no está conectado.</p>
            <p className="text-sm">Configura tu API Key en <Link href="/settings" className="text-primary underline">Configuración</Link>.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
