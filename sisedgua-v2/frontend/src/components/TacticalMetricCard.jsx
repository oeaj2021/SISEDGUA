import React from 'react';

export default function TacticalMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'gold', // 'gold' | 'emerald' | 'cyan' | 'crimson'
  badge = null
}) {
  const accentClasses = {
    gold: 'border-l-4 border-l-guarico-gold text-guarico-gold',
    emerald: 'border-l-4 border-l-bio-emerald text-bio-emerald',
    cyan: 'border-l-4 border-l-cyber-cyan text-cyber-cyan',
    crimson: 'border-l-4 border-l-alert-crimson text-alert-crimson'
  };

  return (
    <div className={`glass-card p-5 rounded-2xl relative overflow-hidden ${accentClasses[accent] || accentClasses.gold}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 text-slate-200">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/90 font-medium text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
