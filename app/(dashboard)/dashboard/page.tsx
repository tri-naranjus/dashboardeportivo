'use client';

import { useEffect, useState } from 'react';
import { FitnessMetrics, ActivityData, UserProfile } from '@/types/fitness';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { FitnessMetricsCard } from '@/components/dashboard/FitnessMetricsCard';
import { TrainingStatusBadge } from '@/components/dashboard/TrainingStatusBadge';
import { TodayRecommendation } from '@/components/dashboard/TodayRecommendation';
import { WeeklyLoadChart } from '@/components/dashboard/WeeklyLoadChart';
import { CTLATLChart } from '@/components/dashboard/CTLATLChart';
import { RecentWorkouts } from '@/components/dashboard/RecentWorkouts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<FitnessMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        let fetchedActivities: ActivityData[] = [];

        // Priority 1: Try Intervals.icu (more accurate TSS/IF)
        try {
          const intervalsStatus = await fetch('/api/intervals/status');
          if (intervalsStatus.ok) {
            const status = await intervalsStatus.json();
            if (status.connected) {
              const intervalsRes = await fetch('/api/intervals/activities');
              if (intervalsRes.ok) {
                const data = await intervalsRes.json();
                fetchedActivities = data.activities || [];
              }
            }
          }
        } catch {
          // Intervals.icu not available, try Strava
        }

        // Priority 2: Fallback to Strava if Intervals.icu has no data
        if (fetchedActivities.length === 0) {
          try {
            const stravaRes = await fetch('/api/strava/activities');
            if (stravaRes.ok) {
              const data = await stravaRes.json();
              fetchedActivities = data.activities || [];
            }
          } catch {
            // Strava not available either
          }
        }

        setActivities(fetchedActivities);

        // Compute fitness metrics over 180 days for full history
        const computed = computeFitnessMetrics(fetchedActivities, 180);
        setMetrics(computed);

        // Load user profile for weight/tdee
        try {
          const profileRes = await fetch('/api/profile');
          if (profileRes.ok) setProfile(await profileRes.json());
        } catch {
          // Use defaults if profile fetch fails
        }
      } catch {
        // Default empty metrics
        setMetrics(computeFitnessMetrics([], 180));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const tsb = metrics?.tsb ?? 0;
  const ctl = metrics?.ctl ?? 0;
  const atl = metrics?.atl ?? 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Header with gradient background */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border border-primary/10 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Tu estado de forma actual y recomendaciones personalizadas
            </p>
          </div>
          <TrainingStatusBadge tsb={tsb} />
        </div>
      </div>

      {/* Key Metrics */}
      <FitnessMetricsCard ctl={ctl} atl={atl} tsb={tsb} />

      {/* Today's Recommendation - Full width prominent */}
      <TodayRecommendation tsb={tsb} weight={profile?.weight ?? 65} tdee={profile?.tdee ?? 2200} activities={activities} />

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Análisis Histórico</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyLoadChart history={metrics?.history ?? []} />
          <CTLATLChart history={metrics?.history ?? []} />
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Entrenamientos Recientes</h2>
        <RecentWorkouts activities={activities} />
      </div>

      {/* Quick Stats Footer */}
      {activities.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Entrenamientos</p>
                <p className="text-3xl font-bold">{activities.length}</p>
                <p className="text-xs text-muted-foreground">últimos 180 días</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">TSS Total</p>
                <p className="text-3xl font-bold">
                  {Math.round(
                    activities.reduce((sum, a) => sum + a.tss, 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">carga acumulada</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Promedio TSS</p>
                <p className="text-3xl font-bold">
                  {Math.round(
                    activities.reduce((sum, a) => sum + a.tss, 0) / activities.length || 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">por sesión</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Horas</p>
                <p className="text-3xl font-bold">
                  {Math.round(
                    activities.reduce((sum, a) => sum + a.durationSeconds, 0) / 3600
                  )}
                </p>
                <p className="text-xs text-muted-foreground">volumen total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
