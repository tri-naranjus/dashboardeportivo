'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface IntervalsIcuConnectProps {
  isConnected: boolean;
  onConnect?: () => void;
}

export function IntervalsIcuConnect({ isConnected, onConnect }: IntervalsIcuConnectProps) {
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleConnect() {
    if (!apiKey || !athleteId) {
      setError('API Key y Athlete ID son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/intervals/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, athleteId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect');
      }

      setSuccess('✓ Intervals.icu conectado correctamente');
      setApiKey('');
      setAthleteId('');
      setShowForm(false);
      onConnect?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Intervals.icu?')) return;

    try {
      const response = await fetch('/api/intervals/connect', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Desconectado de Intervals.icu');
        onConnect?.();
      }
    } catch {
      setError('Failed to disconnect');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Intervals.icu</CardTitle>
          {isConnected && <Badge className="bg-green-600">Conectado</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sincroniza entrenamientos con <strong>TSS y IF más precisos</strong> que Strava.
          Necesitas una API Key de Intervals.icu.
        </p>

        {isConnected ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-700">
                ✓ Estás usando Intervals.icu como fuente de entrenamientos
              </p>
            </div>
            <Button variant="outline" onClick={handleDisconnect}>
              Desconectar Intervals.icu
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full">
                Conectar Intervals.icu
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Tu API Key de Intervals.icu"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén tu API Key en:{' '}
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

                <div className="space-y-2">
                  <Label htmlFor="athleteId">Athlete ID</Label>
                  <Input
                    id="athleteId"
                    placeholder="Tu Athlete ID (ej: john_doe)"
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lo encuentras en tu perfil de Intervals.icu
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-2">
                    <p className="text-xs text-green-700">{success}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Conectando...' : 'Conectar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
          <p className="text-xs font-medium text-blue-900">💡 Beneficios:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• TSS más preciso (calculado por Intervals.icu)</li>
            <li>• IF exacto del archivo FIT de tu dispositivo</li>
            <li>• Datos de potencia y HR más confiables</li>
            <li>• Sincronización automática cada vez que generes plan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
