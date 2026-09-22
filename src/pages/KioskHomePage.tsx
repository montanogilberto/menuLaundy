import { slides } from '../data/services';
import { Service } from '../types';

const wash    = slides.find(s => s.title.includes('LAVADO') && !s.title.includes('COMPLETO'));
const dry     = slides.find(s => s.title.includes('SECADO'));
const full    = slides.find(s => s.title.includes('COMPLETO'));

const SECTION_COLORS = {
  wash:     { header: 'from-blue-800 to-blue-950',     accent: 'bg-blue-700',    badge: 'bg-blue-100 text-blue-800',   icon: '🫧' },
  dry:      { header: 'from-orange-700 to-orange-900', accent: 'bg-orange-600',  badge: 'bg-orange-100 text-orange-800', icon: '🔥' },
  complete: { header: 'from-emerald-700 to-emerald-900', accent: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800', icon: '✅' },
};

function ServiceCard({ service, accentClass }: { service: Service; accentClass: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl px-5 py-4 shadow border border-slate-100">
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 font-black text-xl md:text-2xl leading-tight truncate">{service.name}</p>
        <p className="text-slate-500 text-sm md:text-base font-medium truncate">{service.max}{service.maxDescription ? ` · ${service.maxDescription}` : ''}</p>
      </div>
      <div className={`${accentClass} text-white font-black text-2xl md:text-3xl px-5 py-2 rounded-xl shadow whitespace-nowrap`}>
        {service.price}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  services: Service[];
  note?: string;
  note2?: string;
  colorKey: keyof typeof SECTION_COLORS;
}

function Section({ title, services, note, note2, colorKey }: SectionProps) {
  const c = SECTION_COLORS[colorKey];
  return (
    <div className="flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
      {/* Section header */}
      <div className={`bg-gradient-to-r ${c.header} px-6 py-4 flex items-center gap-3`}>
        <span className="text-3xl">{c.icon}</span>
        <h2 className="text-white font-black text-xl md:text-3xl tracking-widest uppercase">{title}</h2>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-2 p-4">
        {services.map((s, i) => (
          <ServiceCard key={i} service={s} accentClass={c.accent} />
        ))}
      </div>
      {/* Notes */}
      {(note || note2) && (
        <div className="px-4 pb-4 flex flex-col gap-1">
          {note && <p className="text-slate-500 text-sm md:text-base" dangerouslySetInnerHTML={{ __html: note }} />}
          {note2 && <p className="text-slate-400 text-xs md:text-sm italic" dangerouslySetInnerHTML={{ __html: note2 }} />}
        </div>
      )}
    </div>
  );
}

export default function KioskHomePage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-100 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Reward promo banner */}
      <div className="mb-5 flex items-center gap-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl px-5 py-3 shadow-lg border-2 border-yellow-300">
        <span className="text-3xl">🎁</span>
        <p className="text-slate-900 font-black text-lg md:text-2xl">
          ¡Acumula puntos con cada servicio!
          <span className="font-semibold text-base md:text-lg ml-2 opacity-80">
            Presiona <strong>"Mis Puntos"</strong> en el encabezado para consultar tu saldo.
          </span>
        </p>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {wash?.services && (
          <Section
            title="Lavado"
            services={wash.services}
            note={wash.note}
            note2={wash.note2}
            colorKey="wash"
          />
        )}
        {dry?.services && (
          <Section
            title="Secado"
            services={dry.services}
            note={dry.note}
            colorKey="dry"
          />
        )}
        {full?.services && (
          <Section
            title="Servicio Completo"
            services={full.services}
            note={full.note}
            colorKey="complete"
          />
        )}
      </div>
    </div>
  );
}
