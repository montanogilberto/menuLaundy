import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Phone, Search, Loader, Receipt, Gift, Star, Trophy, RotateCcw } from 'lucide-react';
import {
  findClientByPhone, getBalance, getLedger, getCatalog,
  ClientInfo, RewardsBalance, RewardsCatalogItem, LedgerEntry,
} from '../api/rewardsCheckApi';

interface Props { onBack: () => void; }

type Step = 'input' | 'loading' | 'result' | 'not_found' | 'error';

const TX_LABELS: Record<string, string> = {
  EARN: 'Puntos ganados',
  REDEEM: 'Canje',
  ADJUSTMENT: 'Ajuste',
  EXPIRE: 'Expiración',
};

function fmt(n: number) { return n.toLocaleString('es-MX'); }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tier helper ──────────────────────────────────────────────────────────────
function getTier(pts: number) {
  if (pts >= 20) return { label: 'Oro',       icon: '🥇', color: 'from-yellow-400 to-amber-500',   next: null };
  if (pts >= 10) return { label: 'Plata',     icon: '🥈', color: 'from-slate-300 to-slate-500',    next: { label: 'Oro',    need: 20 - pts } };
  if (pts >= 5)  return { label: 'Bronce',    icon: '🥉', color: 'from-amber-600 to-yellow-700',   next: { label: 'Plata',  need: 10 - pts } };
  return           { label: 'Sin nivel', icon: '⭐', color: 'from-blue-600 to-blue-800',      next: { label: 'Bronce', need: 5  - pts } };
}

// ── QR value: deep-link to the POSVending dashboard ─────────────────────────
function qrValue(clientId: number) {
  return `https://posvending.gmolavanderia.com/rewards-dashboard/${clientId}`;
}

