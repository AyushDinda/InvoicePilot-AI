import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  accentColor = 'emerald',
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400 tracking-wide">{title}</p>
        <div className={`p-2.5 rounded-xl border ${colorMap[accentColor]} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </h3>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trendPositive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-amber-400 bg-amber-500/10'
                }`}
              >
                {trend}
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
