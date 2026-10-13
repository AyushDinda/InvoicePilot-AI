import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DuplicateAlertBannerProps {
  reason?: string | null;
  duplicateOfId?: string | null;
}

export const DuplicateAlertBanner: React.FC<DuplicateAlertBannerProps> = ({
  reason,
  duplicateOfId,
}) => {
  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5 mb-6 text-amber-200">
      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-amber-300 text-sm flex items-center gap-2">
          <span>Potential Duplicate Document Detected</span>
        </h4>
        <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
          {reason || 'This document closely matches an existing record by file hash, invoice number, or amount.'}
        </p>
        {duplicateOfId && (
          <Link
            to={`/documents/${duplicateOfId}`}
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            <span>View matching existing record</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
