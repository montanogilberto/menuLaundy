import { useCallback, useEffect, useState } from 'react';
import { post } from '../api/client';
import { COMPANY_ID } from '../api/rewards';

// The signed value never changes for a client (it doesn't expire), so it is
// reused for the rest of the visit instead of asking the backend again.
const qrCache = new Map<number, string>();

/**
 * The client's signed QR (`GMO1.<companyId>.<clientId>.<firma>`) that the POS
 * scanner and the washers accept. The signature is an HMAC with a server-only
 * secret, so it always comes from the backend — never build it here.
 * While loading `qrValue` is null, so callers show a spinner, not a stale QR.
 */
export function useClientQr(clientId: number | undefined) {
  const [value, setValue]     = useState<string | null>(() => (clientId && qrCache.get(clientId)) || null);
  const [loading, setLoading] = useState(() => !!clientId && !qrCache.has(clientId));
  const [error, setError]     = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setError('');
    if (!clientId) { setValue(null); setLoading(false); return; }
    const cached = qrCache.get(clientId);
    if (cached) { setValue(cached); setLoading(false); return; }
    let cancelled = false;
    setValue(null);
    setLoading(true);
    post<{ clientQr?: string }>('/laundryDevices/clientQr', {
      laundryDevices: [{ companyId: COMPANY_ID, clientId }],
    })
      .then(res => {
        if (!res.clientQr) throw new Error('empty clientQr');
        qrCache.set(clientId, res.clientQr);
        if (!cancelled) setValue(res.clientQr);
      })
      .catch(() => { if (!cancelled) setError('No se pudo obtener tu código QR. Intenta de nuevo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, attempt]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);

  return { qrValue: value, loading, error, reload };
}
