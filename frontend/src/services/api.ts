import {
  Document,
  DocumentListResponse,
  DocumentUpdate,
  AIStatus,
  AnalyticsResponse,
  DocumentFilterParams,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getHealth(): Promise<{ status: string; app: string; version: string }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function getAIStatus(): Promise<AIStatus> {
  const res = await fetch(`${API_BASE}/api/ai/status`);
  if (!res.ok) throw new Error(`AI status check failed: ${res.statusText}`);
  return res.json();
}

export async function toggleMockMode(): Promise<{ mock_mode: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/ai/toggle-mock`, { method: 'POST' });
  if (!res.ok) throw new Error(`Toggle mock mode failed: ${res.statusText}`);
  return res.json();
}

export async function uploadDocuments(
  files: File[],
  forceMock: boolean = false
): Promise<Document[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const url = `${API_BASE}/api/documents/upload?force_mock=${forceMock}`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Upload failed: ${errorBody || res.statusText}`);
  }

  return res.json();
}

export async function getDocuments(params: DocumentFilterParams = {}): Promise<DocumentListResponse> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.document_type) query.set('document_type', params.document_type);
  if (params.review_status) query.set('review_status', params.review_status);
  if (params.processing_status) query.set('processing_status', params.processing_status);
  if (params.is_duplicate !== undefined) query.set('is_duplicate', String(params.is_duplicate));
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_order) query.set('sort_order', params.sort_order);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/api/documents?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
  return res.json();
}

export async function getDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`);
  if (!res.ok) throw new Error(`Document not found: ${res.statusText}`);
  return res.json();
}

export function getDocumentFileUrl(id: string): string {
  return `${API_BASE}/api/documents/${id}/file`;
}

export async function updateDocument(id: string, payload: DocumentUpdate): Promise<Document> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Update failed: ${errorBody || res.statusText}`);
  }

  return res.json();
}

export async function reprocessDocument(id: string, forceMock: boolean = false): Promise<Document> {
  const res = await fetch(`${API_BASE}/api/documents/${id}/process?force_mock=${forceMock}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Reprocessing failed: ${errorBody || res.statusText}`);
  }

  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}

export async function getAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  currency?: string;
}): Promise<AnalyticsResponse> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('start_date', params.startDate);
  if (params?.endDate) query.set('end_date', params.endDate);
  if (params?.currency) query.set('currency', params.currency);

  const res = await fetch(`${API_BASE}/api/analytics?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  return res.json();
}

export function getExportCsvUrl(params: DocumentFilterParams = {}): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.document_type) query.set('document_type', params.document_type);
  if (params.review_status) query.set('review_status', params.review_status);
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);

  return `${API_BASE}/api/export/csv?${query.toString()}`;
}
