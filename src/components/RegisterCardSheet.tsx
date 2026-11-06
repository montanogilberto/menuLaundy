import { useEffect, useState } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, X } from 'lucide-react';
import { createCardSetup, getSavedCard, saveCard, type SavedCard } from '../api/walletTopUp';
import { getStripe } from './TopUpSheet';

function CardForm({ clientId, onSaved }: { clientId: number; onSaved: (card: SavedCard) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card || busy) return;
    setBusy(true);
    setError('');
    try {
      const { clientSecret } = await createCardSetup(clientId);
      const { error: failed, setupIntent } = await stripe.confirmCardSetup(clientSecret, { payment_method: { card } });
      if (failed) {
        setError(failed.message ?? 'No se pudo validar la tarjeta.');
        return;
      }
      onSaved(await saveCard(clientId, setupIntent?.id));
    } catch {
      setError('No se pudo registrar la tarjeta. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-slate-200 rounded-xl p-3">
        <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button onClick={submit} disabled={!stripe || busy}
        className="w-full bg-green-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex justify-center">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar tarjeta'}
      </button>
    </div>
  );
}

/** Registra o cambia la tarjeta del cliente. Guardarla no hace ningún cobro. */
export default function RegisterCardSheet({ clientId, onClose }: { clientId: number; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<SavedCard | null>(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    getSavedCard(clientId).then(setSaved).catch(() => {}).finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-slate-900 font-black text-lg">Registrar tarjeta</p>
          <button onClick={onClose} aria-label="Cerrar" className="p-1"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : saved && !replacing ? (
          <>
            <p className="text-slate-700">Tarjeta guardada: {saved.brand?.toUpperCase()} •••• {saved.last4}</p>
            <button onClick={() => setReplacing(true)} className="border border-slate-200 rounded-xl py-3 font-semibold">
              Registrar otra tarjeta
            </button>
          </>
        ) : (
          <Elements stripe={getStripe()} options={{ locale: 'es' }}>
            <CardForm clientId={clientId} onSaved={(card) => { setSaved(card); setReplacing(false); }} />
          </Elements>
        )}
      </div>
    </div>
  );
}
