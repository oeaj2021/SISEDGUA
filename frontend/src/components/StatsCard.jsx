import React from 'react';

export default function StatsCard({ label, value, subtext, icon, color = 'blue' }) {
  const cardAccents = {
    blue: 'border-blue-200/80 hover:border-blue-400 bg-gradient-to-b from-blue-50/40 to-white text-blue-950',
    green: 'border-emerald-200/80 hover:border-emerald-400 bg-gradient-to-b from-emerald-50/40 to-white text-emerald-950',
    red: 'border-rose-200/80 hover:border-rose-400 bg-gradient-to-b from-rose-50/40 to-white text-rose-950',
    amber: 'border-blue-200/80 hover:border-blue-400 bg-gradient-to-b from-sky-50/40 to-white text-blue-950'
  };

  const badgeThemes = {
    blue: 'bg-blue-100/90 text-blue-800 border border-blue-200',
    green: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200',
    red: 'bg-rose-100/90 text-rose-800 border border-rose-200',
    amber: 'bg-sky-100/90 text-sky-800 border border-sky-200'
  };

  const iconWrappers = {
    blue: 'bg-blue-100/80 text-blue-700',
    green: 'bg-emerald-100/80 text-emerald-700',
    red: 'bg-rose-100/80 text-rose-700',
    amber: 'bg-sky-100/80 text-sky-700'
  };

  return (
    <div className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${cardAccents[color] || cardAccents.blue}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${iconWrappers[color] || iconWrappers.blue}`}>
          {icon}
        </span>
        {subtext && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeThemes[color]}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className="text-3xl font-black tracking-tight text-slate-900">{value}</div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1.5">{label}</div>
    </div>
  );
}
