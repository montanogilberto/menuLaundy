import { useState, useRef, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import ClientQrCode from '../components/ClientQrCode';
import QrHowTo from '../components/QrHowTo';
import AlertsBell from '../components/AlertsBell';
import { SUPPORT_WHATSAPP_URL } from '../data/services';
import {
  ArrowLeft, Phone, Search, Loader, LogOut,
  WashingMachine, Wind, Star, Gift,
  User, ChevronRight, ChevronDown, Headset,
  Receipt, Maximize2, X, Wallet,
} from 'lucide-react';
import {
  findClientByPhone, getBalance, getLedger, getCatalog, getProductCounts, getRedemptions, getLaundryBalance,
  ClientInfo, RewardsBalance, CatalogItem as RewardsCatalogItem, LedgerEntry, ProductCount, Redemption, StampCycle, stampUnits, stampCycles,
} from '../api/rewards';
import { useClientSession, saveClientSession, clearClientSession } from '../lib/clientSession';
import { getCompanyName, getTopUpOptions, type TransferAccount } from '../api/walletTopUp';
import TopUpSheet, { STRIPE_PK } from '../components/TopUpSheet';

interface Props { onBack: () => void; }

/** One stamp row (a cycle, or the whole card): N stamps → GRATIS, plus free units earned. */
function StampRow({ cycle }: { cycle: StampCycle }) {
  const ready = cycle.free > 0;
  // Past a full card, show this card's progress toward the next free unit.
  const filled = ready ? cycle.requiredUnits : cycle.unitsAvailable;
  return (
    <div className="flex flex-col gap-1.5">
      {cycle.label && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-slate-700 font-bold text-sm">{cycle.label}</p>
          <span className={`text-xs font-black shrink-0 ${ready ? 'text-green-600' : 'text-slate-500'}`}>
            {ready ? `${cycle.free} gratis` : `${cycle.unitsAvailable} / ${cycle.requiredUnits}`}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: cycle.requiredUnits }, (_, i) => (
          <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 ${i < filled ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white' : 'bg-white border-dashed border-slate-300 text-slate-300'}`}>
            {i < filled ? <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" /> : i + 1}
          </div>
        ))}
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center border-2 ${ready ? 'bg-green-500 border-green-500 text-white' : 'bg-amber-50 border-amber-300 text-amber-500'}`}>
          <Gift className="w-4 h-4" />
          <span className="text-[8px] font-black leading-none mt-0.5">GRATIS</span>
        </div>
        {!cycle.label && ready && <span className="text-green-600 text-xs font-black ml-1">{cycle.free} gratis</span>}
      </div>
    </div>
  );
}

/** One stamp card as a compact row (like the POS "Tarjetas de sellos"): a card with cycles
 *  opens into one stamp row per cycle; a card without cycles shows its bar inline. */
function StampCard({ name, cycles, open, onToggle }: {
  name: string; cycles: StampCycle[]; open: boolean; onToggle: () => void;
}) {
  const ready = cycles.filter(c => c.free > 0);
  if (!cycles.some(c => c.label)) {
    const c = cycles[0];
    const pct = c.requiredUnits > 0 ? Math.min(100, Math.round((c.unitsAvailable / c.requiredUnits) * 100)) : 0;
    return (
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-slate-800 font-black text-base min-w-0 break-words">{name}</p>
          <span className={`text-sm font-bold shrink-0 ${c.free > 0 ? 'text-green-600' : 'text-slate-500'}`}>
            {c.free > 0 ? `¡${c.free} gratis!` : `${c.unitsAvailable} / ${c.requiredUnits}`}
          </span>
        </div>
        <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${c.free > 0 ? 'bg-green-500' : 'bg-[#2563EB]'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  // Closed line: ready cycles, else the cycle closest to a free unit
  const best = cycles.reduce((b, c) => (c.requiredUnits - c.unitsAvailable < b.requiredUnits - b.unitsAvailable ? c : b), cycles[0]);
  const summary = ready.length > 0
    ? `¡Gratis! ${ready.map(c => c.label).join(', ')}`
    : best.unitsAvailable > 0 ? `${best.label} ${best.unitsAvailable} / ${best.requiredUnits}` : `0 / ${best.requiredUnits}`;
  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <p className="flex-1 min-w-0 text-slate-800 font-black text-base break-words">{name}</p>
        <span className={`text-sm font-bold text-right shrink-0 max-w-[50%] ${ready.length > 0 ? 'text-green-600' : 'text-slate-500'}`}>{summary}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {cycles.map(c => <StampRow key={c.key} cycle={c} />)}
        </div>
      )}
    </div>
  );
}

type Step = 'input' | 'loading' | 'result' | 'not_found' | 'error';

// Badge per ledger txType / redemption status (same labels as the POS client view)
const TX_BADGE: Record<string, { label: string; cls: string }> = {
  EARN:       { label: 'Ganados',   cls: 'bg-green-100 text-green-700' },
  REDEEM:     { label: 'Canjeados', cls: 'bg-blue-100 text-blue-700' },
  ADJUSTMENT: { label: 'Ajuste',    cls: 'bg-amber-100 text-amber-700' },
  EXPIRE:     { label: 'Expirado',  cls: 'bg-slate-100 text-slate-500' },
  applied:    { label: 'Canje aplicado', cls: 'bg-blue-100 text-blue-700' },
  cancelled:  { label: 'Canje cancelado', cls: 'bg-slate-100 text-slate-500' },
};
const LIST_PREVIEW = 5;

interface ActivityItem {
  id: string;
  date: string;
  points: number;
  positive: boolean;
  badge: string;
  description: string;
  isRedemption: boolean;
}

function fmt(n: number) { return n.toLocaleString('es-MX'); }
// Catalog names were typed with a deal suffix ("(3x1)", "(4x3)") that no longer matches the rule —
// drop it; stamp cards get their rule text from requiredUnits instead
function rewardName(item: RewardsCatalogItem) { return item.name.replace(/\s*\(\d+\s*x\s*\d+\)\s*$/i, ''); }
function fmtMXN(n: number) { return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }); }
// The backend stores UTC without a zone suffix
function asUtc(s: string) { return new Date(s.includes('Z') || s.includes('+') ? s : `${s}Z`); }
function fmtDate(s: string) {
  return asUtc(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
function fmtDateTime(s: string) {
  return `${fmtDate(s)} · ${asUtc(s).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function RewardsCheckPage({ onBack }: Props) {
  const [phone, setPhone]     = useState('');
  const [step, setStep]       = useState<Step>('input');
  const [client, setClient]   = useState<ClientInfo | null>(null);
  const [balance, setBalance] = useState<RewardsBalance | null>(null);
  const [ledger, setLedger]   = useState<LedgerEntry[]>([]);
  const [catalog, setCatalog]         = useState<RewardsCatalogItem[]>([]);
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [redemptions, setRedemptions]     = useState<Redemption[]>([]);
  const [wallet, setWallet]               = useState<number | null>(null);
  const [companyName, setCompanyName]     = useState('');
  const [canTopUp, setCanTopUp]           = useState(false);
  const [showTopUp, setShowTopUp]         = useState(false);
  const [transferAccount, setTransferAccount] = useState<TransferAccount | null>(null);
  const [topUpNote, setTopUpNote]         = useState('');
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  const [showAllActivity, setShowAllActivity]   = useState(false);
  const [openCards, setOpenCards]               = useState<Set<number>>(new Set());
  const [errMsg, setErrMsg]           = useState('');
  const [showQR, setShowQR]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const history  = useHistory();
  const session  = useClientSession();
  const { pathname } = useLocation();
  const pointsRef   = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const catalogRef  = useRef<HTMLDivElement>(null);

  // Dashboard shortcuts: jump to points / activity / rewards catalog further down the page
  const goTo = (target: 'points' | 'history' | 'catalog') => {
    const el = target === 'catalog' ? (catalogRef.current ?? pointsRef.current)
      : target === 'history' ? activityRef.current : pointsRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load the dashboard for a client found by phone or restored from the saved session
  const loadClient = async (lookup: () => Promise<ClientInfo | null>) => {
    setStep('loading');
    try {
      const [found, cat] = await Promise.all([
        lookup(),
        getCatalog().catch(() => [] as RewardsCatalogItem[]),
      ]);
      if (!found) { setStep('not_found'); return; }
      saveClientSession(found);
      // Each source fails on its own — one failing call must not blank the page
      const [bal, led, counts, reds, wal] = await Promise.all([
        getBalance(found.clientId).catch(() => null),
        getLedger(found.clientId).catch(() => [] as LedgerEntry[]),
        getProductCounts(found.clientId).catch(() => [] as ProductCount[]),
        getRedemptions(found.clientId).catch(() => [] as Redemption[]),
        getLaundryBalance(found.clientId).catch(() => null),
      ]);
      setClient(found); setBalance(bal); setLedger(led); setCatalog(cat); setProductCounts(counts);
      setRedemptions(reds); setWallet(wal);
      getCompanyName().then(setCompanyName).catch(() => {});
      getTopUpOptions().then((o) => { setCanTopUp(o.card && !!STRIPE_PK); setTransferAccount(o.transferAccount); }).catch(() => {});
      setStep('result');
    } catch (e: any) {
      setErrMsg(e?.message ?? 'Error de conexión'); setStep('error');
    }
  };

  const handleSearch = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return;
    loadClient(() => findClientByPhone(cleaned));
  };

  const clearView = () => {
    setPhone(''); setClient(null); setBalance(null); setLedger([]); setCatalog([]); setProductCounts([]);
    setRedemptions([]); setWallet(null); setShowAllPurchases(false); setShowAllActivity(false);
    setStep('input');
  };

  // Session started (here or on another tab) → open the dashboard; session ended → back to input
  useEffect(() => {
    if (session && session.clientId !== client?.clientId) {
      loadClient(async () => ({ ...session, companyId: 0 } as ClientInfo));
    } else if (!session && client) {
      clearView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.clientId]);

  // The Recompensas tab shows the same dashboard, opened at the rewards catalog
  useEffect(() => {
    if (step === 'result' && pathname === '/recompensas') {
      setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [step, pathname, catalog.length]);

  const handleReset = () => {
    clearClientSession();
    clearView();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const pts = balance?.balance ?? 0;
  const byNewest = (a: { date: string }, b: { date: string }) => asUtc(b.date).getTime() - asUtc(a.date).getTime();

  // Purchases = EARN rows tied to a ticket (same source as the POS client view)
  const purchases = ledger
    .filter(tx => tx.txType === 'EARN' && tx.referenceType === 'ticket' && tx.referenceId)
    .map(tx => ({ incomeId: tx.referenceId as number, date: tx.created_At, points: tx.points }))
    .sort(byNewest);

  // Ledger rows + redemptions; REDEEM ledger rows are skipped because the redemption row shows them
  const catalogName = new Map(catalog.map(i => [i.catalogItemId, rewardName(i)]));
  const activity: ActivityItem[] = [
    ...ledger.filter(tx => tx.txType !== 'REDEEM').map(tx => ({
      id: `tx-${tx.transactionId}`,
      date: tx.created_At,
      points: tx.points,
      positive: tx.txType !== 'EXPIRE' && tx.points >= 0,
      badge: tx.txType,
      description: tx.description || (tx.referenceType === 'ticket' ? `Ticket #${tx.referenceId}` : TX_BADGE[tx.txType]?.label ?? tx.txType),
      isRedemption: false,
    })),
    ...redemptions.map(r => ({
      id: `red-${r.redemptionId}`,
      date: r.created_At,
      points: r.pointsSpent,
      positive: false,
      badge: r.status,
      description: catalogName.get(r.catalogItemId) ?? `Recompensa #${r.catalogItemId}`,
      isRedemption: true,
    })),
  ].sort(byNewest);
  const appliedRedemptions = redemptions.filter(r => r.status === 'applied').length;

  const visiblePurchases = showAllPurchases ? purchases : purchases.slice(0, LIST_PREVIEW);
  const visibleActivity  = showAllActivity ? activity : activity.slice(0, LIST_PREVIEW);

  // Free services earned on stamp cards, counted per cycle: 4 Básico = 1 free Básico.
  const freeFor = (item: RewardsCatalogItem) => {
    if (item.rewardType !== 'free_product' || item.freeProductId == null || !stampUnits(item)) return 0;
    return stampCycles(item, productCounts).reduce((n, c) => n + c.free, 0);
  };
  const totalFree = catalog.reduce((n, item) => n + freeFor(item), 0);

  const isStampCard = (item: RewardsCatalogItem) => item.rewardType === 'free_product' && item.freeProductId != null;
  const stampItems  = catalog.filter(isStampCard);
  const pointItems  = catalog.filter(item => !isStampCard(item));
  // Every card shares the same rule today (4+1); say it once when that's true
  const stampRule   = new Set(stampItems.map(stampUnits)).size === 1 ? stampUnits(stampItems[0]) : null;
  const toggleCard  = (id: number) => setOpenCards(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // ── SHELL ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4fa]">

      {/* ── TOP NAV ── */}
      <div className="gmo-brand-bg px-3 sm:px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 sm:gap-3 shrink-0 sticky top-0 z-20">
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0">
            <WashingMachine className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div className="leading-none">
            <p className="text-white font-black text-xs sm:text-sm leading-tight">LAVANDERÍA Y<br/>AUTO-SERVICIO</p>
          </div>
        </div>
        {step === 'result' && client ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Soporte por WhatsApp" title="Soporte" className="text-white">
              <Headset className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <AlertsBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-white font-bold text-xs">Hola, {client.first_name} {client.last_name}</p>
                <p className="text-blue-300 text-[10px]">Cliente</p>
              </div>
            </div>
            <button onClick={handleReset} className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold border border-white/30 rounded-lg px-2 py-1">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        ) : (
          <p className="text-white font-black text-base">Mis Puntos</p>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto pb-6">

        {/* INPUT */}
        {step === 'input' && (
          <div className="max-w-md mx-auto flex flex-col items-center gap-5 sm:gap-6 pt-8 sm:pt-16 px-4 sm:px-6">
            <div className="text-6xl sm:text-7xl">📱</div>
            <div className="text-center">
              <h2 className="text-[#1E3A8A] font-black text-2xl sm:text-3xl">Consulta tus puntos</h2>
              <p className="text-slate-500 text-base mt-1">Ingresa tu número de teléfono</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="search"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ej. 6621234567"
                  autoFocus
                  className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-xl sm:text-2xl font-semibold text-slate-800 outline-none transition-colors shadow"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={phone.replace(/\D/g, '').length < 10}
                className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg sm:text-xl rounded-2xl py-3.5 sm:py-4 min-h-[52px] transition-all shadow-lg sm:hover:scale-105 active:scale-95"
              >
                <Search className="w-5 h-5" /> CONSULTAR
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 pt-16 sm:pt-24 px-4">
            <Loader className="w-12 h-12 sm:w-14 sm:h-14 animate-spin text-blue-600" />
            <p className="text-blue-700 text-lg sm:text-xl font-semibold text-center">Buscando tu cuenta…</p>
          </div>
        )}

        {/* NOT FOUND */}
        {step === 'not_found' && (
          <div className="max-w-md mx-auto text-center pt-8 sm:pt-16 flex flex-col items-center gap-4 sm:gap-5 px-4 sm:px-6">
            <div className="text-6xl sm:text-8xl">😕</div>
            <h2 className="text-[#1E3A8A] font-black text-2xl sm:text-3xl">No encontrado</h2>
            <p className="text-slate-500 text-lg break-words">No hallamos una cuenta con el número <strong>{phone}</strong>. Pregunta en caja para registrarte.</p>
            <button onClick={clearView} className="w-full sm:w-auto bg-[#2563EB] text-white font-black text-lg sm:text-xl rounded-2xl px-10 py-3.5 sm:py-4 hover:bg-blue-800 transition-all">
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center pt-8 sm:pt-16 flex flex-col items-center gap-4 sm:gap-5 px-4 sm:px-6">
            <div className="text-6xl sm:text-8xl">⚠️</div>
            <h2 className="text-[#1E3A8A] font-black text-2xl sm:text-3xl">Error de conexión</h2>
            <p className="text-red-500 break-words">{errMsg}</p>
            <button onClick={clearView} className="w-full sm:w-auto bg-[#2563EB] text-white font-black text-lg sm:text-xl rounded-2xl px-10 py-3.5 sm:py-4">Volver</button>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {step === 'result' && client && (
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">

            {/* Welcome hero */}
            <div className="bg-gradient-to-r from-[#1565c0] to-[#1E3A8A] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-4 shadow-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-400/30 rounded-full flex items-center justify-center shrink-0">
                <User className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-black text-2xl md:text-3xl break-words">¡Hola, {client.first_name}!</h2>
                <p className="text-blue-200 text-sm">Aquí tienes un resumen de tu actividad y puntos.</p>
              </div>
              <div className="bg-[#1E3A8A]/60 rounded-2xl px-4 py-3 text-center shrink-0 border border-white/20 w-full sm:w-auto flex sm:block items-center justify-between gap-2">
                <p className="text-yellow-300 font-bold text-xs uppercase tracking-wide">Mis Puntos</p>
                <div className="flex items-center gap-1 justify-center sm:my-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-black text-3xl">{fmt(pts)}</span>
                </div>
                <button onClick={() => goTo('points')} className="text-cyan-300 text-xs font-semibold flex items-center gap-0.5 sm:mx-auto">
                  Ver detalles <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {totalFree > 0 && (
                <button
                  onClick={() => goTo('catalog')}
                  className="basis-full flex items-center justify-between gap-2 bg-green-500 hover:bg-green-400 rounded-2xl px-4 py-3 text-left shadow"
                >
                  <span className="flex items-center gap-2 text-white font-black text-lg">
                    <Gift className="w-6 h-6" /> {fmt(totalFree)} {totalFree === 1 ? 'servicio gratis' : 'servicios gratis'}
                  </span>
                  <span className="text-white/90 text-sm font-bold flex items-center shrink-0">Ver <ChevronRight className="w-4 h-4" /></span>
                </button>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { icon: <WashingMachine className="w-7 h-7 text-white" />, bg: 'bg-blue-500',   label: 'Lavado',       sub: 'Solicita un servicio', onClick: () => history.push('/reservar?servicio=lavado') },
                { icon: <Wind className="w-7 h-7 text-white" />,          bg: 'bg-purple-500',  label: 'Secado',       sub: 'Solicita un servicio', onClick: () => history.push('/reservar?servicio=secado') },
                { icon: <Star className="w-7 h-7 text-white" />,          bg: 'bg-amber-400',   label: 'Mis Puntos',   sub: 'Ver y canjear', onClick: () => goTo('points') },
                { icon: <Gift className="w-7 h-7 text-white" />,          bg: 'bg-emerald-500', label: 'Recompensas',  sub: 'Tus beneficios', onClick: () => goTo('catalog') },
              ].map(({ icon, bg, label, sub, onClick }: { icon: JSX.Element; bg: string; label: string; sub: string; onClick?: () => void }) => (
                <button key={label} type="button" onClick={onClick} className="bg-white rounded-2xl p-3 flex sm:flex-col items-center gap-2.5 sm:gap-2 shadow text-left sm:text-center cursor-pointer hover:shadow-md active:scale-95 transition min-w-0">
                  <div className={`${bg} w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow shrink-0 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-7 sm:[&>svg]:h-7`}>{icon}</div>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-bold text-sm leading-tight">{label}</p>
                    <p className="text-slate-400 text-xs sm:text-[10px] leading-tight mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
            <div className="flex flex-col gap-3 sm:gap-4 min-w-0">

            {/* Laundry wallet: prepaid balance the washers charge */}
            <div className="bg-white rounded-2xl p-4 shadow flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-sm font-semibold">{companyName ? `Saldo ${companyName}` : 'Tu saldo'}</p>
                {wallet != null
                  ? <p className="text-slate-900 font-black text-3xl leading-tight">{fmtMXN(wallet)}</p>
                  : <p className="text-slate-400 text-sm">No se pudo cargar el saldo.</p>}
                <p className="text-slate-400 text-xs mt-0.5">
                  Recarga en caja{canTopUp && transferAccount ? ', con tarjeta o transferencia' : canTopUp ? ' o con tarjeta' : transferAccount ? ' o por transferencia' : ''}. Se usa al escanear tu QR en la máquina.
                </p>
                {topUpNote && <p className="text-green-700 text-xs font-semibold mt-1">{topUpNote}</p>}
              </div>
              <button onClick={() => setShowTopUp(true)} className="shrink-0 bg-green-500 text-white font-bold rounded-xl px-3 py-2 text-sm">
                Recargar
              </button>
            </div>

            {/* QR — near the top, like the POS client view */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap sm:flex-nowrap items-center gap-4">
              <button onClick={() => setShowQR(true)} className="shrink-0 mx-auto sm:mx-0 p-2 border border-slate-100 rounded-xl hover:opacity-80 transition-opacity">
                <ClientQrCode clientId={client.clientId} size={150} fgColor="#1E3A8A" level="M" />
              </button>
              <div className="flex-1 min-w-0 basis-full sm:basis-auto text-center sm:text-left">
                <p className="text-[#1E3A8A] font-black text-lg">Tu código QR</p>
                <p className="text-slate-500 text-sm mt-1">Muéstralo en caja para acumular o canjear puntos, o escanéalo en la lavadora.</p>
                <button
                  onClick={() => setShowQR(true)}
                  className="mt-3 w-full min-h-[44px] flex items-center justify-center gap-2 border-2 border-solid border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-black rounded-xl"
                >
                  <Maximize2 className="w-5 h-5" /> Mostrar grande
                </button>
              </div>
            </div>

            <QrHowTo />

            {/* Points summary */}
            <div ref={pointsRef} className="bg-white rounded-2xl shadow p-4 scroll-mt-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1E3A8A] font-black text-lg">Mis puntos</h3>
                <button onClick={() => goTo('catalog')} className="text-blue-600 text-sm font-bold flex items-center gap-1">
                  <Gift className="w-4 h-4" /> Recompensas
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Saldo de puntos',    value: fmt(pts), accent: true },
                  { label: 'Puntos ganados',     value: fmt(balance?.lifetimeEarned ?? 0) },
                  { label: 'Puntos canjeados',   value: fmt(balance?.lifetimeRedeemed ?? 0) },
                  { label: 'Compras con puntos', value: fmt(purchases.length) },
                  { label: 'Canjes',             value: fmt(appliedRedemptions) },
                  { label: 'Última actividad',   value: balance?.lastActivity ? fmtDate(balance.lastActivity) : '—' },
                ].map(k => (
                  <div key={k.label} className={`rounded-xl p-3 min-w-0 ${k.accent ? 'bg-blue-50' : 'bg-slate-50'}`}>
                    <p className={`font-black text-2xl leading-tight ${k.accent ? 'text-blue-600' : 'text-slate-800'}`}>{k.value}</p>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide leading-tight mt-1">{k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Catalog: stamp cards as compact rows, then points discounts */}
            {catalog.length > 0 && (
              <div ref={catalogRef} className="bg-white rounded-2xl shadow overflow-hidden scroll-mt-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[#1E3A8A] font-black text-lg">Catálogo de Recompensas</h3>
                </div>

                {stampItems.length > 0 && (
                  <>
                    <div className="px-4 pt-3">
                      <p className="text-slate-500 text-sm font-bold">Tarjetas de sellos</p>
                      {stampRule != null && (
                        <p className="text-slate-400 text-xs">Compra {stampRule} y llévate 1 más gratis. Cada tamaño cuenta por separado.</p>
                      )}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {stampItems.map(item => {
                        // An empty "no cycle" row is noise for the customer when the card has cycles.
                        const cycles = stampCycles(item, productCounts)
                          .filter((c, _, all) => c.label !== 'Sin ciclo registrado' || c.unitsAvailable > 0 || all.length === 1);
                        return (
                          <StampCard
                            key={item.catalogItemId}
                            name={rewardName(item).replace(/\s+gratis$/i, '')}
                            cycles={cycles}
                            open={openCards.has(item.catalogItemId)}
                            onToggle={() => toggleCard(item.catalogItemId)}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {pointItems.length > 0 && (
                  <>
                    <div className="px-4 pt-4 border-t border-slate-100">
                      <p className="text-slate-500 text-sm font-bold">Descuentos con puntos</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {pointItems.map(item => {
                        const current   = balance?.balance ?? 0;
                        const required  = item.requiredPoints;
                        const canRedeem = current >= required;
                        const pct       = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
                        return (
                          <div key={item.catalogItemId ?? item.name} className="px-4 py-3.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-slate-800 font-black text-base min-w-0 break-words">{rewardName(item)}</p>
                              <span className={`flex items-center gap-1 font-black text-sm px-2.5 py-1 rounded-lg shrink-0 text-white ${canRedeem ? 'bg-green-500' : 'bg-[#2563EB]'}`}>
                                <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />{fmt(required)} pts
                              </span>
                            </div>
                            {item.description && <p className="text-slate-500 text-sm mt-1">{item.description}</p>}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${canRedeem ? 'bg-green-500' : 'bg-[#2563EB]'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-sm font-bold shrink-0 ${canRedeem ? 'text-green-600' : 'text-slate-500'}`}>
                                {canRedeem ? '¡Disponible!' : `${fmt(current)} / ${fmt(required)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* How to redeem: the cashier applies it in the POS after scanning the client QR */}
                <div className="bg-blue-50 border-t border-blue-100 px-4 py-4">
                  <p className="text-[#1E3A8A] font-black text-base mb-2">¿Cómo canjear?</p>
                  <ol className="text-slate-600 text-sm space-y-1.5 mb-3">
                    <li><strong className="text-[#1E3A8A]">1.</strong> Ve a caja y di qué servicio gratis quieres usar.</li>
                    <li><strong className="text-[#1E3A8A]">2.</strong> Muestra tu código QR al cajero.</li>
                    <li><strong className="text-[#1E3A8A]">3.</strong> El cajero aplica tu recompensa y se descuenta de tu cuenta.</li>
                  </ol>
                  <button
                    onClick={() => setShowQR(true)}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black rounded-xl"
                  >
                    <Maximize2 className="w-5 h-5" /> Mostrar mi QR
                  </button>
                </div>
              </div>
            )}

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
                  <p className="text-[#1E3A8A] font-black text-xl sm:text-2xl text-center break-words">{client.first_name} {client.last_name}</p>
                  <p className="text-slate-400 text-sm">Cliente #{client.clientId}</p>
                </div>
                <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-[#1E3A8A]">
                  <ClientQrCode
                    clientId={client.clientId}
                    size={Math.min(window.innerWidth - 96, window.innerHeight - 320, 320)}
                    fgColor="#1E3A8A"
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

            </div>

            {/* Right column: purchases + points activity */}
            <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[#1E3A8A] font-black text-lg">Compras ({purchases.length})</h3>
                </div>
                {purchases.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">Sin compras registradas con puntos.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visiblePurchases.map(p => (
                      <div key={`${p.incomeId}-${p.date}`} className="flex items-center gap-3 px-4 py-3">
                        <Receipt className="w-6 h-6 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 font-semibold">Ticket #{p.incomeId}</p>
                          <p className="text-slate-400 text-sm">{fmtDateTime(p.date)}</p>
                        </div>
                        <span className="text-green-600 font-black shrink-0">+{fmt(p.points)} pts</span>
                      </div>
                    ))}
                  </div>
                )}
                {purchases.length > LIST_PREVIEW && (
                  <button onClick={() => setShowAllPurchases(v => !v)} className="w-full py-3 border-t border-slate-100 text-blue-600 text-sm font-bold">
                    {showAllPurchases ? 'Ver menos' : `Ver todas (${purchases.length})`}
                  </button>
                )}
              </div>

              <div ref={activityRef} className="bg-white rounded-2xl shadow overflow-hidden scroll-mt-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[#1E3A8A] font-black text-lg">Actividad de puntos</h3>
                </div>
                {activity.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">Sin movimientos de puntos.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visibleActivity.map(item => {
                      const badge = TX_BADGE[item.badge];
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          {item.isRedemption
                            ? <Gift className="w-6 h-6 text-blue-500 shrink-0" />
                            : <Receipt className="w-6 h-6 text-blue-500 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-semibold break-words">{item.description}</p>
                            <p className="text-slate-400 text-sm">{fmtDateTime(item.date)}</p>
                            {badge && <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md ${badge.cls}`}>{badge.label}</span>}
                          </div>
                          <span className={`font-black shrink-0 ${item.positive ? 'text-green-600' : 'text-red-500'}`}>
                            {item.positive ? '+' : '-'}{fmt(Math.abs(item.points))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {activity.length > LIST_PREVIEW && (
                  <button onClick={() => setShowAllActivity(v => !v)} className="w-full py-3 border-t border-slate-100 text-blue-600 text-sm font-bold">
                    {showAllActivity ? 'Ver menos' : `Ver todo (${activity.length})`}
                  </button>
                )}
              </div>
            </div>
            </div>

            {/* Promo footer banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
              <div className="text-3xl">🎁</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#1E3A8A] font-black text-sm">¡Gana más con cada servicio!</p>
                <p className="text-blue-400 text-xs">Tus puntos son la llave a grandes recompensas.</p>
              </div>
              <button onClick={() => goTo('catalog')} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center justify-center gap-1 shrink-0 w-full sm:w-auto">
                Ver catálogo <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        )}
      </div>

      {showTopUp && client && (
        <TopUpSheet
          clientId={client.clientId}
          card={canTopUp}
          transferAccount={transferAccount}
          onClose={() => setShowTopUp(false)}
          onDone={(message) => {
            setShowTopUp(false);
            setTopUpNote(message);
            getLaundryBalance(client.clientId).then(setWallet).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
