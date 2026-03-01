'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  BookOpen,
  Settings,
  Dumbbell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Planificación',
    href: '/planning',
    icon: Calendar,
  },
  {
    label: 'Strava',
    href: '/strava',
    icon: Activity,
  },
  {
    label: 'Conocimiento',
    href: '/knowledge',
    icon: BookOpen,
  },
  {
    label: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border/50 md:bg-gradient-to-b md:from-card md:to-card/50">
        {/* Header with logo */}
        <div className="flex h-20 items-center gap-3 border-b border-border/50 px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DeporteIA
            </span>
            <p className="text-[10px] text-muted-foreground">Elite Training</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 bg-gradient-to-t from-muted/30 p-4 space-y-3">
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Baseado en:</p>
            <ul className="space-y-1">
              <li>• Lactate Shuttle (Brooks)</li>
              <li>• Zona 2 Aeróbica (San Millán)</li>
              <li>• Periodización (Friel/Seiler)</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border/50 bg-card/95 backdrop-blur-sm md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 px-1 text-xs transition-colors duration-200',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
