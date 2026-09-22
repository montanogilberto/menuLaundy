import { Star } from 'lucide-react';
import logo from '../assets/logo_white.jpeg';

interface Props {
  onRewardsClick?: () => void;
}

export default function Header({ onRewardsClick }: Props) {
  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 border-b-4 border-cyan-500 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center gap-4">
        {/* Logo */}
        <img
          src={logo}
          alt="GMO Lavandería"
          className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-xl shrink-0"
        />

        {/* Brand */}
        <div className="flex-1 min-w-0">

          <h1 className="text-white font-black text-xl md:text-3xl lg:text-4xl tracking-wide uppercase leading-none">
            Lavandería Y Auto-Lavado
          </h1>
          <p className="text-blue-300 text-xs md:text-sm font-medium mt-0.5 hidden sm:block">
            Blvd. Musaro 1 B, Nuevo Hermosillo · +52 662 651 3670
          </p>
        </div>

        {/* Rewards CTA */}
        {onRewardsClick && (
          <button
            onClick={onRewardsClick}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-900 font-black text-sm md:text-xl px-4 md:px-7 py-2 md:py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 border-2 border-yellow-200 whitespace-nowrap shrink-0"
          >
            <Star className="w-4 h-4 md:w-6 md:h-6 fill-current shrink-0" />
            <span>Mis Puntos</span>
          </button>
        )}
      </div>
    </header>
  );
}
