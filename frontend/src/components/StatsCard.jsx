import React from 'react';

export default function StatsCard({ label, value, subtext, icon, color = 'blue' }) {
  const badgeThemes = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200'
  };

  const iconWrappers = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    red: 'bg-rose-50 text-rose-700 border border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${iconWrappers[color] || iconWrappers.blue}`}>
          {icon}
        </span>
        {subtext && (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${badgeThemes[color]}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1.5">{label}</div>
    </div>
  );
}
