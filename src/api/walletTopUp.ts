import { post } from './client';
import { COMPANY_ID } from './rewards';

/** Tarjeta: cargo directo en la cuenta Stripe de la compañía, nunca en la plataforma. */
export interface TopUpIntent {
  clientSecret: string;
  paymentIntentId: string;
  stripeAccount?: string;
}

export interface TopUpResult {
  status: string;
  feeMXN?: number;
  netCreditedMXN?: number;
}

export async function isCardTopUpAvailable(): Promise<boolean> {
  const data: any = await post('/companyPaymentAccounts/active', { companyId: COMPANY_ID, purpose: 'wallet_topup' });
  return data?.cardTopUpAvailable === true;
}

export async function getCompanyName(): Promise<string> {
  const data: any = await post('/one_companies', { companies: [{ companyId: COMPANY_ID }] });
  return (data?.result?.[0]?.companies?.[0] ?? data?.companies?.[0])?.name ?? '';
}

export interface SavedCard { stripePaymentMethodId?: string; brand?: string; last4?: string }

export async function getSavedCard(clientId: number): Promise<SavedCard | null> {
  const data: any = await post('/automated-payments/saved-method', { clientId, companyId: COMPANY_ID });
  return data?.paymentMethod?.stripePaymentMethodId ? data.paymentMethod : null;
}

export function createCardSetup(clientId: number): Promise<{ clientSecret: string }> {
  return post('/automated-payments/setup-intent', { clientId, companyId: COMPANY_ID });
}

export async function saveCard(clientId: number, setupIntentId?: string): Promise<SavedCard> {
  const data: any = await post('/automated-payments/save-method', { clientId, companyId: COMPANY_ID, setupIntentId });
  return data.paymentMethod;
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
