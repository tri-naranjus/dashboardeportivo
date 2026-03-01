'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface IntervalsIcuConnectProps {
  isConnected: boolean;
  onConnect?: () => void;
}

export function IntervalsIcuConnect({ isConnected, onConnect }: IntervalsIcuConnectProps) {
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  async function handleTest() {
    if (!apiKey) {
      setError('API Key es requerido para probar');
      return;
    }

    setTesting(true);
    setError('');
    setTestResults(null);

    try {
      const response = await fetch('/api/intervals/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, athleteId: athleteId || undefined }),
      });

      const data = await response.json();
      setTestResults(data);

      if (data.testResults?.some((r: any) => r.success === true)) {
        setError('');
      }
    } catch (err) {
      setError('Error testing connection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  }

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

      const data = await response.json();

      if (!response.ok) {
        const details = data.details || data.error;
        const hint = data.hint || 'Verifica tus credenciales en intervals.icu/settings/api';
        throw new Error(`${details}. ${hint}`);
      }

      setSuccess('✓ Intervals.icu conectado correctamente');
      setApiKey('');
      setAthleteId('');
      setShowForm(false);
      setTestResults(null);
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
                    placeholder="Tu Athlete ID (ej: 123456 o john-doe)"
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén de: <a href="https://intervals.icu/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">intervals.icu/dashboard</a> → mira la URL de tu perfil
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">{success}</p>
                  </div>
                )}

                {testResults && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-900">🧪 Resultados de diagnóstico:</p>
                    {testResults.testResults?.map((result: any, idx: number) => (
                      <div key={idx} className="text-xs text-blue-700">
                        {result.success ? (
                          <span className="flex gap-2">
                            <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span>{result.test} ✓</span>
                          </span>
                        ) : (
                          <span className="flex gap-2">
                            <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span>{result.test} (HTTP {result.status})</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTest}
                    disabled={testing || loading || !apiKey}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                    {testing ? 'Probando...' : 'Probar Conexión'}
                  </Button>
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                    {loading ? 'Conectando...' : 'Conectar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setTestResults(null);
                      setError('');
                    }}
                    disabled={loading || testing}
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
