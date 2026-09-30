import { useHistory } from 'react-router-dom';
import { Bell, LogIn, LogOut, User } from 'lucide-react';
import logo from '../assets/logo_white.jpeg';
import { contactInfo } from '../data/services';
import { useClientSession, clearClientSession } from '../lib/clientSession';

const STORE_WA = contactInfo.phone.replace(/\D/g, '');
const waLink = (text: string) => `https://wa.me/${STORE_WA}?text=${encodeURIComponent(text)}`;

// Other GMO projects promoted from the header
const PROJECTS = [
  { key: 'arcade',     label: 'Arcade',     emoji: '🎮', bg: 'from-purple-500 to-fuchsia-600', href: 'https://posvending.gmolavanderia.com/arcade' },
  { key: 'smartloans', label: 'SmartLoans', emoji: '💵', bg: 'from-green-500 to-emerald-600', href: waLink('Hola, quiero información sobre SmartLoans (préstamos).') },
  { key: 'factory',    label: 'Factory AI', emoji: '🤖', bg: 'from-slate-500 to-slate-700',   href: waLink('Hola, quiero información sobre Factory AI Agents.') },
];

export default function Header() {
  const history = useHistory();
  const session = useClientSession();

  const projectIcons = (
    <nav aria-label="Otros proyectos GMO" className="flex items-center gap-2 sm:gap-3">
      {PROJECTS.map(p => (
        <a
          key={p.key}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-1 shrink-0"
        >
          <span className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${p.bg} flex items-center justify-center text-xl shadow-lg ring-2 ring-white/20 group-hover:ring-white/60 transition`}>
            {p.emoji}
            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-black leading-none px-1 py-0.5 rounded-full ring-2 ring-blue-950">
              NUEVO
            </span>
          </span>
          <span className="text-white/90 text-[11px] font-bold leading-none">{p.label}</span>
        </a>
      ))}
    </nav>
  );

  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 border-b-4 border-cyan-500 flex-shrink-0">
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
            <h1 className="text-white font-black text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-wide uppercase leading-none">
              Lavandería Y<br className="sm:hidden" /> Auto&#8209;Servicio
            </h1>
            <p className="text-blue-300 text-xs md:text-sm font-medium mt-0.5 hidden sm:block truncate">
              Blvd. Musaro 1 B, Nuevo Hermosillo · +52 662 651 3670
            </p>
          </div>

          {/* Projects (desktop: same row) */}
          <div className="hidden lg:block">{projectIcons}</div>

          {/* Alerts */}
          <button
            onClick={() => history.push(session ? '/puntos' : '/login')}
            aria-label="Alertas"
            className="relative p-2 rounded-full text-white hover:bg-white/10 shrink-0"
          >
            <Bell className="w-6 h-6" />
            {session && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-blue-950" />}
          </button>

          {/* User: greeting + Salir, or Entrar */}
          {session ? (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block leading-tight max-w-[10rem]">
                <p className="text-white font-bold text-sm truncate">Hola, {session.first_name} 👋</p>
                <p className="text-blue-300 text-xs">Cliente</p>
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

        {/* Projects (phone/tablet: own row) */}
        <div className="lg:hidden flex items-center justify-between gap-2 border-t border-white/10 pt-2">
          <p className="text-blue-200 text-xs font-bold leading-tight">
            Conoce nuestros<br />otros proyectos
          </p>
          {projectIcons}
        </div>
      </div>
    </header>
  );
}
