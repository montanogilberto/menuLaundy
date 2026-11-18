import { post } from './client';
import { COMPANY_ID } from './rewards';

// Soporte tab → the same LLM agent that answers the store's WhatsApp
// (LoanAgents_SmartLoans /support/whatsapp-reservations, via smartloans_backend
// modules/whatsappReservations.reply_to). The backend resolves the customer's
// phone and the company's WhatsApp channel from clientId, so the agent keeps one
// conversation per customer across WhatsApp and the app.
//
// Contract (POST /webSupportChat — to be built in smartloans_backend):
//   body:  { "webSupportChat": [{ "companyId": int, "clientId": int, "message": str }] }
//   200:   { "reply": str | null }
// Message text is customer content: never log it.

export class SupportChatUnavailable extends Error {}

export async function sendSupportMessage(clientId: number, message: string): Promise<string | null> {
  try {
    const data: any = await post('/webSupportChat', {
      webSupportChat: [{ companyId: COMPANY_ID, clientId, message }],
    });
    return data?.reply ?? null;
  } catch (e: any) {
    // 404/405: the endpoint isn't deployed yet
    if (/API 40[45]/.test(String(e?.message))) throw new SupportChatUnavailable();
    throw e;
  }
}
