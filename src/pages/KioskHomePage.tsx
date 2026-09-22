import { useState } from 'react';
import { Search, Receipt, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { slides } from '../data/services';
import { Service } from '../types';
import { findClientByPhone } from '../api/rewardsCheckApi';

type ReceiptStep = 'idle' | 'enter_id' | 'enter_phone' | 'loading' | 'error';

const wash    = slides.find(s => s.title.includes('LAVADO') && !s.title.includes('COMPLETO'));
const dry     = slides.find(s => s.title.includes('SECADO'));
const full    = slides.find(s => s.title.includes('COMPLETO'));

const SECTION_COLORS = {
  wash:     { header: 'from-blue-800 to-blue-950',       accent: 'bg-blue-700',    icon: '🫧' },
  dry:      { header: 'from-orange-700 to-orange-900',   accent: 'bg-orange-600',  icon: '🔥' },
  complete: { header: 'from-emerald-700 to-emerald-900', accent: 'bg-emerald-600', icon: '✅' },
};

function ServiceCard({ service, accentClass }: { service: Service; accentClass: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl px-5 py-4 shadow border border-slate-100">
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 font-black text-xl md:text-2xl leading-tight truncate">{service.name}</p>
        <p className="text-slate-500 text-sm md:text-base font-medium truncate">
          {service.max}{service.maxDescription ? ` · ${service.maxDescription}` : ''}
        </p>
      </div>
      <div className={`${accentClass} text-white font-black text-2xl md:text-3xl px-5 py-2 rounded-xl shadow whitespace-nowrap`}>
        {service.price}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  services: Service[];
  note?: string;
  note2?: string;
  colorKey: keyof typeof SECTION_COLORS;
}

function Section({ title, services, note, note2, colorKey }: SectionProps) {
  const c = SECTION_COLORS[colorKey];
  return (
    <div className="flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
      <div className={`bg-gradient-to-r ${c.header} px-6 py-4 flex items-center gap-3`}>
        <span className="text-3xl">{c.icon}</span>
        <h2 className="text-white font-black text-xl md:text-3xl tracking-widest uppercase">{title}</h2>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {services.map((s, i) => (
          <ServiceCard key={i} service={s} accentClass={c.accent} />
        ))}
      </div>
      {(note || note2) && (
        <div className="px-4 pb-4 flex flex-col gap-1">
          {note  && <p className="text-slate-500 text-sm md:text-base" dangerouslySetInnerHTML={{ __html: note  }} />}
          {note2 && <p className="text-slate-400 text-xs md:text-sm italic"   dangerouslySetInnerHTML={{ __html: note2 }} />}
        </div>
      )}
    </div>
  );
}

interface Props {
  onViewReceipt: (id: string) => void;
}

const COUNTRY_CODES = [
  { flag: '🇲🇽', label: 'MX', code: '+52' },
  { flag: '🇺🇸', label: 'US', code: '+1'  },
  { flag: '🇨🇦', label: 'CA', code: '+1'  },
];

export default function KioskHomePage({ onViewReceipt }: Props) {
  const [step, setStep]           = useState<ReceiptStep>('idle');
  const [receiptId, setReceiptId] = useState('');
  const [phone, setPhone]         = useState('');
  const [lada, setLada]           = useState('+52');
  const [errorMsg, setErrorMsg]   = useState('');

  const startFlow = () => {
    const id = receiptId.trim();
    if (id) setStep('enter_phone');
  };

  const verifyAndOpen = async () => {
    const id  = receiptId.trim();
    const tel = phone.trim();
    if (!id || !tel) return;
    setStep('loading');
    try {
      const client = await findClientByPhone(lada + tel);
      if (client) {
        setStep('idle');
        setReceiptId('');
        setPhone('');
        onViewReceipt(id);
      } else {
        setErrorMsg('Número no encontrado. Verifica e intenta de nuevo.');
        setStep('error');
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta más tarde.');
      setStep('error');
    }
  };

  const reset = () => { setStep('idle'); setReceiptId(''); setPhone(''); setLada('+52'); setErrorMsg(''); };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-100 to-blue-50 p-4 md:p-6 lg:p-8 flex flex-col gap-5">

      {/* Top banners row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rewards promo */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl px-5 py-4 shadow-lg border-2 border-yellow-300">
          <span className="text-3xl shrink-0">🎁</span>
          <div>
            <p className="text-slate-900 font-black text-lg md:text-xl leading-tight">
              ¡Acumula puntos con cada servicio!
            </p>
            <p className="text-slate-800/70 text-sm font-semibold mt-0.5">
              Presiona <strong>"Mis Puntos"</strong> para consultar tu saldo.
            </p>
          </div>
        </div>

        {/* Receipt lookup */}
        <div className="flex flex-col justify-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-lg border-2 border-slate-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-slate-800 font-black text-base md:text-lg">Ver mi Recibo</p>
          </div>

          {/* Step 1 — receipt number */}
          {(step === 'idle' || step === 'enter_id') && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={receiptId}
                  onChange={e => { setReceiptId(e.target.value); setStep('enter_id'); }}
                  onKeyDown={e => e.key === 'Enter' && startFlow()}
                  placeholder="Número de ticket — Ej. 4747"
                  className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl pl-7 pr-3 py-2.5 text-lg font-semibold text-slate-800 outline-none transition-colors"
                />
              </div>
              <button
                onClick={startFlow}
                disabled={!receiptId.trim()}
                className="flex items-center gap-1.5 bg-[#0a2d6e] hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 2 — phone verification */}
          {step === 'enter_phone' && (
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-sm">Ticket <strong>#{receiptId}</strong> — ingresa tu número de celular para verificar:</p>
              <div className="flex gap-2 flex-wrap">
                {/* Country / lada selector */}
                <div className="flex rounded-xl border-2 border-blue-300 overflow-hidden shrink-0">
                  {COUNTRY_CODES.map(c => (
                    <button
                      key={c.code + c.label}
                      onClick={() => setLada(c.code)}
                      className={`flex items-center gap-1 px-3 py-2.5 text-sm font-bold transition-colors ${lada === c.code ? 'bg-[#0a2d6e] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{c.flag}</span>
                      <span className="hidden sm:inline">{c.code}</span>
                    </button>
                  ))}
                </div>
                {/* Phone number */}
                <div className="relative flex-1 min-w-[140px]">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyAndOpen()}
                    placeholder="10 dígitos"
                    autoFocus
                    className="w-full border-2 border-blue-300 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-lg font-semibold text-slate-800 outline-none transition-colors"
                  />
                </div>
                <button onClick={verifyAndOpen} disabled={!phone.trim()}
                  className="flex items-center gap-1.5 bg-[#0a2d6e] hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0">
                  <Search className="w-4 h-4" /> Ver
                </button>
              </div>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600 text-sm self-start">
                ← Cancelar
              </button>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
              <button onClick={reset} className="text-blue-600 hover:underline text-sm font-semibold self-start">
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {wash?.services && (
          <Section title="Lavado"            services={wash.services} note={wash.note} note2={wash.note2} colorKey="wash"     />
        )}
        {dry?.services && (
          <Section title="Secado"            services={dry.services}  note={dry.note}                     colorKey="dry"      />
        )}
        {full?.services && (
          <Section title="Servicio Completo" services={full.services} note={full.note}                    colorKey="complete" />
        )}
      </div>
    </div>
  );
}
