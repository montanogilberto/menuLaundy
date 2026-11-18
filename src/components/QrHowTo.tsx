import { useState } from 'react';
import { ChevronDown, ScanLine, ShoppingBag, Wallet, ShieldAlert } from 'lucide-react';

const STEPS = [
  {
    icon: ShoppingBag,
    title: 'En caja',
    text: 'Muestra tu QR al cajero antes de pagar. Así acumulas puntos y sellos. Para usar una recompensa, dile cuál quieres canjear.',
  },
  {
    icon: ScanLine,
    title: 'En la lavadora o secadora',
    text: 'Acerca tu QR al lector de la máquina. El ciclo se cobra de tu saldo y arranca solo.',
  },
  {
    icon: Wallet,
    title: 'Recarga tu saldo',
    text: 'Con tarjeta en "Mis Puntos" (botón Recargar), en caja o por transferencia. Después de cada abono te llega tu ticket por WhatsApp o SMS.',
  },
  {
    icon: ShieldAlert,
    title: 'Tu QR es personal',
    text: 'Con él se cobra tu saldo: no lo compartas. Si crees que alguien más lo tiene, avísanos.',
  },
];

/** "¿Cómo funciona mi QR?" — the steps a customer needs, closed by default. */
export default function QrHowTo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="w-full bg-white rounded-2xl shadow text-left">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-[#1E3A8A] font-black"
      >
        ¿Cómo funciona mi QR?
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="px-4 pb-4 flex flex-col gap-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <span className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-slate-900 font-bold text-sm">{i + 1}. {title}</p>
                <p className="text-slate-600 text-sm leading-snug">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
