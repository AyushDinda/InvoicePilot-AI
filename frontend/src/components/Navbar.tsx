import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Upload,
  Cpu,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getAIStatus, toggleMockMode } from '../services/api';
import { AIStatus } from '../types';

export const Navbar: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const location = useLocation();

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const s = await getAIStatus();
      setAiStatus(s);
    } catch {
      // Offline fallback
      setAiStatus({
        available: false,
        base_url: 'http://localhost:11434',
        configured_model: 'qwen2.5:7b',
        model_available: false,
        mock_mode: true,
        available_models: [],
        message: 'Ollama is unreachable',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMock = async () => {
    try {
      await toggleMockMode();
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/30 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  InvoicePilot
                </span>
                <span className="text-xs font-black tracking-widest px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30 uppercase">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider">Local & Privacy-First</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Zero Cloud Uploads • 100% On-Device</span>
          </div>
        </div>

        {/* Right side status badges & actions */}
        <div className="flex items-center gap-3">
          {/* AI engine indicator */}
          <div className="hidden sm:flex items-center">
            {aiStatus?.available ? (
              <div
                title={`Ollama running on ${aiStatus.base_url} with model ${aiStatus.configured_model}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama: {aiStatus.configured_model}</span>
              </div>
            ) : aiStatus?.mock_mode ? (
              <div
                title="Mock AI active for testing without local Ollama model"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 cursor-pointer hover:bg-purple-500/25 transition-colors"
                onClick={handleToggleMock}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Mock Mode Active</span>
              </div>
            ) : (
              <div
                title="Ollama offline. Click to view Settings."
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ollama Offline</span>
              </div>
            )}
          </div>

          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 transition-all shadow-md shadow-brand-500/20 hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
