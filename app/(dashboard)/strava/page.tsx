'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';

export default function StravaPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <StravaPageContent />
    </Suspense>
  );
}

function StravaPageContent() {
  const searchParams = useSearchParams();
  const connected = searchParams.get('connected') === 'true';
  const error = searchParams.get('error');

  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await fetch('/api/strava/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setIsConnected(true);
      } else if (res.status === 401) {
        setIsConnected(false);
      }
    } catch {
      // Not connected
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connected) {
      fetchActivities();
    }
  }, [connected]);

  function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function formatDistance(meters: number) {
    return (meters / 1000).toFixed(1) + ' km';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conexion Strava</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de Strava para importar actividades y calcular
          metricas de forma automatica
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">
              Error conectando con Strava: {error}. Verifica tus credenciales en
              Configuracion.
            </p>
          </CardContent>
        </Card>
      )}

      {connected && !error && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <p className="text-green-600">
              Conectado a Strava correctamente. Importando actividades...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connect button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado de Conexion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            {activities.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {activities.length} actividades importadas
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {!isConnected && (
              <Button asChild>
                <a href="/api/strava/connect">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Conectar con Strava
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={fetchActivities}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              {loading ? 'Importando...' : 'Actualizar Actividades'}
            </Button>
          </div>

          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium">Requisitos:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>
                Ve a{' '}
                <span className="font-mono text-xs">
                  strava.com/settings/api
                </span>{' '}
                y crea una aplicacion
              </li>
              <li>
                Copia el Client ID y Client Secret en la pagina de
                Configuracion
              </li>
              <li>
                Usa{' '}
                <span className="font-mono text-xs">
                  http://localhost:3001/api/strava/callback
                </span>{' '}
                como Authorization Callback Domain
              </li>
              <li>Haz clic en &quot;Conectar con Strava&quot;</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Activity list */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividades Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duracion</TableHead>
                    <TableHead>Distancia</TableHead>
                    <TableHead>FC Media</TableHead>
                    <TableHead>TSS</TableHead>
                    <TableHead>IF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {new Date(a.date).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.type}</Badge>
                      </TableCell>
                      <TableCell>{formatDuration(a.durationSeconds)}</TableCell>
                      <TableCell>{formatDistance(a.distanceMeters)}</TableCell>
                      <TableCell>
                        {a.averageHeartRate
                          ? `${a.averageHeartRate} bpm`
                          : '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.tss.toFixed(0)}
                      </TableCell>
                      <TableCell>{a.intensityFactor.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-3 md:hidden">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {new Date(a.date).toLocaleDateString('es-ES')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {a.type}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{formatDuration(a.durationSeconds)}</span>
                    <span>{formatDistance(a.distanceMeters)}</span>
                    <span>TSS: {a.tss.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
