import { cartOutline, walletOutline, gameControllerOutline, giftOutline, hardwareChipOutline } from 'ionicons/icons';
import { contactInfo } from './services';

const POS_URL = import.meta.env.VITE_POS_URL;
const STORE_WA = contactInfo.phone.replace(/\D/g, '');

export type GmoAppId = 'pos' | 'smartloans' | 'arcade' | 'rewards' | 'factory';

export interface GmoApp {
  id: GmoAppId;
  label: string;
  icon: string;
  /** Route inside this app; external apps use `href`. */
  route?: string;
  href?: string;
  isNew?: boolean;
}

/** Same apps, order, names and icons as the POS login (POSVending `src/utils/loginApps.ts`). */
export const LOGIN_APPS: readonly GmoApp[] = [
  { id: 'pos',        label: 'POS',                     icon: cartOutline,           href: `${POS_URL}/login?app=pos` },
  { id: 'smartloans', label: 'Préstamos GMO',           icon: walletOutline,         href: `${POS_URL}/login?app=smartloans`, isNew: true },
  { id: 'arcade',     label: 'Juegos Online',           icon: gameControllerOutline, href: `${POS_URL}/login?app=arcade`, isNew: true },
  // Zero-width space: lets the label wrap after the slash in a narrow tile.
  { id: 'rewards',    label: 'Puntos/​Recompensas', icon: giftOutline,           route: '/puntos' },
];

/** Five tiles fit a phone only with the short rewards label. Factory AI has no POS login. */
export const HEADER_APPS: readonly GmoApp[] = [
  ...LOGIN_APPS.map(app => (app.id === 'rewards' ? { ...app, label: 'Puntos' } : app)),
  {
    id: 'factory',
    label: 'Factory AI',
    icon: hardwareChipOutline,
    href: `https://wa.me/${STORE_WA}?text=${encodeURIComponent('Hola, quiero información sobre Factory AI Agents.')}`,
    isNew: true,
  },
];

export const POS_LOGIN_URL = `${POS_URL}/login?app=pos`;
