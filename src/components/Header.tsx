import { useHistory } from 'react-router-dom';
import { Bell, LogIn, LogOut, User } from 'lucide-react';
import logo from '../assets/logo_white.jpeg';
import GmoAppTiles from './GmoAppTiles';
import { HEADER_APPS } from '../data/gmoApps';
import { useClientSession, clearClientSession } from '../lib/clientSession';

export default function Header() {
  const history = useHistory();
  const session = useClientSession();

  return (
    <header className="gmo-brand-bg flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 md:py-3 pt-[max(0.625rem,env(safe-area-inset-top))] flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Logo */}
          <img
            src={logo}
            alt="GMO Lavandería"
            className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain rounded-xl shrink-0"
          />

          {/* Brand */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-black text-base sm:text-xl md:text-2xl lg:text-3xl sm:tracking-wide uppercase leading-none">
              Lavandería Y<br className="sm:hidden" /> Auto&#8209;Servicio
            </h1>
            <p className="text-white/75 text-xs md:text-sm font-medium mt-0.5 hidden sm:block truncate">
              Blvd. Musaro 1 B, Nuevo Hermosillo · +52 662 651 3670
            </p>
          </div>

          {/* Apps (wide screens: same row) */}
          <GmoAppTiles apps={HEADER_APPS} className="hidden xl:grid grid-cols-5 w-[30rem] shrink-0" />

          {/* Alerts */}
          <button
            onClick={() => history.push(session ? '/puntos' : '/login')}
            aria-label="Alertas"
            className="relative p-2 rounded-full text-white hover:bg-white/10 shrink-0"
          >
            <Bell className="w-6 h-6" />
            {session && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-blue-700" />}
          </button>

          {/* User: greeting + Salir, or Entrar */}
          {session ? (
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex w-9 h-9 rounded-full bg-blue-400 items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block leading-tight max-w-[10rem]">
                <p className="text-white font-bold text-sm truncate">Hola, {session.first_name} 👋</p>
                <p className="text-white/75 text-xs">Cliente</p>
              </div>
              <button
                onClick={clearClientSession}
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold border border-white/30 rounded-lg px-2 py-1.5"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => history.push('/login')}
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-sm px-3 py-2 rounded-xl shadow shrink-0"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
          )}
        </div>

        {/* Apps (phone/tablet: own row) */}
        <GmoAppTiles apps={HEADER_APPS} className="xl:hidden grid-cols-5" />
      </div>
    </header>
  );
}
