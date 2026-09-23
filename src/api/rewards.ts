import { get, post } from './client';

export const COMPANY_ID = 1;

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
  created_At: string;
}

export type RewardType = 'free_product' | 'discount_fixed' | string;

export type RewardsCatalogItem = CatalogItem; // backwards compat alias

export interface CatalogItem {
  catalogItemId: number;
  companyId: number;
  name: string;
  rewardType: RewardType;
  requiredPoints: number;
  freeProductId?: number;
  discountValue?: number;
  description?: string;
  isActive?: boolean;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function findClientByPhone(cellphone: string): Promise<ClientInfo | null> {
  const data: any = await get('/all_clients');
  let clients: ClientInfo[] = data?.result?.[0]?.clients ?? data?.clients ?? [];
  const digits = cellphone.replace(/\D/g, '');
  return (
    clients.find(c => {
      const stored = (c.cellphone ?? '').replace(/\D/g, '').replace(/^52/, '');
      const input  = digits.replace(/^52/, '');
      return stored === input || stored.endsWith(input) || input.endsWith(stored);
    }) ?? null
  );
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

export async function getCatalog(): Promise<CatalogItem[]> {
  const data: any = await post('/posRewardCatalogItems', {
    posRewardCatalogItems: [{ action: 0, companyId: COMPANY_ID, isActive: true }],
  });
  return data?.result?.[0]?.posRewardCatalogItems ?? [];
}
