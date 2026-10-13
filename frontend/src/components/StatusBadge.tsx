import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Sparkles,
  Copy,
  Cpu,
} from 'lucide-react';
import { ProcessingStatus, ReviewStatus } from '../types';

export const ProcessingStatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Extracted
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Processing
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
};

export const ReviewStatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  if (status === 'reviewed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      Needs Review
    </span>
  );
};

export const DuplicateBadge: React.FC<{ isDuplicate: boolean; reason?: string | null }> = ({
  isDuplicate,
  reason,
}) => {
  if (!isDuplicate) return null;
  return (
    <span
      title={reason || 'Potential duplicate'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30"
    >
      <Copy className="w-3.5 h-3.5" />
      Potential Duplicate
    </span>
  );
};

export const MockIndicatorBadge: React.FC<{ isMock: boolean }> = ({ isMock }) => {
  if (!isMock) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Cpu className="w-3 h-3" />
        Local Ollama
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
      <Sparkles className="w-3 h-3 text-purple-400" />
      Mock Mode
    </span>
  );
};

export const ConfidencePill: React.FC<{ level?: string }> = ({ level = 'medium' }) => {
  const norm = level.toLowerCase();
  if (norm === 'high') {
    return <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">High clarity</span>;
  }
  if (norm === 'low') {
    return <span className="text-[11px] font-medium text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">Review needed</span>;
  }
  return <span className="text-[11px] font-medium text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">Estimated</span>;
};
