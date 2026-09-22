import { RewardsTier } from '../types';

interface Props {
  tiers: RewardsTier[];
  note?: string;
}

export default function RewardsSlide({ tiers, note }: Props) {
  return (
    <div className="flex flex-col h-full gap-4 md:gap-8">
      {/* Intro banner */}
      <div className="flex items-center gap-3 md:gap-5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl px-5 py-3 md:px-8 md:py-5 shadow-lg">
        <span className="text-4xl md:text-6xl">⭐</span>
        <div>
          <p className="text-slate-900 font-black text-xl md:text-3xl leading-tight">
            Acumula puntos con cada visita
          </p>
          <p className="text-slate-800 text-base md:text-xl font-semibold mt-0.5">
            y canjéalos por servicios gratis
          </p>
        </div>
      </div>

      {/* Tiers */}
      <div className="flex-1 grid grid-cols-3 gap-3 md:gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.label}
            className="flex flex-col items-center justify-center gap-2 md:gap-4 bg-gradient-to-b from-slate-900 to-blue-950 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl border-2 border-cyan-500/30 text-center"
          >
            <span className="text-5xl md:text-7xl">{tier.icon}</span>
            <span className="text-white font-black text-xl md:text-3xl tracking-wide">{tier.label}</span>
            <div className="bg-cyan-500 text-slate-900 font-black text-2xl md:text-4xl rounded-full w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-lg">
              {tier.pointsRequired}
            </div>
            <p className="text-cyan-200 text-sm md:text-lg font-semibold leading-snug">puntos</p>
            <p className="text-white text-sm md:text-xl font-bold leading-tight mt-1">{tier.benefit}</p>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      {note && (
        <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-5 py-3 md:px-8 md:py-4 border-l-4 border-cyan-500">
          <span className="text-2xl md:text-3xl">ℹ️</span>
          <p className="text-slate-700 text-base md:text-xl font-semibold">{note}</p>
        </div>
      )}
    </div>
  );
}
