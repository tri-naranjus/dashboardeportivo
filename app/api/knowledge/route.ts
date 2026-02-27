import { NextResponse } from 'next/server';
import { getKnowledgeDocuments } from '@/lib/storage/knowledgeBase';

export async function GET() {
  try {
    const docs = await getKnowledgeDocuments();
    return NextResponse.json(docs);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
