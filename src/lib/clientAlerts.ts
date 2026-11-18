import {
  getCatalog, getLaundryBalance, getLedger, getProductCounts, getRedemptions, stampCycles,
  type CatalogItem,
} from '../api/rewards';

// The bell's alerts, built from what the customer's own account already returns.
// There is no per-customer notification list in the backend yet (the dispatcher
// log is staff-only), so top-up tickets keep arriving by WhatsApp / SMS only.

export type AlertKind = 'reward' | 'points' | 'redeem' | 'balance';

export interface ClientAlert {
  /** Stable while the alert means the same thing: the "new" dot compares ids. */
  id: string;
  kind: AlertKind;
  title: string;
  detail?: string;
  /** ms; null for standing alerts (reward ready, low balance). */
  at: number | null;
  /** In-app route to open. */
  route: string;
}

/** Cheapest machine cycle (Lavado Básico, $40): below it the QR can't start a wash. */
export const LOW_BALANCE_MXN = 40;
const RECENT_DAYS = 30;
const MAX_ALERTS = 15;

const asUtc = (s: string) => new Date(s.includes('Z') || s.includes('+') ? s : `${s}Z`).getTime();
const pts = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const rewardName = (item: CatalogItem) => item.name.replace(/\s*\(\d+\s*x\s*\d+\)\s*$/i, '');

export async function loadClientAlerts(clientId: number): Promise<ClientAlert[]> {
  // Each source can fail on its own; the bell shows what did load.
  const [ledger, redemptions, catalog, counts, balance] = await Promise.all([
    getLedger(clientId).catch(() => []),
    getRedemptions(clientId).catch(() => []),
    getCatalog().catch(() => []),
    getProductCounts(clientId).catch(() => []),
    getLaundryBalance(clientId).catch(() => null),
  ]);

  const standing: ClientAlert[] = [];
  for (const item of catalog) {
    if (item.rewardType !== 'free_product' || item.freeProductId == null) continue;
    const ready = stampCycles(item, counts).filter(c => c.free > 0);
    const free = ready.reduce((n, c) => n + c.free, 0);
    if (free === 0) continue;
    standing.push({
      id: `reward:${item.catalogItemId}:${free}`,
      kind: 'reward',
      title: `Tienes ${free} ${rewardName(item)}`,
      detail: [ready.some(c => c.label) ? ready.map(c => `${c.label} ×${c.free}`).join(' · ') : null, 'Canjéalo en caja con tu QR.']
        .filter(Boolean).join(' — '),
      at: null,
      route: '/recompensas',
    });
  }
  if (balance != null && balance < LOW_BALANCE_MXN) {
    standing.push({
      id: `balance:${Math.round(balance)}`,
      kind: 'balance',
      title: `Tu saldo es ${money(balance)}`,
      detail: 'Recarga para usar la lavadora o la secadora con tu QR.',
      at: null,
      route: '/puntos',
    });
  }

  const since = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const names = new Map(catalog.map(i => [i.catalogItemId, rewardName(i)]));
  const recent: ClientAlert[] = [
    ...ledger
      .filter(e => e.txType === 'EARN' && e.points > 0)
      .map(e => ({
        id: `points:${e.transactionId}`,
        kind: 'points' as const,
        title: `+${pts(e.points)} pts`,
        detail: e.description || 'Por tu compra',
        at: asUtc(e.created_At),
        route: '/puntos',
      })),
    ...redemptions
      .filter(r => r.status === 'applied')
      .map(r => ({
        id: `redeem:${r.redemptionId}`,
        kind: 'redeem' as const,
        title: `Canjeaste ${names.get(r.catalogItemId) ?? 'una recompensa'}`,
        detail: r.pointsSpent > 0 ? `-${pts(r.pointsSpent)} pts` : undefined,
        at: asUtc(r.created_At),
        route: '/puntos',
      })),
  ]
    .filter(a => a.at >= since)
    .sort((a, b) => b.at - a.at);

  return [...standing, ...recent].slice(0, MAX_ALERTS);
}

// "Seen" is a per-device convenience (localStorage): it only drives the red dot.
const seenKey = (clientId: number) => `gmo.alertsSeen.${clientId}`;

export function readSeen(clientId: number): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(clientId)) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function markSeen(clientId: number, alerts: ClientAlert[]) {
  try {
    localStorage.setItem(seenKey(clientId), JSON.stringify(alerts.map(a => a.id)));
  } catch { /* storage blocked: the dot just stays */ }
}
