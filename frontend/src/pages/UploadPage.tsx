import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  File,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Cpu,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { uploadDocuments, getAIStatus } from '../services/api';
import { AIStatus, Document } from '../types';

interface FileQueueItem {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  error?: string;
  result?: Document;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

export const UploadPage: React.FC = () => {
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [forceMock, setForceMock] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAIStatus().then((s) => {
      setAiStatus(s);
      if (!s.available) {
        setForceMock(true);
      }
    }).catch(() => {
      setForceMock(true);
    });
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return { valid: false, error: `Unsupported file extension (${ext}). Please use PDF, JPG, or PNG.` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).` };
    }
    return { valid: true };
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: FileQueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const val = validateFile(f);
      newItems.push({
        id: `${f.name}-${Date.now()}-${i}`,
        file: f,
        status: val.valid ? 'queued' : 'failed',
        error: val.error,
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const startBatchUpload = async () => {
    const itemsToUpload = queue.filter((i) => i.status === 'queued');
    if (itemsToUpload.length === 0) return;

    setIsProcessing(true);

    // Update statuses to uploading
    setQueue((prev) =>
      prev.map((i) =>
        i.status === 'queued' ? { ...i, status: 'uploading' } : i
      )
    );

    try {
      const files = itemsToUpload.map((i) => i.file);
      const results = await uploadDocuments(files, forceMock);

      setQueue((prev) =>
        prev.map((item) => {
          const match = results.find(
            (r) => r.original_filename === item.file.name
          );
          if (match) {
            if (match.processing_status === 'failed') {
              return {
                ...item,
                status: 'failed',
                error: match.error_message || 'Processing failed',
                result: match,
              };
            }
            return {
              ...item,
              status: 'completed',
              result: match,
            };
          }
          return item;
        })
      );
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'uploading'
            ? { ...item, status: 'failed', error: err.message || 'Upload error' }
            : item
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const hasQueuedItems = queue.some((i) => i.status === 'queued');
  const hasCompletedItems = queue.some((i) => i.status === 'completed');

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Upload Financial Documents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Batch-upload PDF invoices or receipt photos for local AI text extraction and categorization.
          </p>
        </div>

        {/* AI Mode Selector */}
        <div className="p-3 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-400 block">Processing Engine:</span>
            <span className="font-semibold text-white">
              {forceMock
                ? 'Mock Mode (Offline Heuristics)'
                : aiStatus?.available
                ? `Ollama (${aiStatus.configured_model})`
                : 'Ollama (Unavailable)'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={forceMock}
              onChange={(e) => setForceMock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-2 text-xs font-medium text-slate-300">
              Mock AI
            </span>
          </label>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-slate-500 hover:bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFilesSelected(e.target.files)}
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white">
          Drop your invoices & receipts here, or <span className="text-brand-400 underline underline-offset-4">browse files</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          Supports searchable PDFs, scanned PDFs, JPG, and PNG images up to 10 MB each.
          Processed securely on your machine.
        </p>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Multi-file Batching
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> OCR + LLM Parsing
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> 100% On-Device
          </span>
        </div>
      </div>

      {/* Batch Queue & Progress */}
      {queue.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">
              Upload Queue ({queue.length} {queue.length === 1 ? 'file' : 'files'})
            </h3>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQueue([])}
                disabled={isProcessing}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                Clear Queue
              </button>

              {hasQueuedItems && (
                <button
                  type="button"
                  onClick={startBatchUpload}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Process Documents</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {queue.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-brand-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'queued' && (
                    <span className="text-xs text-slate-400 px-2.5 py-1 rounded-full bg-slate-800">
                      Ready
                    </span>
                  )}

                  {item.status === 'uploading' && (
                    <span className="text-xs text-sky-400 px-2.5 py-1 rounded-full bg-sky-500/10 flex items-center gap-1.5 border border-sky-500/20">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </span>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1.5 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Extracted
                      </span>
                      {item.result && (
                        <button
                          onClick={() => navigate(`/documents/${item.result!.id}`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 transition-colors flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {item.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <span
                        title={item.error}
                        className="text-xs text-rose-400 px-2.5 py-1 rounded-full bg-rose-500/10 flex items-center gap-1.5 border border-rose-500/20"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Failed: {item.error ? item.error.slice(0, 30) : 'Error'}
                      </span>
                    </div>
                  )}

                  {!isProcessing && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasCompletedItems && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => navigate('/documents')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-brand-400 flex items-center gap-2 transition-colors"
              >
                <span>View All Invoices</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
