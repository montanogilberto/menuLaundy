import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10"></div>
      <div className="relative grid grid-cols-[14%_1fr_14%] items-center gap-8 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full"></div>
            <Sparkles className="relative w-20 h-20 text-cyan-400 drop-shadow-2xl" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-wide leading-none">GMO</h1>
            <span className="block text-2xl font-semibold opacity-90 tracking-wide">
              LAVANDERÍA • AUTO‑LAVADO
            </span>
          </div>
        </div>
        <div></div>
        <div className="justify-self-end bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-xl shadow-lg">
          Pantalla 50" • Modo Kiosko
        </div>
      </div>
    </header>
  );
}
