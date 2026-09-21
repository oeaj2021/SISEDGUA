import React from 'react';

export default function StatsCard({ label, value, subtext, icon, color = 'blue' }) {
  const themes = {
    blue: 'bg-blue-50/70 border-blue-200 text-blue-950',
    green: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
    red: 'bg-rose-50/70 border-rose-200 text-rose-950',
    amber: 'bg-amber-50/70 border-amber-200 text-amber-950'
  };

  const badgeThemes = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    amber: 'bg-amber-100 text-amber-800'
  };

  return (
    <div className={`border rounded-2xl p-5 transition-all shadow-sm ${themes[color] || themes.blue}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {subtext && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeThemes[color]}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      <div className="text-xs font-semibold opacity-75 mt-1">{label}</div>
    </div>
  );
}
