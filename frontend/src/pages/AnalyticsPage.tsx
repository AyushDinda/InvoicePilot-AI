import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getAnalytics, getExportCsvUrl } from '../services/api';
import { AnalyticsResponse } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: selectedCurrency !== 'All' ? selectedCurrency : undefined,
      });
      setAnalytics(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, selectedCurrency]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCurrency('All');
  };

  const availableCurrencies = analytics?.currency_totals.map((c) => c.currency) || [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Expense Analytics & Trends
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audited financial breakdown derived directly from database records without currency mixing.
          </p>
        </div>

        <a
          href={getExportCsvUrl({ start_date: startDate || undefined, end_date: endDate || undefined })}
          download="invoicepilot_analytics_export.csv"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all hover:text-white"
        >
          <Download className="w-4 h-4 text-brand-400" />
          <span>Export Accounting CSV</span>
        </a>
      </div>

      {/* Date Filter & Currency Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {availableCurrencies.length > 1 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Currency:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Currencies</option>
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {(startDate || endDate || selectedCurrency !== 'All') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            Clear Date Range
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Computing analytics from database...</p>
        </div>
      ) : (!analytics || analytics.total_documents === 0) ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Expense Records Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload invoices or receipts to populate monthly charts, category distributions, and currency summaries.
          </p>
        </div>
      ) : (
        <>
          {/* Distinct Currency Summaries (No Blending Currencies!) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Total Expenses By Currency
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.currency_totals.map((c) => (
                <div
                  key={c.currency}
                  className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold">{c.currency} Expenses</span>
                    <span className="p-1 rounded bg-slate-800 font-mono text-[11px] text-slate-300">
                      {c.count} {c.count === 1 ? 'doc' : 'docs'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    {c.currency} {c.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Totals Breakdown Grid */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  <span>Monthly Expense Distribution</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organized by issue month according to verified document dates
                </p>
              </div>
            </div>

            {analytics.monthly_expenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No monthly records in date range.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {analytics.monthly_expenses.map((m) => (
                  <div
                    key={`${m.month}-${m.currency}`}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      {m.month}
                    </span>
                    <span className="text-base font-bold text-white font-mono mt-1 block truncate">
                      {m.currency} {m.total.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {m.count} docs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Bars */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-brand-400" />
                  <span>Expenses by Category</span>
                </h3>
                <span className="text-xs text-slate-400">Share % within currency</span>
              </div>

              {analytics.category_breakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No categories found.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.category_breakdown.map((item) => (
                    <div key={`${item.category}-${item.currency}`} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{item.category}</span>
                        <span className="font-mono text-slate-400">
                          {item.currency} {item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          <span className="ml-1.5 text-[11px] text-brand-400 font-semibold">({item.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Processing Efficiency & Audit Stats */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <span>Processing Status & Quality Health</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                  <span className="text-xs text-slate-400 block">Total Processed</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {analytics.total_documents}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                  <span className="text-xs text-emerald-400 block">Extraction Completed</span>
                  <span className="text-xl font-bold text-emerald-300 mt-1 block">
                    {analytics.status_counts.completed ?? 0}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                  <span className="text-xs text-amber-400 block">Needs User Review</span>
                  <span className="text-xl font-bold text-amber-300 mt-1 block">
                    {analytics.needs_review_count}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                  <span className="text-xs text-rose-400 block">Failed Extractions</span>
                  <span className="text-xl font-bold text-rose-300 mt-1 block">
                    {analytics.status_counts.failed ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <p className="leading-relaxed">
                  <span className="text-white font-semibold">Integrity Guarantee:</span> Financial figures reflect verified database sums. Different currencies are kept isolated to prevent misleading multi-currency totals.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
