import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-mesh-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas en tonos azules */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-950/15 p-8 sm:p-10 w-full max-w-md border border-blue-100/90 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-blue-600/30 border border-blue-400/40">
            🏫
          </div>
          <span className="text-[11px] font-black tracking-widest text-blue-600 uppercase block mb-1">
            Zona Educativa del Estado Guárico
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">SISEDGUA</h1>
          <p className="text-xs text-slate-500 mt-1">
            Panel de Acceso para Coordinadores y Autoridades
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
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
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
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
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
            className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-200 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {cargando ? 'Verificando credenciales...' : 'Ingresar al Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            ¿Deseas registrar un reporte diario?{' '}
            <Link to="/manana" className="text-blue-600 font-bold hover:underline">Mañana</Link>
            {' · '}
            <Link to="/tarde" className="text-blue-600 font-bold hover:underline">Tarde</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
