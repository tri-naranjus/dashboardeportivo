export interface KnowledgeDocument {
  id: string;
  filename: string;
  author: 'Brooks' | 'San Millan' | 'Viribay' | 'Other';
  topic: 'Lactate' | 'Zone2' | 'Nutrition' | 'Performance' | 'Other';
  uploadedAt: string;
  extractedText: string;
  textLength: number;
  summary: string; // First 300 chars for preview
}
