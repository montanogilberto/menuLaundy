const API_BASE = import.meta.env.VITE_API_URL ?? 'https://smartloansbackend.azurewebsites.net';
const COMPANY_ID = 1;

export interface ClientInfo {
  clientId: number;
  first_name: string;
  last_name: string;
  cellphone: string;
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

export interface RewardsCatalogItem {
  catalogItemId?: number;
  companyId: number;
  name: string;
  requiredPoints: number;
  description?: string;
  isActive?: boolean;
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function findClientByPhone(cellphone: string): Promise<ClientInfo | null> {
  const res = await fetch(`${API_BASE}/all_clients`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data: any = await res.json();
  let clients: ClientInfo[] = [];
  if (data?.result?.[0]?.clients) clients = data.result[0].clients;
  else if (Array.isArray(data?.clients)) clients = data.clients;

  const digits = cellphone.replace(/\D/g, '');
  return clients.find((c) => {
    const stored = (c.cellphone ?? '').replace(/\D/g, '');
    return stored === digits || stored.endsWith(digits) || digits.endsWith(stored);
  }) ?? null;
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

export async function getCatalog(): Promise<RewardsCatalogItem[]> {
  const data: any = await post('/posRewardCatalogItems', {
    posRewardCatalogItems: [{ action: 0, companyId: COMPANY_ID, isActive: true }],
  });
  return data?.result?.[0]?.posRewardCatalogItems ?? [];
}
