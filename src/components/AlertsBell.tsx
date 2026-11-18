import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Bell, Gift, Loader2, Star, Wallet, X, Ticket } from 'lucide-react';
import { useClientSession } from '../lib/clientSession';
import { loadClientAlerts, markSeen, readSeen, type AlertKind, type ClientAlert } from '../lib/clientAlerts';

const ICONS: Record<AlertKind, { Icon: typeof Bell; bg: string }> = {
  reward:  { Icon: Gift,   bg: 'bg-emerald-500' },
  balance: { Icon: Wallet, bg: 'bg-amber-500' },
  points:  { Icon: Star,   bg: 'bg-[#2563EB]' },
  redeem:  { Icon: Ticket, bg: 'bg-purple-500' },
};

const when = (at: number) => new Date(at).toLocaleString('es-MX', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

/** Header bell: a red dot only when there is something the customer hasn't seen. */
export default function AlertsBell({ iconClass = 'w-5 h-5 sm:w-6 sm:h-6' }: { iconClass?: string }) {
  const history = useHistory();
  const session = useClientSession();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<ClientAlert[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [unseen, setUnseen] = useState(false);

  const clientId = session?.clientId;

  useEffect(() => {
    setAlerts(null);
    setUnseen(false);
    if (!clientId) return;
    let alive = true;
    loadClientAlerts(clientId)
      .then(list => {
        if (!alive) return;
        setAlerts(list);
        const seen = readSeen(clientId);
        setUnseen(list.some(a => !seen.has(a.id)));
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [clientId]);

  const openPanel = () => {
    if (!clientId) { history.push('/login'); return; }
    setOpen(true);
    if (alerts) { markSeen(clientId, alerts); setUnseen(false); }
  };

  // Seen once the list arrives while the panel is open.
  useEffect(() => {
    if (open && clientId && alerts) { markSeen(clientId, alerts); setUnseen(false); }
  }, [open, clientId, alerts]);

  const go = (route: string) => { setOpen(false); history.push(route); };

  return (
    <>
      <button
        onClick={openPanel}
        aria-label={unseen ? 'Alertas (nuevas)' : 'Alertas'}
        className="relative p-1.5 sm:p-2 rounded-full text-white hover:bg-white/10 shrink-0"
      >
        <Bell className={iconClass} />
        {unseen && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-blue-700" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-start sm:justify-end sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Alertas"
            onClick={e => e.stopPropagation()}
            className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-4 flex flex-col gap-3 text-left"
          >
            <div className="flex items-center justify-between">
              <p className="text-slate-900 font-black text-lg">Alertas</p>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1"><X className="w-5 h-5" /></button>
            </div>

            {alerts === null && !failed ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Cargando alertas…
              </div>
            ) : failed ? (
              <p className="text-slate-500 text-sm py-6 text-center">No se pudieron cargar tus alertas. Intenta más tarde.</p>
            ) : alerts!.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No tienes alertas por ahora.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {alerts!.map(a => {
                  const { Icon, bg } = ICONS[a.kind];
                  return (
                    <li key={a.id}>
                      <button onClick={() => go(a.route)} className="w-full flex items-start gap-3 py-3 text-left">
                        <span className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-slate-900 font-bold text-sm">{a.title}</span>
                          {a.detail && <span className="block text-slate-500 text-sm leading-snug">{a.detail}</span>}
                          {a.at && <span className="block text-slate-400 text-xs mt-0.5">{when(a.at)}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-slate-400 text-xs">Los tickets de tus recargas te llegan por WhatsApp o SMS.</p>
          </div>
        </div>
      )}
    </>
  );
}
