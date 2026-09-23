import { contactInfo, businessHours, socialLinks } from '../data/services';
import { Phone, MapPin, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';

const iconMap = { Facebook, Instagram, MessageCircle };

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t-2 border-blue-800 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex flex-col md:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">

        {/* Contact */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-300 text-sm md:text-base">
          <span className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
            {contactInfo.phone}
          </span>
          <span className="flex items-start sm:items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
            {contactInfo.address}
          </span>
        </div>

        {/* Hours */}
        <div className="flex items-start sm:items-center gap-2 text-slate-400 text-sm md:text-base">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            {businessHours
              .filter(h => h.hours !== 'Cerrado')
              .map(h => `${h.day}: ${h.hours}`)
              .join(' · ')}
          </span>
        </div>

        {/* Social */}
        <div className="flex items-center gap-3 sm:gap-2 self-center">
          {socialLinks.map((s) => {
            const Icon = iconMap[s.icon as keyof typeof iconMap];
            return (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="bg-blue-700 hover:bg-blue-600 text-white p-2.5 sm:p-2 rounded-full transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>

      </div>
    </footer>
  );
}
