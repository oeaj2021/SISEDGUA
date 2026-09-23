import React, { useEffect, useState } from 'react';

/**
 * Pantalla informativa de bloqueo mostrada cuando el formulario se encuentra fuera de horario legal.
 * Turno Mañana: 07:00 a 12:00
 * Turno Tarde:  13:00 a 22:00
 */
export default function FormBlockedScreen({ turno, horaApertura, horaCierre }) {
  const [horaActual, setHoraActual] = useState('');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // Calcular hora en Venezuela (UTC-4)
      const veDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
      const h = veDate.getHours().toString().padStart(2, '0');
      const m = veDate.getMinutes().toString().padStart(2, '0');
      const s = veDate.getSeconds().toString().padStart(2, '0');
      setHoraActual(`${h}:${m}:${s}`);

      const aperturaMs = new Date(
        veDate.getFullYear(),
        veDate.getMonth(),
        veDate.getDate(),
        horaApertura,
        0,
        0
      ).getTime();

      let targetMs = aperturaMs;
      if (veDate.getTime() > aperturaMs) {
        targetMs = aperturaMs + 24 * 60 * 60 * 1000;
      }

      const diff = Math.max(0, targetMs - veDate.getTime());
      const dh = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const dm = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const ds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setCountdown(`${dh}h ${dm}m ${ds}s`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [horaApertura]);

  const esManana = turno === 'MAÑANA';
  const aperturaTexto = esManana ? '07:00 AM' : '01:00 PM';
  const cierreTexto = esManana ? '12:00 PM' : '10:00 PM';

  return (
    <div className="min-h-screen bg-mesh-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-950/10 border border-blue-100 p-8 sm:p-10 max-w-lg w-full text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-4xl mx-auto mb-4 border border-blue-100 shadow-inner">
          {esManana ? '🌅' : '🌙'}
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 mb-3 shadow-sm">
          Turno {turno} — Fuera de Horario
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Recepción de Reportes Inactiva
        </h1>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          El sistema para el <strong>Turno {turno}</strong> recibe información únicamente en el intervalo oficial establecido de{' '}
          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{aperturaTexto}</span> a{' '}
          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{cierreTexto}</span> (Hora legal de la República Bolivariana de Venezuela).
        </p>

        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Hora Actual (VE)</span>
            <span className="text-lg font-mono font-black text-slate-900">{horaActual || '--:--:--'}</span>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4">
            <span className="text-[10px] font-black text-blue-700 uppercase block mb-1">Próxima Apertura</span>
            <span className="text-lg font-mono font-black text-blue-800">
              {countdown || 'Calculando...'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-4">
          ZONA EDUCATIVA DEL ESTADO GUÁRICO · SISTEMA DE ASISTENCIA ESCOLAR 2026-2027
        </div>
      </div>
    </div>
  );
}
