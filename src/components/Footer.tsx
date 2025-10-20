import { extras } from '../data/services';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-950 to-slate-900 text-blue-100 px-8 py-6 overflow-hidden border-t-4 border-blue-500/20">
      <div className="flex items-center gap-4">
        <strong className="text-white text-lg whitespace-nowrap font-bold tracking-wide">
          EXTRAS OPCIONALES:
        </strong>
        <div className="ticker relative w-full overflow-hidden">
          <span className="marquee absolute left-full whitespace-nowrap text-lg font-medium">
            {extras}
          </span>
        </div>
      </div>
    </footer>
  );
}
