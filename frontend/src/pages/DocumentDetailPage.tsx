import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Trash2,
  RefreshCw,
  FileText,
  Download,
  AlertTriangle,
  Info,
  Calendar,
  DollarSign,
  Tag,
  Building,
  Hash,
  Eye,
  FileCode,
} from 'lucide-react';
import {
  getDocument,
  updateDocument,
  deleteDocument,
  reprocessDocument,
  getDocumentFileUrl,
} from '../services/api';
import {
  Document,
  EXPENSE_CATEGORIES,
  DOCUMENT_TYPES,
  DocumentUpdate,
} from '../types';
import {
  ProcessingStatusBadge,
  ReviewStatusBadge,
  DuplicateBadge,
  MockIndicatorBadge,
  ConfidencePill,
} from '../components/StatusBadge';
import { DuplicateAlertBanner } from '../components/DuplicateAlertBanner';
import { ConfirmModal } from '../components/ConfirmModal';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [reprocessing, setReprocessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'ocr'>('preview');

  // Form State
  const [form, setForm] = useState<DocumentUpdate>({
    vendor: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    currency: 'USD',
    subtotal: null,
    tax: null,
    total: null,
    category: 'Other',
    document_type: 'Invoice',
    description: '',
    review_status: 'needs_review',
  });

  const loadDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument(id);
      setDocument(doc);
      setForm({
        vendor: doc.vendor || '',
        invoice_number: doc.invoice_number || '',
        invoice_date: doc.invoice_date || '',
        due_date: doc.due_date || '',
        currency: doc.currency || 'USD',
        subtotal: doc.subtotal,
        tax: doc.tax,
        total: doc.total,
        category: doc.category || 'Other',
        document_type: doc.document_type || 'Invoice',
        description: doc.description || '',
        review_status: doc.review_status || 'needs_review',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id]);

  const handleInputChange = (field: keyof DocumentUpdate, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      const updated = await updateDocument(id, form);
      setDocument(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReviewed = async () => {
    if (!id || !document) return;
    const newStatus = document.review_status === 'reviewed' ? 'needs_review' : 'reviewed';
    try {
      setSaving(true);
      const updated = await updateDocument(id, { review_status: newStatus });
      setDocument(updated);
      setForm((prev) => ({ ...prev, review_status: newStatus }));
    } catch (err: any) {
      alert(`Failed to update review status: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    if (!id) return;
    try {
      setReprocessing(true);
      const updated = await reprocessDocument(id, document?.is_mock_extraction);
      setDocument(updated);
      setForm({
        vendor: updated.vendor || '',
        invoice_number: updated.invoice_number || '',
        invoice_date: updated.invoice_date || '',
        due_date: updated.due_date || '',
        currency: updated.currency || 'USD',
        subtotal: updated.subtotal,
        tax: updated.tax,
        total: updated.total,
        category: updated.category || 'Other',
        document_type: updated.document_type || 'Invoice',
        description: updated.description || '',
        review_status: updated.review_status || 'needs_review',
      });
    } catch (err: any) {
      alert(`Reprocessing error: ${err.message}`);
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDocument(id);
      navigate('/documents');
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading document details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Document Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not find the requested document.'}</p>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-brand-400 text-sm font-semibold hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Invoices</span>
        </Link>
      </div>
    );
  }

  const fileUrl = getDocumentFileUrl(document.id);
  const isImage = document.mime_type.startsWith('image/');
  const isPdf = document.mime_type.includes('pdf');
  const confScores = document.confidence_scores || {};

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate max-w-md">
                {document.original_filename}
              </h1>
              <ProcessingStatusBadge status={document.processing_status} />
              <ReviewStatusBadge status={document.review_status} />
              <MockIndicatorBadge isMock={document.is_mock_extraction} />
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ID: {document.id} • SHA-256: {document.file_hash ? document.file_hash.slice(0, 12) + '...' : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleReviewed}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              document.review_status === 'reviewed'
                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{document.review_status === 'reviewed' ? 'Mark Needs Review' : 'Approve & Mark Reviewed'}</span>
          </button>

          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            title="Re-run text extraction & model categorization"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-brand-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${reprocessing ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <a
            href={fileUrl}
            download={document.original_filename}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Download Original File"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner if flagged */}
      {document.is_duplicate && (
        <DuplicateAlertBanner
          reason={document.duplicate_reason}
          duplicateOfId={document.duplicate_of_id}
        />
      )}

      {/* Failure Diagnostic Banner if processing failed */}
      {document.processing_status === 'failed' && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Extraction Encountered An Issue</h4>
            <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
              {document.error_message || 'Could not parse text with the configured AI engine.'}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
                <span>Retry Processing</span>
              </button>
              <span className="text-xs text-slate-400">
                You can also enter values manually in the review form on the right.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Left Document Viewer / Right Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Viewer (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Preview</span>
              </button>

              <button
                onClick={() => setActiveTab('ocr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ocr'
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Extracted Text</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              {(document.file_size / 1024).toFixed(1)} KB
            </span>
          </div>

          {activeTab === 'preview' ? (
            <div className="bg-slate-950 rounded-xl overflow-hidden min-h-[480px] max-h-[700px] flex items-center justify-center border border-slate-900">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={document.original_filename}
                  className="max-h-[680px] w-auto object-contain rounded-lg p-2"
                />
              ) : isPdf ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  title={document.original_filename}
                  className="w-full h-[600px] border-none rounded-lg"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs">Preview unavailable for this format.</p>
                  <a
                    href={fileUrl}
                    download
                    className="text-xs text-brand-400 underline mt-2 block"
                  >
                    Download to view
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 rounded-xl p-4 min-h-[480px] max-h-[700px] overflow-y-auto border border-slate-900">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Raw Extracted OCR / PDF Text:
              </p>
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {document.raw_text || 'No raw text was captured for this document.'}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Editable Review Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Structured Extraction Review</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and correct extracted values before finalizing accounting export.
              </p>
            </div>

            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved Successfully
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Vendor & Invoice Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Vendor / Merchant
                  </label>
                  <ConfidencePill level={confScores.vendor} />
                </div>
                <input
                  type="text"
                  value={form.vendor || ''}
                  onChange={(e) => handleInputChange('vendor', e.target.value)}
                  placeholder="e.g. AWS, GitHub, Staples"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Invoice / Receipt #
                  </label>
                </div>
                <input
                  type="text"
                  value={form.invoice_number || ''}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  placeholder="e.g. INV-2024-001"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Dates: Issue & Due */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Invoice Date
                  </label>
                  <ConfidencePill level={confScores.invoice_date} />
                </div>
                <input
                  type="text"
                  value={form.invoice_date || ''}
                  onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due Date
                  </label>
                </div>
                <input
                  type="text"
                  value={form.due_date || ''}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Financial Totals Grid */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Amounts & Currency
                </span>
                <ConfidencePill level={confScores.total} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={form.currency || 'USD'}
                    onChange={(e) => handleInputChange('currency', e.target.value.toUpperCase())}
                    placeholder="USD"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Subtotal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.subtotal !== null && form.subtotal !== undefined ? form.subtotal : ''}
                    onChange={(e) => handleInputChange('subtotal', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tax / VAT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tax !== null && form.tax !== undefined ? form.tax : ''}
                    onChange={(e) => handleInputChange('tax', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-400 block mb-1 font-bold">
                    Total Due
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.total !== null && form.total !== undefined ? form.total : ''}
                    onChange={(e) => handleInputChange('total', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-brand-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Category and Document Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Expense Category
                  </label>
                  <ConfidencePill level={confScores.category} />
                </div>
                <select
                  value={form.category || 'Other'}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Document Type
                </label>
                <select
                  value={form.document_type || 'Invoice'}
                  onChange={(e) => handleInputChange('document_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description / Line Items Summary */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Description & Line Item Notes
              </label>
              <textarea
                rows={3}
                value={form.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="e.g. Monthly cloud hosting compute instance and SSL certificate renewal"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-400"
              />
            </div>

            {/* Review Status Radio Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Workflow Verification Status
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="review_status"
                    checked={form.review_status === 'needs_review'}
                    onChange={() => handleInputChange('review_status', 'needs_review')}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-300">Needs Review</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="review_status"
                    checked={form.review_status === 'reviewed'}
                    onChange={() => handleInputChange('review_status', 'reviewed')}
                    className="accent-brand-500"
                  />
                  <span className="text-emerald-300">Reviewed & Approved</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save & Update Record'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.original_filename}"? Both the file on disk and its database entry will be permanently removed.`}
        confirmLabel="Permanently Delete"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
