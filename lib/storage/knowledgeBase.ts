import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { KnowledgeDocument } from '@/types/knowledge';

const DATA_DIR = process.env.DATA_DIR || './data';
const KB_FILE = path.join(DATA_DIR, 'knowledge-base.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(KB_FILE, 'utf-8');
    return JSON.parse(data) as KnowledgeDocument[];
  } catch {
    return [];
  }
}

export async function saveKnowledgeDocument(
  doc: KnowledgeDocument
): Promise<KnowledgeDocument> {
  await ensureDataDir();
  const docs = await getKnowledgeDocuments();
  // Avoid duplicates by id
  const filtered = docs.filter((d) => d.id !== doc.id);
  filtered.push(doc);
  await fs.writeFile(KB_FILE, JSON.stringify(filtered, null, 2));
  return doc;
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  const docs = await getKnowledgeDocuments();
  const filtered = docs.filter((d) => d.id !== id);
  await fs.writeFile(KB_FILE, JSON.stringify(filtered, null, 2));
}

export async function getKnowledgeDocumentById(
  id: string
): Promise<KnowledgeDocument | null> {
  const docs = await getKnowledgeDocuments();
  return docs.find((d) => d.id === id) || null;
}
