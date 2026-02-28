'use client';

import { ActivityData } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RecentWorkoutsProps {
  activities: ActivityData[];
}

const typeEmojis: Record<string, string> = {
  Run: '🏃',
  Ride: '🚴',
  Swim: '🏊',
  WeightTraining: '🏋️',
  Hike: '🥾',
  Walk: '🚶',
  VirtualRide: '🚴‍♂️',
  VirtualRun: '🏃‍♂️',
};

const typeColors: Record<string, string> = {
  Run: 'bg-green-100 text-green-700',
  Ride: 'bg-blue-100 text-blue-700',
  Swim: 'bg-cyan-100 text-cyan-700',
  WeightTraining: 'bg-purple-100 text-purple-700',
};

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDistance(meters: number) {
  if (meters === 0) return '—';
  return (meters / 1000).toFixed(1) + ' km';
}

function formatPace(seconds: number, meters: number, type: string) {
  if (meters === 0 || seconds === 0) return '—';
  if (type === 'Run' || type === 'VirtualRun') {
    // min/km
    const paceSecsPerKm = seconds / (meters / 1000);
    const mins = Math.floor(paceSecsPerKm / 60);
    const secs = Math.floor(paceSecsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  } else if (type === 'Ride' || type === 'VirtualRide') {
    // km/h
    const kmh = (meters / 1000) / (seconds / 3600);
    return `${kmh.toFixed(1)} km/h`;
  }
  return '—';
}

export function RecentWorkouts({ activities }: RecentWorkoutsProps) {
  // Sort by date descending, take last 10
  const recent = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ultimos Entrenos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No hay actividades. Conecta Strava para importar tus entrenos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultimos 10 Entrenos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Duracion</TableHead>
                <TableHead className="text-right">Distancia</TableHead>
                <TableHead className="text-right">Ritmo/Vel.</TableHead>
                <TableHead className="text-right">FC Media</TableHead>
                <TableHead className="text-right">TSS</TableHead>
                <TableHead className="text-right">IF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={typeColors[a.type] || 'bg-gray-100 text-gray-700'}
                    >
                      {typeEmojis[a.type] || '🏅'} {a.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDuration(a.durationSeconds)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDistance(a.distanceMeters)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatPace(a.durationSeconds, a.distanceMeters, a.type)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {a.averageHeartRate ? `${Math.round(a.averageHeartRate)} bpm` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {a.tss.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {a.intensityFactor.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="space-y-2 md:hidden">
          {recent.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="text-2xl">
                {typeEmojis[a.type] || '🏅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(a.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  <span className="font-semibold text-sm">
                    TSS {a.tss.toFixed(0)}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{formatDuration(a.durationSeconds)}</span>
                  <span>{formatDistance(a.distanceMeters)}</span>
                  <span>{formatPace(a.durationSeconds, a.distanceMeters, a.type)}</span>
                  {a.averageHeartRate && (
                    <span>{Math.round(a.averageHeartRate)} bpm</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
