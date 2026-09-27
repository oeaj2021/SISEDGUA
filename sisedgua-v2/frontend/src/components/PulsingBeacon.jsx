import React from 'react';

export default function PulsingBeacon({ active = true, label = "SALA ACTIVA" }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner">
      <span className="relative flex h-2.5 w-2.5">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bio-emerald opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? 'bg-bio-emerald' : 'bg-alert-crimson'}`}></span>
      </span>
      <span className="text-xs font-mono tracking-wider font-semibold text-slate-300 uppercase">
        {label}
      </span>
    </div>
  );
}
