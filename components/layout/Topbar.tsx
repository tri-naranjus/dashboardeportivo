'use client';

import { Badge } from '@/components/ui/badge';

interface TopbarProps {
  title: string;
  stravaConnected?: boolean;
}

export function Topbar({ title, stravaConnected = false }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant={stravaConnected ? 'default' : 'secondary'}>
          {stravaConnected ? 'Strava Conectado' : 'Strava Desconectado'}
        </Badge>
      </div>
    </header>
  );
}
