import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import type { GmoApp, GmoAppId } from '../data/gmoApps';

interface Props {
  apps: readonly GmoApp[];
  /** The app the person is in: drawn as the white tile, like the POS login. */
  active?: GmoAppId;
  className?: string;
}

const TILE = 'relative flex flex-col items-center justify-center gap-1 min-h-16 min-w-0 rounded-2xl px-0.5 sm:px-1 py-2 text-center text-[10px] sm:text-[11px] font-semibold leading-tight transition-colors';
const IDLE = `${TILE} bg-white/10 hover:bg-white/20 text-white/90`;

function TileContent({ app }: { app: GmoApp }) {
  return (
    <>
      <IonIcon icon={app.icon} aria-hidden="true" className="text-[22px] shrink-0" />
      <span className="max-w-full">{app.label}</span>
      {app.isNew && (
        <span className="absolute -top-1.5 right-0 bg-red-500 text-white text-[8px] font-black leading-none px-1 py-0.5 rounded-full">
          NUEVO
        </span>
      )}
    </>
  );
}

/** The GMO apps as tiles, matching the app picker on the POS login. */
export default function GmoAppTiles({ apps, active, className = '' }: Props) {
  const history = useHistory();

  return (
    <nav aria-label="Apps GMO" className={`grid gap-2 ${className}`}>
      {apps.map(app => {
        if (app.id === active) {
          return (
            <div key={app.id} aria-current="page" className={`${TILE} bg-white text-gray-900 shadow-lg`}>
              <TileContent app={app} />
            </div>
          );
        }
        if (app.route) {
          return (
            <button key={app.id} type="button" onClick={() => history.push(app.route!)} className={IDLE}>
              <TileContent app={app} />
            </button>
          );
        }
        return (
          <a key={app.id} href={app.href} target="_blank" rel="noopener noreferrer" className={IDLE}>
            <TileContent app={app} />
          </a>
        );
      })}
    </nav>
  );
}
