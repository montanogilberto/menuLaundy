import { get, post } from './client';

export const COMPANY_ID = Number(import.meta.env.VITE_COMPANY_ID ?? 1);

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClientInfo {
  clientId: number;
  companyId: number;
  first_name: string;
  last_name: string;
  cellphone: string;
  email?: string;
  clientType?: string;
  qrBlobUrl?: string;
}

export interface RewardsBalance {
  clientId: number;
  companyId: number;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lastActivity?: string;
}

export type TxType = 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'EXPIRE';

export interface LedgerEntry {
  transactionId: number;
  clientId: number;
  txType: TxType;
  points: number;
  balanceAfter: number;
  description?: string;
  referenceType?: string | null;
  referenceId?: number | null;
  created_At: string;
}

export interface Redemption {
  redemptionId: number;
  catalogItemId: number;
  pointsSpent: number;
  status: 'applied' | 'cancelled' | string;
  incomeId?: number | null;
  created_At: string;
}

// posRewardCatalogItems holds every discount. The catalog read leaves out
// coupons (coupon_b2g1, typed at the register), so the kiosk sees stamp cards
// (free_product) and points rewards (discount_fixed / discount_pct).
export type RewardType = 'free_product' | 'discount_fixed' | 'discount_pct' | 'coupon_b2g1' | string;

export type RewardsCatalogItem = CatalogItem; // backwards compat alias

export interface CatalogItem {
  catalogItemId: number;
  companyId: number;
  name: string;
  rewardType: RewardType;
  requiredPoints: number;
  /** free_product: purchases of freeProductId per free unit */
  requiredUnits?: number | null;
  freeProductId?: number;
  discountValue?: number;
  description?: string;
  isActive?: boolean;
}

/** Purchases a stamp card needs. Rows saved before requiredUnits existed kept
 *  the unit count in requiredPoints. */
export const stampUnits = (item: CatalogItem): number =>
  Number(item.requiredUnits ?? item.requiredPoints) || 0;

export interface Company {
  companyId: number;
  name: string;
  businessType?: string;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const data: any = await get('/all_companies');
  return data?.result?.[0]?.companies ?? data?.companies ?? [];
}

/** /check_contact matches the stored value exactly, and stored phones come in these forms. */
function phoneForms(cellphone: string): string[] {
  const digits = cellphone.replace(/\D/g, '');
  const local = digits.slice(-10);
  return [...new Set([digits, `+${digits}`, local, `+52${local}`, `52${local}`])];
}

export async function findClientByPhone(cellphone: string): Promise<ClientInfo | null> {
  const matches: any[] = await Promise.all(
    phoneForms(cellphone).map(contact => post('/check_contact', { contact })),
  );
  // A contact can belong to a login with no client record: found, but no clientId.
  const client = matches.find(m => m?.found && m.clientId);
  if (!client) return null;
  return {
    clientId: client.clientId,
    companyId: client.companyId,
    first_name: client.firstName,
    last_name: client.lastName,
    cellphone: client.cellphone,
    email: client.email,
  };
}

export async function getBalance(clientId: number): Promise<RewardsBalance | null> {
  const data: any = await post('/posRewardBalances', {
    posRewardBalances: [{ action: 0, companyId: COMPANY_ID, clientId }],
  });
  return data?.result?.[0]?.posRewardBalances?.[0] ?? null;
}

export async function getLedger(clientId: number): Promise<LedgerEntry[]> {
  const data: any = await post('/posRewardTransactions', {
    posRewardTransactions: [{ action: 0, companyId: COMPANY_ID, clientId }],
  });
  return data?.result?.[0]?.posRewardTransactions ?? [];
}

export async function getRedemptions(clientId: number): Promise<Redemption[]> {
  const data: any = await post('/posRewardRedemptions', {
    posRewardRedemptions: [{ action: 0, companyId: COMPANY_ID, clientId }],
  });
  return data?.result?.[0]?.posRewardRedemptions ?? [];
}

/** Prepaid laundry balance (walletTransactions) — what the washers charge. */
export async function getLaundryBalance(clientId: number): Promise<number> {
  const data: any = await post('/ledger/balance', { companyId: COMPANY_ID, clientId });
  return Number(data?.availableBalance ?? 0);
}

export async function getCatalog(): Promise<CatalogItem[]> {
  const data: any = await post('/posRewardCatalogItems', {
    posRewardCatalogItems: [{ action: 0, companyId: COMPANY_ID, isActive: true }],
  });
  return data?.result?.[0]?.posRewardCatalogItems ?? [];
}

export interface ProductCount {
  productId: number;
  unitsPurchased: number;
  unitsConsumed: number;
  unitsAvailable: number;
}

export async function getProductCounts(clientId: number): Promise<ProductCount[]> {
  const data: any = await post('/posRewardProductCounts', {
    posRewardProductCounts: [{ companyId: COMPANY_ID, clientId }],
  });
  return data?.result?.[0]?.posRewardProductCounts ?? [];
}
