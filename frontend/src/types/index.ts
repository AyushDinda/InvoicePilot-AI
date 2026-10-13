export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReviewStatus = 'needs_review' | 'reviewed';

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Food and meals',
  'Software and subscriptions',
  'Office supplies',
  'Equipment',
  'Utilities',
  'Professional services',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const DOCUMENT_TYPES = [
  'Invoice',
  'Receipt',
  'Bill',
  'Estimate',
  'Other',
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

export interface Document {
  id: string;
  internal_filename: string;
  original_filename: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  vendor: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  category: ExpenseCategory;
  document_type: DocumentType;
  description: string | null;
  processing_status: ProcessingStatus;
  error_message: string | null;
  review_status: ReviewStatus;
  is_duplicate: boolean;
  duplicate_reason: string | null;
  duplicate_of_id: string | null;
  confidence_scores: Record<string, any> | null;
  raw_text: string | null;
  extracted_data: Record<string, any> | null;
  ai_model_used: string | null;
  is_mock_extraction: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DocumentUpdate {
  vendor?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  currency?: string;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  category?: string;
  document_type?: string;
  description?: string | null;
  review_status?: ReviewStatus;
}

export interface AIStatus {
  available: boolean;
  base_url: string;
  configured_model: string;
  model_available: boolean;
  mock_mode: boolean;
  available_models: string[];
  message: string;
}

export interface MonthlyExpenseItem {
  month: string;
  currency: string;
  total: number;
  count: number;
}

export interface CategoryExpenseItem {
  category: string;
  currency: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CurrencyTotal {
  currency: string;
  total: number;
  count: number;
}

export interface AnalyticsResponse {
  total_documents: number;
  currency_totals: CurrencyTotal[];
  monthly_expenses: MonthlyExpenseItem[];
  category_breakdown: CategoryExpenseItem[];
  status_counts: Record<string, number>;
  needs_review_count: number;
  duplicate_count: number;
}

export interface DocumentFilterParams {
  search?: string;
  category?: string;
  document_type?: string;
  review_status?: string;
  processing_status?: string;
  is_duplicate?: boolean;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
