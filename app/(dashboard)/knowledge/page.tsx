'use client';

import { useState, useEffect } from 'react';
import { KnowledgeDocument } from '@/types/knowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Button removed - not used currently
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Upload, FileText } from 'lucide-react';

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [author, setAuthor] = useState('Other');
  const [topic, setTopic] = useState('Other');
  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch('/api/knowledge');
        if (res.ok) {
          const data = await res.json();
          setDocs(data);
        }
      } catch {
        // ignore
      }
    }
    fetchDocs();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('author', author);
      formData.append('topic', topic);

      const res = await fetch('/api/pdf/extract', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Add to local list
        setDocs((prev) => [
          ...prev,
          {
            id: data.id,
            filename: data.filename,
            author: author as KnowledgeDocument['author'],
            topic: topic as KnowledgeDocument['topic'],
            uploadedAt: new Date().toISOString(),
            extractedText: '',
            textLength: data.textLength,
            summary: `PDF procesado: ${data.textLength} caracteres extraidos`,
          },
        ]);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const authorColors: Record<string, string> = {
    Brooks: 'bg-blue-100 text-blue-700',
    'San Millan': 'bg-green-100 text-green-700',
    Viribay: 'bg-purple-100 text-purple-700',
    Other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Base de Conocimiento</h1>
        <p className="text-muted-foreground">
          Sube tus PDFs cientificos de NotebookLM para enriquecer las
          recomendaciones
        </p>
      </div>

      {/* Upload card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Autor</Label>
              <Select value={author} onValueChange={setAuthor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brooks">
                    George Brooks (Lactate Shuttle)
                  </SelectItem>
                  <SelectItem value="San Millan">
                    Inigo San Millan (Zona 2)
                  </SelectItem>
                  <SelectItem value="Viribay">
                    Aitor Viribay (Periodizacion Nutricional)
                  </SelectItem>
                  <SelectItem value="Other">Otro autor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lactate">Lactato / Metabolismo</SelectItem>
                  <SelectItem value="Zone2">Zona 2 / Mitocondria</SelectItem>
                  <SelectItem value="Nutrition">Nutricion Deportiva</SelectItem>
                  <SelectItem value="Performance">Rendimiento</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Label
              htmlFor="pdf-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-6 py-8 text-center hover:bg-accent"
            >
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {uploading ? 'Procesando...' : 'Seleccionar PDF'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Arrastra o haz clic para subir
                </p>
              </div>
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      {docs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentos ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.textLength.toLocaleString()} caracteres
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={authorColors[doc.author] || ''}
                    >
                      {doc.author}
                    </Badge>
                    <Badge variant="outline">{doc.topic}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Documentos recomendados:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Brooks (2020)</strong> - Lactate Shuttle, metabolismo del
                lactato
              </li>
              <li>
                <strong>San Millan & Brooks (2018)</strong> - Zona 2, salud
                mitocondrial
              </li>
              <li>
                <strong>Viribay et al.</strong> - Periodizacion nutricional, CHO
                loading
              </li>
              <li>
                <strong>Pontzer et al.</strong> - Gasto energetico y
                compensacion
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
