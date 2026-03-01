'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, User } from 'lucide-react';
import { IntervalsIcuConnect } from '@/components/settings/IntervalsIcuConnect';

const DEFAULT_PROFILE: UserProfile = {
  ftp: 250,
  lthr: 160,
  maxHR: 185,
  weight: 65,
  sports: [],
  name: 'Athlete',
  tdee: 2200,
};

const SPORT_OPTIONS = [
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Ciclismo' },
  { id: 'swimming', label: 'Natación' },
  { id: 'trail', label: 'Trail' },
  { id: 'strength', label: 'Fuerza/Calistenia' },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [intervalsIcuConnected, setIntervalsIcuConnected] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Load profile
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // Use defaults
      }

      // Check Intervals.icu connection (optional - if endpoint exists)
      try {
        const res = await fetch('/api/intervals/status');
        if (res.ok) {
          const data = await res.json();
          setIntervalsIcuConnected(data.connected);
        }
      } catch {
        // Endpoint might not exist yet
      }
    }
    loadData();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function updateProfile(field: keyof UserProfile, value: string | number) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSport(sportId: string) {
    setProfile((prev) => {
      const current = prev.sports || [];
      const next = current.includes(sportId)
        ? current.filter((s) => s !== sportId)
        : [...current, sportId];
      return { ...prev, sports: next };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura tu perfil fisiologico y credenciales
        </p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil Fisiologico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deportes que practicas</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {SPORT_OPTIONS.map((sport) => {
                  const active = (profile.sports || []).includes(sport.id);
                  return (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => toggleSport(sport.id)}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {sport.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="ftp">FTP (vatios)</Label>
              <Input
                id="ftp"
                type="number"
                value={profile.ftp}
                onChange={(e) => updateProfile('ftp', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Functional Threshold Power
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lthr">LTHR (bpm)</Label>
              <Input
                id="lthr"
                type="number"
                value={profile.lthr}
                onChange={(e) => updateProfile('lthr', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Lactate Threshold Heart Rate
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxhr">FC Max (bpm)</Label>
              <Input
                id="maxhr"
                type="number"
                value={profile.maxHR}
                onChange={(e) => updateProfile('maxHR', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Frecuencia cardiaca maxima
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight}
                onChange={(e) =>
                  updateProfile('weight', Number(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tdee">TDEE (kcal/dia)</Label>
              <Input
                id="tdee"
                type="number"
                value={profile.tdee}
                onChange={(e) => updateProfile('tdee', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Gasto Energetico Diario Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Guardado</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strava Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Credenciales Strava
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las credenciales de Strava se configuran en el archivo{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .env.local
            </code>{' '}
            en el directorio del proyecto.
          </p>
          <div className="rounded-md bg-muted p-4 font-mono text-xs">
            <p>STRAVA_CLIENT_ID=tu_client_id</p>
            <p>STRAVA_CLIENT_SECRET=tu_client_secret</p>
            <p>NEXT_PUBLIC_APP_URL=http://localhost:3001</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Obtener credenciales en{' '}
            <span className="font-mono">strava.com/settings/api</span>
          </p>
        </CardContent>
      </Card>

      {/* Intervals.icu Connection */}
      <IntervalsIcuConnect
        isConnected={intervalsIcuConnected}
        onConnect={() => setIntervalsIcuConnected(!intervalsIcuConnected)}
      />

      {/* AI API Key placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>API de IA (Futuro)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            En el futuro, podras agregar tu API key de Claude (Anthropic) u
            OpenAI para obtener recomendaciones mas personalizadas basadas en tus
            documentos cientificos.
          </p>
          <div className="mt-4 rounded-md bg-muted p-4 font-mono text-xs">
            <p># En .env.local</p>
            <p>AI_API_KEY=tu_api_key_aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
