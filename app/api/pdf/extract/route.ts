import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf/extractor';
import { saveKnowledgeDocument } from '@/lib/storage/knowledgeBase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const author = (formData.get('author') as string) || 'Other';
    const topic = (formData.get('topic') as string) || 'Other';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text extracted from PDF' },
        { status: 400 }
      );
    }

    // Save knowledge document
    const doc = await saveKnowledgeDocument({
      id: crypto.randomUUID(),
      filename: file.name,
      author: author as 'Brooks' | 'San Millan' | 'Viribay' | 'Other',
      topic: topic as 'Lactate' | 'Zone2' | 'Nutrition' | 'Performance' | 'Other',
      uploadedAt: new Date().toISOString(),
      extractedText: text,
      textLength: text.length,
      summary: text.slice(0, 300),
    });

    return NextResponse.json({
      success: true,
      id: doc.id,
      filename: doc.filename,
      textLength: doc.textLength,
    });
  } catch (error) {
    console.error('PDF extract error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
