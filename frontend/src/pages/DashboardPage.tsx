import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Copy,
  Calendar,
  Upload,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import { getAnalytics, getDocuments } from '../services/api';
import { AnalyticsResponse, Document } from '../types';
import { StatCard } from '../components/StatCard';
import {
  ProcessingStatusBadge,
  ReviewStatusBadge,
  DuplicateBadge,
} from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [anData, docData] = await Promise.all([
          getAnalytics(),
          getDocuments({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
        ]);
        setAnalytics(anData);
        setRecentDocs(docData.items);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  const isEmpty = (analytics?.total_documents ?? 0) === 0;

  // Render Onboarding State if empty
  if (isEmpty) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 md:p-12 border border-slate-800 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome to InvoicePilot AI
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed">
            Stop manually typing invoice amounts and expense receipts. Upload your first PDF or receipt image now to test local AI extraction and automated categorization.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto my-8 text-left">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h4 className="font-semibold text-white text-sm">Upload Documents</h4>
              <p className="text-xs text-slate-400 mt-1">
                Drag and drop PDF invoices, receipts, or smartphone photos.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h4 className="font-semibold text-white text-sm">Local AI Extraction</h4>
              <p className="text-xs text-slate-400 mt-1">
                OCR and local Ollama model extract vendor, date, taxes, and totals safely on your device.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h4 className="font-semibold text-white text-sm">Review & Export</h4>
              <p className="text-xs text-slate-400 mt-1">
                Review extracted fields, detect duplicate bills, and export clean CSV for your tax filings.
              </p>
            </div>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-brand-500/20 hover:scale-105"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Your First Document</span>
          </Link>
        </div>
      </div>
    );
  }

  // Currency summary strings
  const primaryCurrencyTotal =
    analytics?.currency_totals && analytics.currency_totals.length > 0
      ? `${analytics.currency_totals[0].currency} ${analytics.currency_totals[0].total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '$0.00';

  const multiCurrencyNote =
    analytics?.currency_totals && analytics.currency_totals.length > 1
      ? `+ ${analytics.currency_totals.slice(1).map((c) => `${c.currency} ${c.total.toFixed(2)}`).join(', ')}`
      : undefined;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time expense overview and document processing pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Invoices</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recorded Expenses"
          value={primaryCurrencyTotal}
          subtitle={multiCurrencyNote}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Total Documents"
          value={analytics?.total_documents ?? 0}
          subtitle={`${analytics?.status_counts.completed ?? 0} successfully extracted`}
          icon={<FileText className="w-5 h-5" />}
          accentColor="blue"
        />

        <StatCard
          title="Documents Needing Review"
          value={analytics?.needs_review_count ?? 0}
          subtitle="Pending user verification"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="amber"
        />

        <StatCard
          title="Potential Duplicates"
          value={analytics?.duplicate_count ?? 0}
          subtitle="Flagged by hash or metadata"
          icon={<Copy className="w-5 h-5" />}
          accentColor="rose"
        />
      </div>

      {/* Two-Column Layout: Categories breakdown and Monthly overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (1 col) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-brand-400" />
                <span>Expenses by Category</span>
              </h2>
              <span className="text-xs text-slate-400">Database verified</span>
            </div>

            {(!analytics?.category_breakdown || analytics.category_breakdown.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No categorized expenses recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {analytics.category_breakdown.slice(0, 6).map((cat) => (
                  <div key={`${cat.category}-${cat.currency}`} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{cat.category}</span>
                      <span className="text-slate-400 font-mono">
                        {cat.currency} {cat.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-[11px] text-slate-400">({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <Link
              to="/analytics"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 justify-end"
            >
              <span>View full analytics & trends</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Monthly Expense Trends (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span>Monthly Expense Totals</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Calculated from verified document issue dates</p>
            </div>
            <Link
              to="/analytics"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              Detailed Breakdown →
            </Link>
          </div>

          {(!analytics?.monthly_expenses || analytics.monthly_expenses.length === 0) ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No monthly expense history available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {analytics.monthly_expenses.map((m) => (
                <div
                  key={`${m.month}-${m.currency}`}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {m.month}
                  </p>
                  <p className="text-lg font-bold text-white mt-1 font-mono">
                    {m.currency} {m.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {m.count} {m.count === 1 ? 'document' : 'documents'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Processed Documents Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-brand-400" />
              <span>Recently Processed Documents</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any document to inspect extracted fields or edit values.
            </p>
          </div>
          <Link
            to="/documents"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All ({analytics?.total_documents ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Document</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Review</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors group">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                      <div>
                        <span className="font-medium text-white block truncate max-w-[180px]">
                          {doc.original_filename}
                        </span>
                        {doc.is_duplicate && (
                          <DuplicateBadge isDuplicate={true} reason={doc.duplicate_reason} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-medium truncate max-w-[150px]">
                    {doc.vendor || <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 text-xs font-mono">
                    {doc.invoice_date || 'N/A'}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                    {doc.total !== null ? (
                      `${doc.currency} ${doc.total.toFixed(2)}`
                    ) : (
                      <span className="text-slate-400 font-normal text-xs">Unspecified</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <ProcessingStatusBadge status={doc.processing_status} />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <ReviewStatusBadge status={doc.review_status} />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 transition-colors inline-block"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
