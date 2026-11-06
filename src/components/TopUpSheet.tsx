import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Loader2, X } from 'lucide-react';
import { confirmTopUp, createTopUpIntent, type TopUpIntent } from '../api/walletTopUp';

export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';

const QUICK_AMOUNTS = [100, 200, 500];
const MIN_MXN = 20;
const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
// Vista previa: 3.6% + $3 + IVA. El backend acredita el neto real de Stripe.
const stripeFee = (n: number) => (n > 0 ? Math.round((n * 0.036 + 3) * 1.16 * 100) / 100 : 0);

const stripes = new Map<string, Promise<Stripe | null>>();
export const getStripe = (account?: string) => {
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
}

/** Recarga de saldo con tarjeta: monto, comisión y neto, y luego el pago. */
export default function TopUpSheet({ clientId, onClose, onDone }: Props) {
  const [input, setInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [intent, setIntent] = useState<TopUpIntent | null>(null);
  const [error, setError] = useState('');
  // Closing now would unmount the Payment Element in the middle of the charge.
  const [charging, setCharging] = useState(false);

  const amount = Number(input) || 0;
  const fee = stripeFee(amount);
  const net = Math.max(0, amount - fee);

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
    try {
      const r = await confirmTopUp(paymentIntentId, intent?.stripeAccount);
      onDone(`Recarga exitosa: se abonaron ${money(r.netCreditedMXN ?? net)}.`);
    } catch {
      onDone('Pago recibido. Tu saldo se actualizará en unos momentos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-slate-900 font-black text-lg">Recargar saldo</p>
          <button onClick={onClose} disabled={charging} aria-label="Cerrar" className="p-1 disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        {intent ? (
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
                Pagas {money(amount)} · Comisión Stripe {money(fee)} · Se abonan <strong>{money(net)}</strong>
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
