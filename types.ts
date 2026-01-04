
export interface Product {
  id: string;
  originalData: Record<string, any>;
  title: string;
  price: number;
  sales: number;
  gmv: number;
  imageUrl?: string;
}

export interface ColumnMapping {
  title: string;
  price: string;
  sales: string;
  image: string;
}

export type UserRole = 'guest' | 'admin';

export interface AIState {
  keywords: string;
  title: string;
  description: string;
  script: string;
  isGenerating: boolean;
  error: string | null;
}

// Structured Content for Title, Description, Script
export interface GeneratedContent {
    title: string;
    description: string;
    script: string;
}

export interface BatchResult {
  productId: string;
  productName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  // Stores bilingual content
  contentEn?: GeneratedContent;
  contentZh?: GeneratedContent;
  errorMsg?: string;
}

export type ScoreGrade = "S+" | "S" | "A" | "B" | "C";

export interface AnalysisScore {
  grade: ScoreGrade;
  text: string;
  colorClass: string;
  label?: string; // e.g. "Volume King", "High Ticket"
}
