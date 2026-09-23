import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { useClientSession } from '../lib/clientSession';

const REASONS: Record<string, string> = {
  '/puntos':      'para ver tus puntos',
  '/recompensas': 'para ver tus recompensas',
  '/reservar':    'para reservar un servicio',
  '/qr':          'para ver tu código QR',
};

/** Shows the login screen in place of the page until the customer logs in. */
export default function RequireLogin({ children }: { children: ReactNode }) {
  const session = useClientSession();
  const { pathname } = useLocation();
  if (!session) return <LoginPage reason={REASONS[pathname]} />;
  return <>{children}</>;
}
