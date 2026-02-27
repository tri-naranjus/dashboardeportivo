'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrainingStatusBadgeProps {
  tsb: number;
}

function getStatus(tsb: number) {
  if (tsb > 10) {
    return {
      label: 'Lista para Alta Intensidad',
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
      emoji: '🟢',
    };
  } else if (tsb >= 0) {
    return {
      label: 'Moderadamente Fresca',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      emoji: '🔵',
    };
  } else if (tsb >= -10) {
    return {
      label: 'Prioridad Zona 2',
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      emoji: '🟡',
    };
  } else {
    return {
      label: 'Recuperacion Total',
      color: 'bg-red-500/10 text-red-600 border-red-500/20',
      emoji: '🔴',
    };
  }
}

export function TrainingStatusBadge({ tsb }: TrainingStatusBadgeProps) {
  const status = getStatus(tsb);

  return (
    <Badge
      variant="outline"
      className={cn('px-4 py-2 text-base font-semibold', status.color)}
    >
      {status.emoji} {status.label}
    </Badge>
  );
}
