import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Phone, Loader2, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo_white.jpeg';
import { findClientByPhone } from '../api/rewards';
import { saveClientSession } from '../lib/clientSession';

const COUNTRY_CODES = [
  { flag: '🇲🇽', label: 'MX', code: '+52' },
  { flag: '🇺🇸', label: 'US', code: '+1'  },
  { flag: '🇨🇦', label: 'CA', code: '+1'  },
];

interface Props {
  /** Why login is needed, e.g. "para ver tus puntos". */
  reason?: string;
  /** 'home' → go to Inicio after login; 'stay' → the protected page renders in place. */
  afterLogin?: 'home' | 'stay';
}

export default function LoginPage({ reason, afterLogin = 'stay' }: Props) {
  const history = useHistory();
  const [country, setCountry] = useState('MX');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const lada   = COUNTRY_CODES.find(c => c.label === country)?.code ?? '+52';
  const digits = phone.replace(/\D/g, '');
  const valid  = digits.length === 10;

  async function handleLogin() {
    if (!valid || loading) return;
    setLoading(true);
    setError('');
    try {
      const client = await findClientByPhone(lada + digits);
      if (client) {
        saveClientSession(client);
        if (afterLogin === 'home') history.replace('/home');
      } else {
        setError('No encontramos una cuenta con ese número. Pregunta en caja para registrarte.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col items-center justify-center px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="GMO Lavandería" className="w-24 h-24 rounded-3xl object-contain bg-white shadow-xl" />
          <h1 className="text-white font-black text-2xl leading-tight uppercase tracking-wide">
            Lavandería Y<br />Auto&#8209;Lavado
          </h1>
          <p className="text-blue-200 text-base">
            Inicia sesión con tu número de celular{reason ? ` ${reason}` : ''}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={e => { e.preventDefault(); handleLogin(); }}
          className="w-full bg-white rounded-3xl shadow-2xl p-5 flex flex-col gap-4"
        >
          <label className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Phone className="w-4 h-4 text-blue-600" /> Número de celular
          </label>

          <div className="flex rounded-xl border-2 border-blue-200 overflow-hidden">
            {COUNTRY_CODES.map(c => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCountry(c.label)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-bold transition-colors
                  ${country === c.label ? 'bg-[#0a2d6e] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <span>{c.flag}</span>
                <span>{c.label === 'MX' ? c.code : c.label}</span>
              </button>
            ))}
          </div>

          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            enterKeyHint="go"
            autoFocus
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
            placeholder="10 dígitos — Ej. 6621234567"
            className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3.5 text-xl font-semibold text-slate-800 outline-none transition-colors"
          />

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || loading}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-[#0a2d6e] hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-colors active:scale-[0.98]"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando…</>
              : <><LogIn className="w-5 h-5" /> Entrar</>}
          </button>
        </form>

        <p className="text-blue-300/80 text-xs text-center">
          Tu sesión se mantiene activa en este dispositivo por 30 días.
        </p>

        <button
          type="button"
          onClick={() => history.push('/home')}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-bold py-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </button>
      </div>
    </div>
  );
}
