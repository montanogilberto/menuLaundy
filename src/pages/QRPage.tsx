import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Phone, Loader2, AlertCircle, X } from 'lucide-react';
import { findClientByPhone } from '../api/rewardsCheckApi';
import { ClientInfo } from '../api/rewards';

type Step = 'enter_phone' | 'loading' | 'show' | 'error';

const COUNTRY_CODES = [
  { flag: '🇲🇽', label: 'MX', code: '+52' },
  { flag: '🇺🇸', label: 'US', code: '+1'  },
  { flag: '🇨🇦', label: 'CA', code: '+1'  },
];

const QR_BASE = 'https://posvending.gmolavanderia.com/rewards-dashboard';

export default function QRPage() {
  const [step, setStep]     = useState<Step>('enter_phone');
  const [lada, setLada]     = useState('+52');
  const [phone, setPhone]   = useState('');
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [error, setError]   = useState('');

  async function handleLookup() {
    const tel = phone.trim();
    if (!tel) return;
    setStep('loading');
    try {
      const found = await findClientByPhone(lada + tel);
      if (found) {
        setClient(found);
        setStep('show');
      } else {
        setError('Número no encontrado. Verifica e intenta de nuevo.');
        setStep('error');
      }
    } catch {
      setError('Error de conexión. Intenta más tarde.');
      setStep('error');
    }
  }

  function reset() {
    setStep('enter_phone');
    setPhone('');
    setClient(null);
    setError('');
  }

  const qrValue = client ? `CLIENT:${client.clientId}:${client.first_name} ${client.last_name}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-6">

      {/* Enter phone */}
      {step === 'enter_phone' && (
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="text-6xl">📱</div>
            <h2 className="text-2xl font-black text-gray-800">Mi Código QR</h2>
            <p className="text-gray-500 text-sm">Ingresa tu número para ver tu QR de cliente</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Phone className="w-4 h-4" /> Tu número de teléfono
            </label>
            <div className="flex gap-2">
              <div className="flex gap-1">
                {COUNTRY_CODES.map(cc => (
                  <button key={cc.label}
                    onClick={() => setLada(cc.code)}
                    className={`px-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors
                      ${lada === cc.code ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {cc.flag} {cc.label}
                  </button>
                ))}
              </div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="6621234567"
                className="flex-1 border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-lg outline-none"
              />
            </div>
            <button
              disabled={phone.trim().length < 7}
              onClick={handleLookup}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white font-black py-3 rounded-xl transition-colors">
              Ver mi QR
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {step === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-700 animate-spin" />
          <p className="text-gray-600 font-semibold">Buscando tu cuenta...</p>
        </div>
      )}

      {/* Show QR */}
      {step === 'show' && client && (
        <div className="w-full max-w-xs space-y-5 text-center">
          <div>
            <h2 className="text-xl font-black text-gray-800">
              {client.first_name} {client.last_name}
            </h2>
            <p className="text-gray-500 text-sm">Muestra este QR en caja</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center gap-4">
            <QRCodeSVG
              value={qrValue}
              size={240}
              level="H"
              includeMargin={false}
            />
            <p className="text-xs text-gray-400 font-mono break-all">{qrValue}</p>
          </div>

          <button onClick={reset}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="w-full max-w-sm text-center space-y-5">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <p className="text-gray-700 font-semibold">{error}</p>
          <button onClick={reset}
            className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
