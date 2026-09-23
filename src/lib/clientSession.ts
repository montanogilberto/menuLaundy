import { useEffect, useState } from 'react';
import type { ClientInfo } from '../api/rewards';

// Remembers the customer on this device after they enter their phone once,
// so Mis Puntos, Recompensas, Mi QR, Reservar and receipts don't ask again.

const KEY     = 'gmo.clientSession';
const EVENT   = 'gmo:client-session';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface ClientSession {
  clientId:   number;
  first_name: string;
  last_name:  string;
  cellphone:  string;
  email?:     string;
  savedAt:    number;
}

export function getClientSession(): ClientSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ClientSession;
    if (!s?.clientId || Date.now() - s.savedAt > MAX_AGE) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveClientSession(c: ClientInfo) {
  const s: ClientSession = {
    clientId:   c.clientId,
    first_name: c.first_name,
    last_name:  c.last_name,
    cellphone:  c.cellphone,
    email:      c.email,
    savedAt:    Date.now(),
  };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

export function clearClientSession() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Current session, kept in sync across pages/tabs. */
export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(getClientSession);
  useEffect(() => {
    const sync = () => setSession(getClientSession());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return session;
}

/** Local 10-digit number from a stored cellphone (drops +52 / +1). */
export function localPhone(cellphone: string) {
  const d = cellphone.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}
