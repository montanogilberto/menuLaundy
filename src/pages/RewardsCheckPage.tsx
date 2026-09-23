import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Phone, Search, Loader, RotateCcw,
  WashingMachine, Wind, Star, Gift, History,
  Bell, User, Home, Grid3X3, ChevronRight,
  Receipt, Maximize2, X,
} from 'lucide-react';
import {
  findClientByPhone, getBalance, getLedger, getCatalog,
  ClientInfo, RewardsBalance, RewardsCatalogItem, LedgerEntry,
} from '../api/rewardsCheckApi';

interface Props { onBack: () => void; }
type Step = 'input' | 'loading' | 'result' | 'not_found' | 'error';
type Tab  = 'points' | 'history';

const TX_LABELS: Record<string, string> = {
  EARN: 'Puntos ganados', REDEEM: 'Canje', ADJUSTMENT: 'Ajuste', EXPIRE: 'Expiración',
};
function fmt(n: number) { return n.toLocaleString('es-MX'); }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

// tiers
const TIERS = [
  { label: 'Bronce', pts: 5  },
  { label: 'Plata',  pts: 10 },
  { label: 'Oro',    pts: 20 },
];
function nextTier(pts: number) {
  return TIERS.find(t => pts < t.pts) ?? null;
}
function tierProgress(pts: number) {
  const prev = [...TIERS].reverse().find(t => pts >= t.pts);
  const next = nextTier(pts);
  if (!next) return 100;
  const base = prev?.pts ?? 0;
  return Math.round(((pts - base) / (next.pts - base)) * 100);
}

