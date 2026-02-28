'use client';

import { useEffect, useState } from 'react';
import { FitnessMetrics, ActivityData } from '@/types/fitness';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { FitnessMetricsCard } from '@/components/dashboard/FitnessMetricsCard';
import { TrainingStatusBadge } from '@/components/dashboard/TrainingStatusBadge';
import { TodayRecommendation } from '@/components/dashboard/TodayRecommendation';
import { WeeklyLoadChart } from '@/components/dashboard/WeeklyLoadChart';
import { CTLATLChart } from '@/components/dashboard/CTLATLChart';
import { RecentWorkouts } from '@/components/dashboard/RecentWorkouts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<FitnessMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Try to fetch activities from API
        const res = await fetch('/api/strava/activities');
        let fetchedActivities: ActivityData[] = [];

        if (res.ok) {
          const data = await res.json();
          fetchedActivities = data.activities || [];
        }

        setActivities(fetchedActivities);

        // Compute fitness metrics over 180 days for full history
        const computed = computeFitnessMetrics(fetchedActivities, 180);
        setMetrics(computed);
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const tsb = metrics?.tsb ?? 0;
  const ctl = metrics?.ctl ?? 0;
  const atl = metrics?.atl ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu estado de forma actual
          </p>
        </div>
        <TrainingStatusBadge tsb={tsb} />
      </div>

      {/* Fitness Metrics Cards */}
      <FitnessMetricsCard ctl={ctl} atl={atl} tsb={tsb} />

      {/* Today's Recommendation */}
      <TodayRecommendation tsb={tsb} weight={65} tdee={2200} />

      {/* Recent Workouts */}
      <RecentWorkouts activities={activities} />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyLoadChart history={metrics?.history ?? []} />
        <CTLATLChart history={metrics?.history ?? []} />
      </div>
    </div>
  );
}
