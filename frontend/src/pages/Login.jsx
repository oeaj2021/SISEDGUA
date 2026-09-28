import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

export default function Login() {
  const { loginAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const isExpired = searchParams.get('expired') === 'true';

  const esComuc =
    redirectParam?.includes('consejos') ||
    redirectParam?.includes('comuc') ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'comuc.sisedgua.site' ||
        window.location.hostname.startsWith('comuc.')));


  const destinoFinal = redirectParam || (esComuc ? '/consejos-comunales/registros' : '/dashboard');

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
      loginAdmin(res.data.token, res.data.nombre, res.data.email, destinoFinal);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Credenciales no autorizadas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="p-3.5 bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-800 shadow-md w-fit">
            <img
              src="/cde-guarico-logo.png"
              alt="CDCE Guárico"
              className="h-16 w-auto object-contain filter drop-shadow-md"
            />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase block mb-1">
            Sala Situacional CDCE ESTADAL GUÁRICO
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {esComuc ? 'Consejos Comunales' : 'SISEDGUA'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {esComuc ? 'Acceso al Registro y Auditoría Comunal' : 'Acceso Administrativo y Auditoría'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Institucional
            </label>
            <input
              type="email"
              required
              placeholder="admin@sisedgua.ve"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña de Acceso
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white text-slate-800"
            />
          </div>

          {isExpired && !error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <span>⏳</span>
              <span className="font-medium">Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}


          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {cargando ? 'Verificando credenciales...' : 'Ingresar al Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            ¿Deseas registrar un reporte diario?{' '}
            <Link to="/manana" className="text-blue-600 font-semibold hover:underline">Mañana</Link>
            {' · '}
            <Link to="/tarde" className="text-blue-600 font-semibold hover:underline">Tarde</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
