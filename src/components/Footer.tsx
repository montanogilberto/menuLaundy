import { extras, contactInfo, businessHours, socialLinks } from '../data/services';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';

const iconMap = {
  Facebook,
  Instagram,
  MessageCircle,
};

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-950 to-slate-900 text-blue-100 border-t-4 border-blue-500/20 flex-shrink-0">
      <div className="max-w-screen-2xl mx-auto px-2 md:px-4 lg:px-8 py-3 md:py-6">
        {/* Extras Marquee */}
        <div className="mb-3 md:mb-6 overflow-hidden">
          <div className="flex items-center gap-1 md:gap-2">
            <strong className="text-white text-xs md:text-sm lg:text-lg whitespace-nowrap font-bold tracking-wide">
              Extras opcionales: Ensueño Max • Vanish • Ariel • Persil • Foca • Member’s Mark • Cloro
            </strong>
            <div className="ticker relative w-full overflow-hidden">
              <span className="marquee absolute left-full whitespace-nowrap text-xs md:text-sm lg:text-lg font-medium">
                {extras}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-white text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-4 flex items-center gap-1 md:gap-2">
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
              Contacto
            </h3>
            <div className="space-y-1 md:space-y-2">
              <p className="flex items-center gap-1 md:gap-2 text-xs md:text-sm lg:text-base">
                <Phone className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0" />
                <span className="break-all">{contactInfo.phone}</span>
              </p>
              <p className="flex items-center gap-1 md:gap-2 text-xs md:text-sm lg:text-base">
                <Mail className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0" />
                <span className="break-all">{contactInfo.email}</span>
              </p>
              <p className="flex items-start gap-1 md:gap-2 text-xs md:text-sm lg:text-base">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{contactInfo.address}</span>
              </p>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-white text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-4 flex items-center gap-1 md:gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              Horarios
            </h3>
            <div className="space-y-0.5 md:space-y-1">
              {businessHours.map((hour, idx) => (
                <p key={idx} className="text-xs md:text-sm lg:text-base">
                  <span className="font-medium">{hour.day}:</span> {hour.hours}
                </p>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-4">
              Síguenos
            </h3>
            <div className="flex gap-2 md:gap-3">
              {socialLinks.map((social, idx) => {
                const IconComponent = iconMap[social.icon as keyof typeof iconMap];
                return (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 md:p-2 rounded-full transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Branding */}
          <div>
            <h3 className="text-white text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-4">
              GMO Lavandería
            </h3>
            <p className="text-xs md:text-sm lg:text-base text-blue-200">
              Servicio profesional de lavado y secado. Calidad y rapidez garantizada.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 md:mt-6 pt-2 md:pt-4 border-t border-slate-700 text-center">
          <p className="text-xs md:text-sm text-blue-300">
            © 2024 GMO Lavandería • Auto-Lavado. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
