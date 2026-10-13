import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Terminal,
  Database,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { getAIStatus, toggleMockMode } from '../services/api';
import { AIStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const s = await getAIStatus();
      setStatus(s);
    } catch {
      setStatus({
        available: false,
        base_url: 'http://localhost:11434',
        configured_model: 'qwen2.5:7b',
        model_available: false,
        mock_mode: true,
        available_models: [],
        message: 'Ollama is unreachable on local port 11434',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await toggleMockMode();
      await checkStatus();
    } catch (e: any) {
      alert(`Toggle failed: ${e.message}`);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings & Local AI Status
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure local open-weight inference, verify Ollama connectivity, and review privacy architecture.
        </p>
      </div>

      {/* Ollama Connection Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Local Ollama Engine Status</h2>
              <p className="text-xs text-slate-400 font-mono">
                Endpoint: {status?.base_url || 'http://localhost:11434'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {status?.available ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-emerald-200">
                Ollama is connected and running locally!
              </p>
              <p>{status.message}</p>
              <p className="text-emerald-400/80">
                Active model: <span className="font-mono font-bold">{status.configured_model}</span>
                {status.model_available ? ' (Installed & Ready)' : ' (Not found in local Ollama list)'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-amber-200">
                Ollama server is not currently reachable
              </p>
              <p>{status?.message || 'Ensure Ollama is installed and running on your system.'}</p>
              <p className="text-amber-400/80">
                You can use Mock Mode below to test the entire application workflow without Ollama running.
              </p>
            </div>
          </div>
        )}

        {/* Installed Models List if Ollama available */}
        {status?.available && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Locally Available Models on Your Device
            </h3>
            {status.available_models.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No models found in Ollama repository.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {status.available_models.map((m) => (
                  <span
                    key={m}
                    className={`text-xs px-3 py-1.5 rounded-xl font-mono border ${
                      m.includes(status.configured_model)
                        ? 'bg-brand-500/15 text-brand-300 border-brand-500/30 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {m} {m.includes(status.configured_model) && '★ (Configured)'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mock Mode Section */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Deterministic Mock AI Mode</span>
                {status?.mock_mode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                Allows full offline testing and test suites without downloading large model weights. When active, all extracted documents are explicitly flagged as Mock in the database and UI.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              status?.mock_mode
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {toggling ? 'Updating...' : status?.mock_mode ? 'Disable Mock Mode' : 'Enable Mock Mode'}
          </button>
        </div>
      </div>

      {/* Local AI Setup Instructions Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">How To Configure Local Open-Weight AI</h2>
            <p className="text-xs text-slate-400">
              Run free, private models on your local CPU or GPU using Ollama.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">1. Download and install Ollama:</span>
            <p className="text-slate-400">
              Download Ollama for Windows or Mac from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-brand-400 underline">ollama.com</a>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">2. Pull your desired open-weight model:</span>
            <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-emerald-400 text-xs overflow-x-auto">
              ollama pull qwen2.5:7b
            </pre>
            <p className="text-slate-400">
              Or lightweight models for lower-memory laptops: <code className="text-slate-300">ollama pull qwen2.5:3b</code> or <code className="text-slate-300">ollama pull llama3.2:3b</code>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">3. Set environment variable in .env:</span>
            <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-emerald-400 text-xs overflow-x-auto">
              OLLAMA_MODEL=qwen2.5:7b
            </pre>
          </div>
        </div>
      </div>

      {/* Privacy Architecture Notice */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Privacy & Security Guarantees</h2>
            <p className="text-xs text-slate-400">
              Designed for freelancers and businesses handling sensitive financial documents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-400">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              Zero Third-Party Cloud APIs
            </span>
            <p className="leading-relaxed">
              No financial documents or extracted invoice amounts are ever transmitted to OpenAI, Anthropic, or external cloud analytics.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              Local Storage Isolation
            </span>
            <p className="leading-relaxed">
              Files are stored in your configured local folder with randomized UUID filenames to prevent path traversal and execution vulnerabilities.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              Safe Parameterized SQL
            </span>
            <p className="leading-relaxed">
              Every database operation utilizes SQLAlchemy parameterized queries, preventing SQL injection vulnerabilities.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              Strict Host Security Notice
            </span>
            <p className="leading-relaxed">
              Local processing provides privacy against external third-party surveillance, but physical and operating system security of your machine remains your responsibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
