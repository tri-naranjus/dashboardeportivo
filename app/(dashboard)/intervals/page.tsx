'use client';

import { useEffect, useState } from 'react';
import { ActivityData } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, RefreshCw, GitCompare, CheckCircle, AlertCircle, Loader, PlugZap, Unplug } from 'lucide-react';
import Link from 'next/link';

export default function IntervalsPage() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Connect form state
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');

  useEffect(() => {
    checkConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setError('Error al sincronizar. Prueba a desconectar y reconectar.');
      }
    } catch {
      setError('No se pudo conectar con Intervals.icu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!apiKey || !athleteId) {
      setConnectError('API Key y Athlete ID son obligatorios');
      return;
    }
    setConnecting(true);
    setConnectError('');
    setConnectSuccess('');
    try {
      const res = await fetch('/api/intervals/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, athleteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Error al conectar');
      setConnectSuccess('¡Conectado correctamente!');
      setApiKey('');
      setAthleteId('');
      setShowForm(false);
      setIsConnected(true);
      syncActivities();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Intervals.icu?')) return;
    try {
      await fetch('/api/intervals/connect', { method: 'DELETE' });
      setIsConnected(false);
      setActivities([]);
      setLastSync(null);
      setShowForm(false);
      setConnectSuccess('');
    } catch {
      setError('Error al desconectar');
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

      {/* Estado y conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Conexión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className={isConnected ? 'bg-green-600' : ''}
            >
              {isConnected ? '● Conectado' : '○ Desconectado'}
            </Badge>
            {activities.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {activities.length} actividades
                {lastSync && ` · última sync: ${lastSync}`}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {isConnected ? (
              <>
                <Button onClick={syncActivities} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(!showForm); setConnectError(''); }}
                >
                  <PlugZap className="mr-2 h-4 w-4" />
                  Cambiar credenciales
                </Button>
                <Button variant="outline" onClick={handleDisconnect} className="text-red-600 hover:text-red-700 hover:border-red-300">
                  <Unplug className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
                {activities.length > 0 && (
                  <Button asChild variant="outline">
                    <Link href="/compare">
                      <GitCompare className="mr-2 h-4 w-4" />
                      Comparar con Strava
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => { setShowForm(!showForm); setConnectError(''); }}>
                <PlugZap className="mr-2 h-4 w-4" />
                Conectar Intervals.icu
              </Button>
            )}
          </div>

          {/* Connect form */}
          {showForm && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium">
                {isConnected ? 'Actualizar credenciales' : 'Conectar Intervals.icu'}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Tu API Key de Intervals.icu"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén tu clave en{' '}
                    <a
                      href="https://app.intervals.icu/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      intervals.icu/settings/api
                    </a>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="athleteId">Athlete ID</Label>
                  <Input
                    id="athleteId"
                    placeholder="Ej: i12345 o tu-nombre"
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Encuéntralo en la URL de tu perfil en intervals.icu
                  </p>
                </div>
              </div>

              {connectError && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {connectError}
                </div>
              )}
              {connectSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  {connectSuccess}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleConnect} disabled={connecting || !apiKey || !athleteId}>
                  {connecting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  {connecting ? 'Conectando...' : 'Conectar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setConnectError(''); setApiKey(''); setAthleteId(''); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
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

      {/* Empty state */}
      {!isConnected && !showForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground space-y-3">
            <Zap className="mx-auto h-10 w-10 opacity-20" />
            <p className="font-medium">Intervals.icu no está conectado</p>
            <p className="text-sm">
              Pulsa <strong>Conectar Intervals.icu</strong> arriba para introducir tu API Key y Athlete ID.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
