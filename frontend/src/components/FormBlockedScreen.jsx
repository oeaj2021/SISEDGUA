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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-200">
          {esManana ? '🌅' : '🌙'}
        </div>

        <div className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-3">
          Turno {turno} — Fuera de Horario
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Recepción de Reportes Inactiva
        </h1>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          El sistema para el <strong>Turno {turno}</strong> recibe información únicamente en el intervalo oficial establecido de{' '}
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{aperturaTexto}</span> a{' '}
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{cierreTexto}</span> (Hora legal de la República Bolivariana de Venezuela).
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Hora Actual (VE)</span>
            <span className="text-base font-mono font-bold text-slate-800">{horaActual || '--:--:--'}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
            <span className="text-[10px] font-semibold text-blue-700 uppercase block mb-1">Próxima Apertura</span>
            <span className="text-base font-mono font-bold text-blue-800">
              {countdown || 'Calculando...'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-4 font-medium uppercase tracking-tight">
          CENTRO DESARROLLO DE LA CALIDAD EDUCATIVA GUÁRICO · SISTEMA DE ASISTENCIA ESCOLAR 2026-2027
        </div>
      </div>
    </div>
  );
}