export default function RewardsCheckPage({ onBack }: Props) {
  const [phone, setPhone]     = useState('');
  const [step, setStep]       = useState<Step>('input');
  const [client, setClient]   = useState<ClientInfo | null>(null);
  const [balance, setBalance] = useState<RewardsBalance | null>(null);
  const [ledger, setLedger]   = useState<LedgerEntry[]>([]);
  const [catalog, setCatalog] = useState<RewardsCatalogItem[]>([]);
  const [errMsg, setErrMsg]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return;
    setStep('loading');
    try {
      const [found, cat] = await Promise.all([
        findClientByPhone(cleaned),
        getCatalog().catch(() => [] as RewardsCatalogItem[]),
      ]);
      if (!found) { setStep('not_found'); return; }
      const [bal, led] = await Promise.all([
        getBalance(found.clientId).catch(() => null),
        getLedger(found.clientId).catch(() => [] as LedgerEntry[]),
      ]);
      setClient(found);
      setBalance(bal);
      setLedger(led);
      setCatalog(cat);
      setStep('result');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Error de conexión');
      setStep('error');
    }
  };

  const handleReset = () => {
    setPhone(''); setClient(null); setBalance(null); setLedger([]); setCatalog([]);
    setStep('input');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const pts   = balance?.balance ?? 0;
  const tier  = getTier(pts);
  const recent = ledger.slice(0, 8);
  const earnedThisMonth = ledger
    .filter(l => {
      const d = new Date(l.created_At);
      const now = new Date();
      return l.txType === 'EARN' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, l) => s + l.points, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-black/20">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-300 hover:text-white transition-colors font-semibold">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <h1 className="flex-1 text-center text-white font-black text-xl md:text-2xl tracking-wide">
          🎁 MIS PUNTOS DE RECOMPENSA
        </h1>
        {step === 'result' && (
          <button onClick={handleReset} className="flex items-center gap-1 text-cyan-300 hover:text-white transition-colors text-sm font-semibold">
            <RotateCcw className="w-4 h-4" /> Otro
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">

        {/* ── INPUT ── */}
        {step === 'input' && (
          <div className="max-w-md mx-auto flex flex-col items-center gap-6 pt-8">
            <div className="text-7xl">📱</div>
            <div className="text-center">
              <h2 className="text-white font-black text-3xl">Consulta tus puntos</h2>
              <p className="text-cyan-200 mt-1">Ingresa tu número de teléfono</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej. 6621234567"
                  autoFocus
                  className="w-full bg-white/15 text-white placeholder-white/30 border-2 border-white/20 focus:border-cyan-400 rounded-2xl pl-12 pr-4 py-4 text-2xl font-semibold outline-none transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={phone.replace(/\D/g, '').length < 10}
                className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-black text-xl rounded-2xl py-4 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Search className="w-5 h-5" /> CONSULTAR
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 pt-24 text-white">
            <Loader className="w-14 h-14 animate-spin text-cyan-400" />
            <p className="text-cyan-200 text-xl font-semibold">Buscando tu cuenta…</p>
          </div>
        )}

        {/* ── NOT FOUND ── */}
        {step === 'not_found' && (
          <div className="max-w-md mx-auto text-center pt-16 flex flex-col items-center gap-5">
            <div className="text-8xl">😕</div>
            <h2 className="text-white font-black text-3xl">No encontrado</h2>
            <p className="text-cyan-200 text-lg">No hallamos una cuenta con el número <strong className="text-white">{phone}</strong>. Pregunta en caja para registrarte.</p>
            <button onClick={handleReset} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xl rounded-2xl px-10 py-4 transition-all hover:scale-105">
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center pt-16 flex flex-col items-center gap-5">
            <div className="text-8xl">⚠️</div>
            <h2 className="text-white font-black text-3xl">Error de conexión</h2>
            <p className="text-red-300">{errMsg}</p>
            <button onClick={handleReset} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xl rounded-2xl px-10 py-4 transition-all hover:scale-105">
              Volver
            </button>
          </div>
        )}

        {/* ── RESULT DASHBOARD ── */}
        {step === 'result' && client && (
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* Client name */}
            <div className="text-center">
              <p className="text-cyan-300 text-sm font-semibold uppercase tracking-widest">Bienvenido/a</p>
              <h2 className="text-white font-black text-3xl md:text-4xl">{client.first_name} {client.last_name}</h2>
            </div>

            {/* Hero balance card */}
            <div className={`bg-gradient-to-br ${tier.color} rounded-3xl p-6 md:p-8 text-center shadow-2xl`}>
              <p className="text-slate-900/60 font-bold text-sm uppercase tracking-widest">Saldo disponible</p>
              <div className="text-slate-900 font-black text-8xl md:text-9xl leading-none my-1">{fmt(pts)}</div>
              <p className="text-slate-900/70 font-black text-2xl tracking-widest">PUNTOS</p>
              <p className="text-slate-900/50 font-semibold mt-1">+{fmt(earnedThisMonth)} este mes</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-3xl">{tier.icon}</span>
                <span className="text-slate-900 font-black text-xl">Nivel {tier.label}</span>
              </div>
              {tier.next && (
                <p className="text-slate-900/50 text-sm mt-1">
                  {tier.next.need} pts más para nivel {tier.next.label}
                </p>
              )}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-white font-black text-3xl">{fmt(balance?.lifetimeEarned ?? 0)}</p>
                <p className="text-cyan-200 text-sm font-semibold">Ganados · de por vida</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <Gift className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                <p className="text-white font-black text-3xl">{fmt(balance?.lifetimeRedeemed ?? 0)}</p>
                <p className="text-cyan-200 text-sm font-semibold">Canjeados · de por vida</p>
              </div>
            </div>

            {/* QR code */}
            <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-3 shadow-xl">
              <p className="text-slate-700 font-black text-lg">Tu código QR</p>
              <QRCodeSVG
                value={qrValue(client.clientId)}
                size={180}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin={false}
              />
              <p className="text-slate-500 text-xs text-center">
                Muéstralo en caja para acumular o canjear puntos rápidamente.
              </p>
            </div>

            {/* Catalog */}
            {catalog.length > 0 && (
              <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-white font-black text-lg">Catálogo de Recompensas</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {catalog.map(item => {
                    const canRedeem = (balance?.balance ?? 0) >= item.requiredPoints;
                    return (
                      <div key={item.catalogItemId ?? item.name} className="flex items-center gap-3 px-5 py-4">
                        <Gift className={`w-5 h-5 shrink-0 ${canRedeem ? 'text-green-400' : 'text-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold">{item.name}</p>
                          {item.description && <p className="text-cyan-300 text-sm">{item.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black text-lg ${canRedeem ? 'text-green-300' : 'text-slate-400'}`}>
                            {fmt(item.requiredPoints)} pts
                          </p>
                          {canRedeem && <p className="text-green-400 text-xs font-bold">¡Disponible!</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-cyan-300/60 text-xs text-center px-5 py-3">
                  Acércate a caja para canjear tus puntos.
                </p>
              </div>
            )}

            {/* Recent activity */}
            {recent.length > 0 && (
              <div className="bg-white/10 border border-white/15 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10">
                  <h3 className="text-white font-black text-lg">Actividad Reciente</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {recent.map(item => {
                    const positive = item.txType === 'EARN';
                    return (
                      <div key={item.transactionId} className="flex items-center gap-3 px-5 py-3">
                        <Receipt className={`w-4 h-4 shrink-0 ${positive ? 'text-green-400' : 'text-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{item.description || TX_LABELS[item.txType] || item.txType}</p>
                          <p className="text-slate-400 text-xs">{fmtDate(item.created_At)}</p>
                        </div>
                        <span className={`font-black text-base shrink-0 ${positive ? 'text-green-300' : 'text-red-300'}`}>
                          {positive ? '+' : '-'}{fmt(item.points)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
