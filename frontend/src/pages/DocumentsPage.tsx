import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  getDocuments,
  deleteDocument,
  reprocessDocument,
  getExportCsvUrl,
} from '../services/api';
import {
  Document,
  DocumentListResponse,
  EXPENSE_CATEGORIES,
  DOCUMENT_TYPES,
  DocumentFilterParams,
} from '../types';
import {
  ProcessingStatusBadge,
  ReviewStatusBadge,
  DuplicateBadge,
  MockIndicatorBadge,
} from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export const DocumentsPage: React.FC = () => {
  const [data, setData] = useState<DocumentListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search state
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [documentType, setDocumentType] = useState<string>('All');
  const [reviewStatus, setReviewStatus] = useState<string>('All');
  const [processingStatus, setProcessingStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: DocumentFilterParams = {
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        document_type: documentType !== 'All' ? documentType : undefined,
        review_status: reviewStatus !== 'All' ? reviewStatus : undefined,
        processing_status: processingStatus !== 'All' ? processingStatus : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 15,
      };
      const res = await getDocuments(params);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [category, documentType, reviewStatus, processingStatus, sortBy, sortOrder, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setDocumentType('All');
    setReviewStatus('All');
    setProcessingStatus('All');
    setStartDate('');
    setEndDate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id);
      setDocToDelete(null);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleReprocess = async (doc: Document) => {
    try {
      setReprocessingId(doc.id);
      await reprocessDocument(doc.id, doc.is_mock_extraction);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Reprocessing error: ${err.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  const exportUrl = getExportCsvUrl({
    search: search || undefined,
    category: category !== 'All' ? category : undefined,
    document_type: documentType !== 'All' ? documentType : undefined,
    review_status: reviewStatus !== 'All' ? reviewStatus : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Invoices & Receipts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter, correct extracted data, and export your financial records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={exportUrl}
            download="invoicepilot_export.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all hover:text-white"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Export CSV</span>
          </a>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-sm font-bold transition-all shadow-md shadow-brand-500/20"
          >
            <span>+ Upload</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, invoice #, filename, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-850">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Doc Type
            </label>
            <select
              value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Review Status
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => { setReviewStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="needs_review">Needs Review</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="created_at">Date Uploaded</option>
              <option value="invoice_date">Invoice Date</option>
              <option value="total">Amount (Total)</option>
              <option value="vendor">Vendor Name</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as 'asc' | 'desc'); setPage(1); }}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Date Filter
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading documents...</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No documents found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No financial records match your current filters. Try resetting the search or upload a document.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-brand-400 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                  <th className="py-3.5 px-4">Document / File</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Review</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data.items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                        <div>
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-medium text-white hover:text-brand-300 block truncate max-w-[200px]"
                          >
                            {doc.original_filename}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {(doc.file_size / 1024).toFixed(0)} KB
                            </span>
                            {doc.is_duplicate && (
                              <DuplicateBadge isDuplicate={true} reason={doc.duplicate_reason} />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300 truncate max-w-[160px]">
                      {doc.vendor || <span className="text-slate-400 italic">Unextracted</span>}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {doc.invoice_number || '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {doc.invoice_date || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {doc.total !== null ? (
                        `${doc.currency} ${doc.total.toFixed(2)}`
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <ProcessingStatusBadge status={doc.processing_status} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <ReviewStatusBadge status={doc.review_status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/documents/${doc.id}`}
                          title="View & Edit Document"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          title="Retry AI Extraction"
                          onClick={() => handleReprocess(doc)}
                          disabled={reprocessingId === doc.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-brand-300 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${reprocessingId === doc.id ? 'animate-spin text-brand-400' : ''}`} />
                        </button>

                        <button
                          title="Delete Document"
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(data.page - 1) * data.limit + 1} to{' '}
              {Math.min(data.page * data.limit, data.total)} of {data.total} records
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-200">
                Page {data.page} of {data.total_pages}
              </span>
              <button
                disabled={data.page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Financial Document?"
        message={`Are you sure you want to permanently delete "${docToDelete?.original_filename}"? This action safely removes both the stored file and its database record.`}
        confirmLabel="Delete Document"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};
