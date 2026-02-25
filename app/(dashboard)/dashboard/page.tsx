'use client';

import { useEffect, useState } from 'react';
import { computeFitnessMetrics } from '@/lib/fitness/ctl-atl';
import { getActivities } from '@/lib/storage/activities';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // This will test if the basic system works
        setMessage('✅ DeporteIA initialized successfully!');
      } catch (error) {
        setMessage(`❌ Error: ${error}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-lg">{message}</p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>🚀 Próximas funciones:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Conectar a Strava (OAuth)</li>
              <li>Mostrar métricas CTL/ATL/TSB</li>
              <li>Generar plan semanal</li>
              <li>Subir y analizar PDFs</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
