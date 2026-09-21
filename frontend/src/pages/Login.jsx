import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

export default function Login() {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await login({ email, password });
      loginAdmin(res.data.token, res.data.nombre, res.data.email);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Credenciales no autorizadas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-slate-100 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-950 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-blue-900/30">
            🏫
          </div>
          <span className="text-[11px] font-black tracking-widest text-amber-600 uppercase block mb-1">
            Zona Educativa del Estado Guárico
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SISEDGUA</h1>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de Consolidación y Estadísticas de Asistencia Escolar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Institucional
            </label>
            <input
              type="email"
              required
              placeholder="admin@sisedgua.ve"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña de Acceso
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-950/20 transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            {cargando ? 'Verificando credenciales...' : 'Ingresar al Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            ¿Deseas llenar un reporte? Accede a los formularios públicos:{' '}
            <a href="/manana" className="text-blue-700 font-bold hover:underline">Mañana</a>
            {' · '}
            <a href="/tarde" className="text-blue-700 font-bold hover:underline">Tarde</a>
          </p>
        </div>
      </div>
    </div>
  );
}
