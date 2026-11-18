import { MessageCircle, Clock, MapPin } from 'lucide-react';
import { SUPPORT_WHATSAPP_URL, contactInfo, businessHours } from '../data/services';

/** WhatsApp tab: the tab button opens WhatsApp directly; this page is what's left
 *  behind (and the way in when the browser blocks the new window). */
export default function WhatsAppPage() {
  return (
    <div className="min-h-full bg-[#f0f4fa] px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="bg-white rounded-3xl shadow p-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center">
            <MessageCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-[#1E3A8A] font-black text-2xl">Escríbenos por WhatsApp</h2>
          <p className="text-slate-500">
            Te contesta nuestro asistente al instante. Si lo necesitas, una persona del equipo te sigue atendiendo.
          </p>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-black text-lg rounded-2xl"
          >
            <MessageCircle className="w-6 h-6" /> Abrir WhatsApp
          </a>
          <p className="text-slate-400 text-sm">{contactInfo.whatsapp}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              {businessHours.map(h => (
                <p key={h.day}><strong className="text-slate-800">{h.day}:</strong> {h.hours}</p>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">{contactInfo.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
