import { post } from './client';
import { COMPANY_ID } from './rewards';

/** Tarjeta: cargo directo en la cuenta Stripe de la compañía, nunca en la plataforma. */
export interface TopUpIntent {
  clientSecret: string;
  paymentIntentId: string;
  stripeAccount?: string;
  canSaveCard?: boolean;
}

export interface TopUpResult {
  status: string;
  feeMXN?: number;
  netCreditedMXN?: number;
}

export interface TransferAccount { holderName: string; clabe: string; bankName?: string; terminalName?: string }

export async function getTopUpOptions(): Promise<{ card: boolean; transferAccount: TransferAccount | null }> {
  const data: any = await post('/companyPaymentAccounts/active', { companyId: COMPANY_ID, purpose: 'wallet_topup' });
  return { card: data?.cardTopUpAvailable === true, transferAccount: data?.transferAccount ?? null };
}

export async function getCompanyName(): Promise<string> {
  const data: any = await post('/one_companies', { companies: [{ companyId: COMPANY_ID }] });
  return (data?.result?.[0]?.companies?.[0] ?? data?.companies?.[0])?.name ?? '';
}

export function createTopUpIntent(clientId: number, amountMXN: number): Promise<TopUpIntent> {
  return post('/stripe/payment-intents', {
    companyId: COMPANY_ID, fromClientId: clientId, toClientId: clientId,
    amount: Math.round(amountMXN * 100), paymentType: 'laundry_top_up',
    description: `Recarga de saldo — ${amountMXN.toFixed(2)} MXN`,
  });
}

export function confirmTopUp(paymentIntentId: string, stripeAccount?: string): Promise<TopUpResult> {
  return post('/stripe/payment-intents/confirm', {
    paymentIntentId, companyId: COMPANY_ID, paymentType: 'laundry_top_up', stripeAccount,
  });
}

/** Después de pagar, el cliente decide si conserva la tarjeta. */
export function answerSaveCard(paymentIntentId: string, stripeAccount: string | undefined, save: boolean): Promise<unknown> {
  return post('/stripe/top-up/save-card', { companyId: COMPANY_ID, paymentIntentId, stripeAccount, save });
}
