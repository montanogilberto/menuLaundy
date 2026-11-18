import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { ArrowLeft, Check, ChevronRight, Copy, CreditCard, Landmark, Loader2, MessageCircle, X } from 'lucide-react';
import { answerSaveCard, confirmTopUp, createTopUpIntent, type TopUpIntent, type TransferAccount } from '../api/walletTopUp';
import { contactInfo } from '../data/services';

export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';

const QUICK_AMOUNTS = [100, 200, 500];
const MIN_MXN = 20;
const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
// Vista previa: 3.6% + $3 + IVA. El backend acredita el neto real de Stripe.

const stripes = new Map<string, Promise<Stripe | null>>();
const getStripe = (account?: string) => {
  const key = account ?? '';
  if (!stripes.has(key)) stripes.set(key, loadStripe(STRIPE_PK, account ? { stripeAccount: account } : undefined));
  return stripes.get(key)!;
};

function PayForm({ amount, onPaid, onCharging }: {
  amount: number;
  onPaid: (id: string) => Promise<void>;
  onCharging: (charging: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pay = async () => {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError('');
    onCharging(true);
    // The Payment Element stays mounted until the charge has succeeded.
    const { error: failed, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    onCharging(false);
    if (failed) {
      setError(failed.message ?? 'No se pudo procesar el pago.');
      setBusy(false);
    } else if (paymentIntent?.status === 'succeeded') {
      await onPaid(paymentIntent.id);
    } else {
      setError('El pago quedó pendiente. Revisa tu app bancaria.');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button onClick={pay} disabled={!stripe || busy}
        className="w-full bg-green-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex justify-center">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pagar ${money(amount)}`}
      </button>
    </div>
  );
}

interface Props {
  clientId: number;
  onClose: () => void;
  onDone: (message: string) => void;
  /** Card top-up is on (company Stripe account active + publishable key). */
  card: boolean;
  /** The company account for top-ups by transfer, if it has one. */
  transferAccount: TransferAccount | null;
}

type Method = 'card' | 'transfer';

// Generic text: no name or phone in the link.
const RECEIPT_WA = `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, te envío mi comprobante de transferencia para recargar mi saldo.')}`;

/** Transfer details with a copy button for the CLABE and a WhatsApp link for the receipt. */
function TransferDetails({ account }: { account: TransferAccount }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.clabe);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the CLABE is still on screen */ }
  };
  const row = (label: string, value?: string) => value && (
    <p className="text-slate-500 text-sm">{label}: <span className="text-slate-900 font-semibold break-all">{value}</span></p>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
        {row('Titular', account.holderName)}
        {row('CLABE', account.clabe)}
        {row('Banco', account.bankName)}
      </div>
      <button onClick={copy} className="w-full border-2 border-solid border-[#2563EB] text-[#2563EB] font-bold rounded-xl py-3 flex items-center justify-center gap-2">
        {copied ? <><Check className="w-5 h-5" /> CLABE copiada</> : <><Copy className="w-5 h-5" /> Copiar CLABE</>}
      </button>
      <ol className="text-slate-600 text-sm flex flex-col gap-1 list-decimal pl-5">
        <li>Transfiere desde la app de tu banco a esta CLABE.</li>
        <li>Mándanos tu comprobante por WhatsApp (o muéstralo en caja).</li>
        <li>Al confirmarlo se abona a tu saldo y te llega tu ticket.</li>
      </ol>
      <a href={RECEIPT_WA} target="_blank" rel="noopener noreferrer"
        className="w-full bg-green-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2">
        <MessageCircle className="w-5 h-5" /> Enviar comprobante por WhatsApp
      </a>
    </div>
  );
}

/** Recarga de saldo con tarjeta: monto, comisión y neto, y luego el pago. */
export default function TopUpSheet({ clientId, onClose, onDone, card, transferAccount }: Props) {
  // Always start on the choice: both ways are always shown.
  const [method, setMethod] = useState<Method | null>(null);
  const [input, setInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [intent, setIntent] = useState<TopUpIntent | null>(null);
  const [error, setError] = useState('');
  // Closing now would unmount the Payment Element in the middle of the charge.
  const [charging, setCharging] = useState(false);
  // Set once paid when the client can keep the card: the sheet then asks.
  const [paid, setPaid] = useState<{ id: string; message: string } | null>(null);
  const [answering, setAnswering] = useState(false);

  const amount = Number(input) || 0;

  const start = async () => {
    if (amount < MIN_MXN || starting) return;
    setStarting(true);
    setError('');
    try {
      setIntent(await createTopUpIntent(clientId, amount));
    } catch {
      setError('No se pudo iniciar el pago. Intenta de nuevo.');
    } finally {
      setStarting(false);
    }
  };

  const onPaid = async (paymentIntentId: string) => {
    let message = 'Pago recibido. Tu saldo se actualizará en unos momentos.';
    try {
      const r = await confirmTopUp(paymentIntentId, intent?.stripeAccount);
      message = `Recarga exitosa: se abonaron ${money(r.netCreditedMXN ?? amount)}.`;
    } catch {
      // The charge already succeeded; the Stripe webhook credits the balance.
    }
    if (intent?.canSaveCard) setPaid({ id: paymentIntentId, message });
    else onDone(message);
  };

  const answer = async (save: boolean) => {
    if (!paid || answering) return;
    setAnswering(true);
    await answerSaveCard(paid.id, intent?.stripeAccount, save).catch(() => {});
    onDone(paid.message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            {method && !intent && !paid && (
              <button onClick={() => setMethod(null)} aria-label="Volver" className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
            )}
            <p className="text-slate-900 font-black text-lg truncate">
              {method === 'card' ? 'Pagar con tarjeta' : method === 'transfer' ? 'Recarga por transferencia' : 'Recargar saldo'}
            </p>
          </div>
          <button onClick={onClose} disabled={charging || !!paid} aria-label="Cerrar" className="p-1 disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        {method === null ? (
          <>
            <p className="text-slate-500 text-sm">¿Cómo quieres recargar?</p>
            {[
              { m: 'card' as Method, Icon: CreditCard, title: 'Tarjeta de débito o crédito', sub: 'Se abona al instante', on: card },
              { m: 'transfer' as Method, Icon: Landmark, title: 'Transferencia', sub: 'Se abona al confirmar tu comprobante', on: !!transferAccount },
            ].map(({ m, Icon, title, sub, on }) => (
              <button key={m} onClick={() => setMethod(m)} disabled={!on}
                className="w-full flex items-center gap-3 border border-slate-200 hover:border-[#2563EB] disabled:opacity-50 disabled:hover:border-slate-200 rounded-xl p-3 text-left">
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0"><Icon className="w-6 h-6" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-slate-900 font-bold">{title}</span>
                  <span className="block text-slate-500 text-sm">{on ? sub : 'No disponible por ahora'}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            ))}
          </>
        ) : method === 'transfer' && transferAccount ? (
          <TransferDetails account={transferAccount} />
        ) : paid ? (
          <>
            <p className="text-slate-700">{paid.message}</p>
            <p className="text-slate-900 font-bold">¿Guardar esta tarjeta para tus próximas recargas?</p>
            <button onClick={() => answer(true)} disabled={answering}
              className="w-full bg-green-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex justify-center">
              {answering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sí, guardar'}
            </button>
            <button onClick={() => answer(false)} disabled={answering}
              className="w-full border border-slate-200 rounded-xl py-3 font-semibold">No, gracias</button>
          </>
        ) : intent ? (
          <Elements stripe={getStripe(intent.stripeAccount)} options={{ clientSecret: intent.clientSecret, locale: 'es' }}>
            <PayForm amount={amount} onPaid={onPaid} onCharging={setCharging} />
          </Elements>
        ) : (
          <>
            <div className="flex gap-2">
              {QUICK_AMOUNTS.map((n) => (
                <button key={n} onClick={() => setInput(String(n))}
                  className="flex-1 border border-slate-200 rounded-xl py-2 font-semibold">{money(n)}</button>
              ))}
            </div>
            <input type="number" inputMode="decimal" min={MIN_MXN} value={input} placeholder="Otro monto"
              onChange={(e) => setInput(e.target.value)} className="border border-slate-200 rounded-xl p-3 text-base" />
            {amount >= MIN_MXN ? (
              <p className="text-slate-500 text-sm">
                Pagas {money(amount)} y se abonan <strong>{money(amount)}</strong> a tu saldo.
              </p>
            ) : (
              <p className="text-slate-400 text-sm">Monto mínimo: {money(MIN_MXN)}</p>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={start} disabled={amount < MIN_MXN || starting}
              className="w-full bg-green-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex justify-center">
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