export default function RewardsCheckPage({ onBack }: Props) {
  const [phone, setPhone]     = useState('');
  const [step, setStep]       = useState<Step>('input');
  const [tab, setTab]         = useState<Tab>('points');
  const [client, setClient]   = useState<ClientInfo | null>(null);
  const [balance, setBalance] = useState<RewardsBalance | null>(null);
  const [ledger, setLedger]   = useState<LedgerEntry[]>([]);
  const [catalog, setCatalog] = useState<RewardsCatalogItem[]>([]);
  const [errMsg, setErrMsg]   = useState('');
  const [showQR, setShowQR]   = useState(false);
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
      setClient(found); setBalance(bal); setLedger(led); setCatalog(cat);
      setStep('result');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Error de conexión'); setStep('error');
    }
  };

  const handleReset = () => {
    setPhone(''); setClient(null); setBalance(null); setLedger([]); setCatalog([]);
    setStep('input'); setTab('points');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const pts      = balance?.balance ?? 0;
  const progress = tierProgress(pts);
  const next     = nextTier(pts);
  const recent   = ledger.slice(0, 10);

  // ── SHELL ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4fa]">

      {/* ── TOP NAV ── */}
      <div className="bg-[#0a2d6e] px-3 sm:px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 sm:gap-3 shrink-0 sticky top-0 z-20">
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0">
            <WashingMachine className="w-5 h-5 text-[#0a2d6e]" />
          </div>
          <div className="leading-none">
            <p className="text-white font-black text-xs sm:text-sm leading-tight">LAVANDERÍA Y<br/>AUTO-LAVADO</p>
          </div>
        </div>
        {step === 'result' && client ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-white font-bold text-xs">Hola, {client.first_name} {client.last_name}</p>
                <p className="text-blue-300 text-[10px]">Cliente</p>
              </div>
            </div>
            <button onClick={handleReset} className="text-white/60 hover:text-white p-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-white font-black text-base">Mis Puntos</p>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">

        {/* INPUT */}
        {step === 'input' && (
          <div className="max-w-md mx-auto flex flex-col items-center gap-6 pt-16 px-6">
            <div className="text-7xl">📱</div>
            <div className="text-center">
              <h2 className="text-[#0a2d6e] font-black text-3xl">Consulta tus puntos</h2>
              <p className="text-slate-500 mt-1">Ingresa tu número de teléfono</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej. 6621234567"
                  autoFocus
                  className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-4 text-2xl font-semibold text-slate-800 outline-none transition-colors shadow"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={phone.replace(/\D/g, '').length < 10}
                className="flex items-center justify-center gap-2 bg-[#0a2d6e] hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xl rounded-2xl py-4 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Search className="w-5 h-5" /> CONSULTAR
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 pt-24">
            <Loader className="w-14 h-14 animate-spin text-blue-600" />
            <p className="text-blue-700 text-xl font-semibold">Buscando tu cuenta…</p>
          </div>
        )}

        {/* NOT FOUND */}
        {step === 'not_found' && (
          <div className="max-w-md mx-auto text-center pt-16 flex flex-col items-center gap-5 px-6">
            <div className="text-8xl">😕</div>
            <h2 className="text-[#0a2d6e] font-black text-3xl">No encontrado</h2>
            <p className="text-slate-500 text-lg">No hallamos una cuenta con el número <strong>{phone}</strong>. Pregunta en caja para registrarte.</p>
            <button onClick={handleReset} className="bg-[#0a2d6e] text-white font-black text-xl rounded-2xl px-10 py-4 hover:bg-blue-800 transition-all">
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center pt-16 flex flex-col items-center gap-5 px-6">
            <div className="text-8xl">⚠️</div>
            <h2 className="text-[#0a2d6e] font-black text-3xl">Error de conexión</h2>
            <p className="text-red-500">{errMsg}</p>
            <button onClick={handleReset} className="bg-[#0a2d6e] text-white font-black text-xl rounded-2xl px-10 py-4">Volver</button>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {step === 'result' && client && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">

            {/* Welcome hero */}
            <div className="bg-gradient-to-r from-[#1565c0] to-[#0a2d6e] rounded-3xl p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shadow-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-400/30 rounded-full flex items-center justify-center shrink-0">
                <User className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-black text-xl sm:text-2xl md:text-3xl break-words">¡Hola, {client.first_name}!</h2>
                <p className="text-blue-200 text-xs sm:text-sm">Aquí tienes un resumen de tu actividad y puntos.</p>
              </div>
              <div className="bg-[#0a2d6e]/60 rounded-2xl px-4 py-3 text-center shrink-0 border border-white/20 w-full sm:w-auto flex sm:block items-center justify-between gap-2">
                <p className="text-yellow-300 font-bold text-xs uppercase tracking-wide">Mis Puntos</p>
                <div className="flex items-center gap-1 justify-center sm:my-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-black text-3xl">{fmt(pts)}</span>
                </div>
                <button className="text-cyan-300 text-xs font-semibold flex items-center gap-0.5 sm:mx-auto">
                  Ver detalles <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { icon: <WashingMachine className="w-7 h-7 text-white" />, bg: 'bg-blue-500',   label: 'Lavado',       sub: 'Solicita un servicio' },
                { icon: <Wind className="w-7 h-7 text-white" />,          bg: 'bg-purple-500',  label: 'Secado',       sub: 'Solicita un servicio' },
                { icon: <Star className="w-7 h-7 text-white" />,          bg: 'bg-amber-400',   label: 'Mis Puntos',   sub: 'Ver y canjear' },
                { icon: <Gift className="w-7 h-7 text-white" />,          bg: 'bg-emerald-500', label: 'Recompensas',  sub: 'Tus beneficios' },
              ].map(({ icon, bg, label, sub }) => (
                <div key={label} className="bg-white rounded-2xl p-2 sm:p-3 flex flex-col items-center gap-1.5 sm:gap-2 shadow text-center cursor-pointer hover:shadow-md transition-shadow min-w-0">
                  <div className={`${bg} w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-7 sm:[&>svg]:h-7`}>{icon}</div>
                  <p className="text-slate-800 font-bold text-[10.5px] sm:text-sm leading-tight tracking-tight sm:tracking-normal whitespace-nowrap">{label}</p>
                  <p className="hidden sm:block text-slate-400 text-[10px] leading-tight">{sub}</p>
                </div>
              ))}
            </div>

            {/* Services status + promo banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#0a2d6e] font-black text-base">Estado de tus servicios</h3>
                  <button className="text-blue-600 text-xs font-semibold flex items-center gap-0.5">
                    Ver historial <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                  <WashingMachine className="w-10 h-10 text-blue-400" />
                  <p className="text-blue-700 font-bold text-sm">No tienes servicios en proceso</p>
                  <p className="text-blue-400 text-xs">¡Programa tu próximo lavado o secado!</p>
                  <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 mt-1">
                    Nuevo servicio <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Promo */}
              <div className="bg-gradient-to-br from-[#0a2d6e] to-[#1565c0] rounded-2xl p-5 shadow flex flex-col justify-between relative overflow-hidden">
                <div className="text-3xl sm:text-4xl mb-2">🎁✨</div>
                <div>
                  <p className="text-white font-black text-lg sm:text-xl leading-tight">Canjea tus puntos<br/>en grandes beneficios</p>
                  <button className="mt-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1">
                    Ver recompensas <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Points / History tabs */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="flex border-b border-slate-100">
                {(['points', 'history'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-3 font-bold text-sm transition-colors ${tab === t ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-400'}`}
                  >
                    {t === 'points' ? 'Tus puntos' : 'Historial'}
                  </button>
                ))}
              </div>

              {tab === 'points' && (
                <div className="p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-black text-2xl">{fmt(pts)}</p>
                    <p className="text-slate-500 text-sm">Puntos acumulados</p>
                    <div className="mt-2 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      {next ? `${progress}% para tu próxima recompensa (nivel ${next.label})` : '¡Nivel máximo alcanzado! 🥇'}
                    </p>
                  </div>
                  <button className="text-blue-600 text-xs font-bold text-center sm:text-right shrink-0 leading-tight w-full sm:w-auto border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                    Ver catálogo<br className="hidden sm:block"/> de recompensas <ChevronRight className="w-3 h-3 inline" />
                  </button>
                </div>
              )}

              {tab === 'history' && (
                <div className="divide-y divide-slate-50">
                  {recent.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-6">Sin actividad todavía.</p>
                  )}
                  {recent.map(item => {
                    const positive = item.txType === 'EARN';
                    return (
                      <div key={item.transactionId} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${positive ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Receipt className={`w-4 h-4 ${positive ? 'text-green-600' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-semibold truncate">{item.description || TX_LABELS[item.txType] || item.txType}</p>
                          <p className="text-slate-400 text-xs">{fmtDate(item.created_At)}</p>
                        </div>
                        <span className={`font-black text-base shrink-0 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                          {positive ? '+' : '-'}{fmt(item.points)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Catalog */}
            {catalog.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[#0a2d6e] font-black text-base">Catálogo de Recompensas</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {catalog.map(item => {
                    const canRedeem = (balance?.balance ?? 0) >= item.requiredPoints;
                    return (
                      <div key={item.catalogItemId ?? item.name} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${canRedeem ? 'bg-green-100' : 'bg-slate-100'}`}>
                          <Gift className={`w-5 h-5 ${canRedeem ? 'text-green-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 font-bold text-sm break-words">{item.name}</p>
                          {item.description && <p className="text-slate-400 text-xs truncate">{item.description}</p>}
                          <p className="text-blue-600 text-xs font-semibold">{fmt(item.requiredPoints)} puntos</p>
                        </div>
                        {canRedeem && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shrink-0">¡Disponible!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-slate-400 text-xs text-center px-4 py-3">Acércate a caja para canjear tus puntos.</p>
              </div>
            )}

            {/* QR */}
            <div className="bg-white rounded-2xl shadow p-5 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full">
                <p className="text-[#0a2d6e] font-black text-base">Tu código QR</p>
                <button
                  onClick={() => setShowQR(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 rounded-lg px-2.5 py-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Mostrar grande
                </button>
              </div>
              <button onClick={() => setShowQR(true)} className="hover:opacity-80 transition-opacity">
                <QRCodeSVG
                  value={`CLIENT:${client.clientId}:${client.first_name} ${client.last_name}`}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0a2d6e"
                  level="M"
                />
              </button>
              <p className="text-slate-400 text-xs text-center">Toca el QR o "Mostrar grande" para escanearlo en caja.</p>
            </div>

            {/* Fullscreen QR modal */}
            {showQR && (
              <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4 sm:gap-6 px-6 py-[max(4rem,env(safe-area-inset-top))] overflow-y-auto">
                <button
                  onClick={() => setShowQR(false)}
                  className="absolute top-[max(1.25rem,env(safe-area-inset-top))] right-5 bg-slate-100 hover:bg-slate-200 rounded-full p-3"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[#0a2d6e] font-black text-xl sm:text-2xl text-center break-words">{client.first_name} {client.last_name}</p>
                  <p className="text-slate-400 text-sm">Cliente #{client.clientId}</p>
                </div>
                <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-[#0a2d6e]">
                  <QRCodeSVG
                    value={`CLIENT:${client.clientId}:${client.first_name} ${client.last_name}`}
                    size={Math.min(window.innerWidth - 96, window.innerHeight - 320, 320)}
                    bgColor="#ffffff"
                    fgColor="#0a2d6e"
                    level="H"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-slate-700 font-bold text-lg">
                    {balance?.balance ?? 0} <span className="text-amber-500">★</span> puntos
                  </p>
                  <p className="text-slate-400 text-sm text-center">Muestra este código en caja para acumular o canjear puntos.</p>
                </div>
                <p className="text-slate-300 text-xs font-mono break-all text-center max-w-xs">
                  posvending.gmolavanderia.com/rewards-dashboard/{client.clientId}
                </p>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-[#0a2d6e] font-black text-base">Accesos rápidos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-3">
                {[
                  { icon: '💵', bg: 'bg-green-500',  label: 'Prestamista',      sub: 'Conecta, financia, haz crecer.' },
                  { icon: '👤', bg: 'bg-blue-500',   label: 'Solicita tu Préstamo',  sub: 'Tu proyecto, nuestra prioridad.' },
                  { icon: '🎮', bg: 'bg-purple-500', label: 'Arcade (Casino)',   sub: 'Juega, gana, disfruta.' },
                  { icon: '🤖', bg: 'bg-slate-600',  label: 'Factory Software',  sub: 'Tu idea, nuestro código.' },
                ].map(({ icon, bg, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-bold text-sm leading-tight">{label}</p>
                      <p className="text-slate-400 text-xs leading-tight">{sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Promo footer banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
              <div className="text-3xl">🎁</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0a2d6e] font-black text-sm">¡Gana más con cada servicio!</p>
                <p className="text-blue-400 text-xs">Tus puntos son la llave a grandes recompensas.</p>
              </div>
              <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center justify-center gap-1 shrink-0 w-full sm:w-auto">
                Ver catálogo <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ── BOTTOM NAV (dashboard only) ── */}
      {step === 'result' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a2d6e] border-t border-blue-800 flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-10">
          {[
            { icon: <Home className="w-5 h-5" />,    label: 'Inicio',    active: true  },
            { icon: <Grid3X3 className="w-5 h-5" />, label: 'Servicios', active: false },
            { icon: <Star className="w-5 h-5" />,    label: 'Mis Puntos',active: false },
            { icon: <User className="w-5 h-5" />,    label: 'Perfil',    active: false },
          ].map(({ icon, label, active }) => (
            <button key={label} className={`flex-1 flex flex-col items-center gap-1 py-1 min-h-[44px] transition-colors ${active ? 'text-white' : 'text-blue-400'}`}>
              {icon}
              <span className="text-[10px] font-semibold">{label}</span>
              {active && <div className="w-1 h-1 bg-white rounded-full" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
