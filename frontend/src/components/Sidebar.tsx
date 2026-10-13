import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Receipt,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Documents', icon: UploadCloud },
    { to: '/documents', label: 'All Invoices & Receipts', icon: Receipt },
    { to: '/analytics', label: 'Expense Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings & Local AI', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 hidden md:flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 font-semibold border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom privacy info box */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-brand-400 font-semibold mb-1">
          <Shield className="w-4 h-4" />
          <span>Local Privacy Guarantee</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Documents remain on your computer. Inference runs locally using Ollama. No third-party AI APIs.
        </p>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Hacktoberfest Week 2</span>
          <span className="text-brand-400 font-semibold">Side Hustle</span>
        </div>
      </div>
    </aside>
  );
};
