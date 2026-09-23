import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar, Clock, ChevronLeft, ChevronRight,
  User, Phone, Mail, CheckCircle, AlertCircle, Loader2, X,
} from 'lucide-react';
import { createReservation, listReservations, ServiceType } from '../api/reservationsApi';
import { useClientSession, localPhone } from '../lib/clientSession';

type Step = 'service' | 'datetime' | 'contact' | 'confirm' | 'success' | 'error';

const SERVICES: { type: ServiceType; label: string; icon: string; color: string; desc: string }[] = [
  { type: 'lavado',  label: 'Lavado',  icon: '🫧', color: 'from-blue-700 to-blue-900',    desc: 'Tú operas las lavadoras' },
  { type: 'secado',  label: 'Secado',  icon: '🌀', color: 'from-orange-600 to-orange-800', desc: 'Tú operas las secadoras' },
];

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];

const COUNTRY_CODES = [
  { flag: '🇲🇽', label: 'MX', code: '+52' },
  { flag: '🇺🇸', label: 'US', code: '+1'  },
  { flag: '🇨🇦', label: 'CA', code: '+1'  },
];

function pad(n: number) { return String(n).padStart(2, '0'); }

function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function displayDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' });
}

export default function ReservationPage({ onBack }: { onBack: () => void }) {
  const [step, setStep]               = useState<Step>('service');
  const [service, setService]         = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [calMonth, setCalMonth]       = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [lada, setLada]               = useState('+52');
  const [email, setEmail]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [takenSlots, setTakenSlots]   = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);

  const today = isoDate(new Date());
  const session = useClientSession();

  // Pre-fill contact details for a logged-in customer
  useEffect(() => {
    if (!session) return;
    setName(n => n || `${session.first_name} ${session.last_name}`.trim());
    setPhone(p => p || localPhone(session.cellphone));
    setEmail(e => e || session.email || '');
  }, [session?.clientId]);

  // Load booked slots for the selected date + service (same rule as the backend's slot_taken check)
  useEffect(() => {
    if (!selectedDate || !service) { setTakenSlots(new Set()); return; }
    let cancelled = false;
    setSlotsLoading(true);
    listReservations({ date: selectedDate })
      .then(list => {
        if (cancelled) return;
        setTakenSlots(new Set(
          list
            .filter(r => r.reservationDate?.slice(0, 10) === selectedDate
                      && r.serviceType === service
                      && r.status !== 'cancelled')
            .map(r => r.timeSlot.trim().slice(0, 5))
        ));
      })
      .catch(() => { if (!cancelled) setTakenSlots(new Set()); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate, service, reservationId]);

  const now = new Date();
  const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Preselect service from ?servicio=lavado|secado (e.g. from the rewards dashboard)
  const { search } = useLocation();
  useEffect(() => {
    const s = new URLSearchParams(search).get('servicio');
    if (s && SERVICES.some(x => x.type === s)) {
      setService(s as ServiceType);
      setStep('datetime');
    }
  }, [search]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const firstDay    = new Date(calMonth.y, calMonth.m, 1).getDay();
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  function calIso(day: number) {
    return `${calMonth.y}-${pad(calMonth.m+1)}-${pad(day)}`;
  }
  function prevMonth() { setCalMonth(({ y, m }) => m === 0 ? { y: y-1, m: 11 } : { y, m: m-1 }); }
  function nextMonth() { setCalMonth(({ y, m }) => m === 11 ? { y: y+1, m: 0 } : { y, m: m+1 }); }
  const monthLabel = new Date(calMonth.y, calMonth.m).toLocaleDateString('es-MX', { month:'long', year:'numeric' });

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!service || !selectedDate || !selectedSlot || !name.trim() || !phone.trim()) return;
    setLoading(true);
    setStep('confirm');
    try {
      const result = await createReservation({
        clientName: name.trim(),
        phone: lada + phone.trim(),
        email: email.trim() || undefined,
        serviceType: service,
        reservationDate: selectedDate,
        timeSlot: selectedSlot,
      });
      if (result.error) {
        if (result.error === 'slot_taken') {
          // Someone booked it first: mark it taken and send them back to pick another time
          setTakenSlots(prev => new Set(prev).add(selectedSlot));
          setSelectedSlot('');
          setErrorMsg('Este horario ya está reservado. Por favor elige otro.');
          setStep('datetime');
        } else {
          setErrorMsg(result.message || 'No se pudo crear la reservación. Intenta de nuevo.');
          setStep('error');
        }
      } else {
        setReservationId(result.reservation?.reservationId ?? null);
        setStep('success');
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta más tarde.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  const serviceInfo = SERVICES.find(s => s.type === service);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2d6e] to-[#1a4fa0] px-5 py-4 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white/80 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-white font-black text-xl">Reservar Servicio</h1>
          <p className="text-blue-200 text-sm">Agenda tu lavado o secado</p>
        </div>
      </div>

      {/* Steps indicator */}
      {!['success','error','confirm'].includes(step) && (
        <div className="flex gap-1 px-5 py-3 bg-white border-b border-gray-100">
          {['service','datetime','contact'].map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s ? 'bg-blue-700 text-white' :
                  (['service','datetime','contact'].indexOf(step) > i) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {['service','datetime','contact'].indexOf(step) > i ? '✓' : i+1}
              </div>
              <span className={`text-xs font-medium ${step===s ? 'text-blue-700' : 'text-gray-400'}`}>
                {s === 'service' ? 'Servicio' : s === 'datetime' ? 'Fecha y Hora' : 'Datos'}
              </span>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 ml-1" />}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── STEP: service ── */}
        {step === 'service' && (
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-gray-600 text-center mb-6">¿Qué servicio deseas reservar?</p>
            {SERVICES.map(svc => (
              <button key={svc.type}
                onClick={() => { setService(svc.type); setStep('datetime'); }}
                className={`w-full bg-gradient-to-r ${svc.color} text-white rounded-2xl p-6 flex items-center gap-5 shadow-lg hover:scale-[1.02] transition-transform`}>
                <span className="text-5xl">{svc.icon}</span>
                <div className="text-left">
                  <p className="text-2xl font-black">{svc.label}</p>
                  <p className="text-white/80 text-sm">{svc.desc}</p>
                </div>
                <ChevronRight className="w-6 h-6 ml-auto opacity-70" />
              </button>
            ))}
          </div>
        )}

        {/* ── STEP: datetime ── */}
        {step === 'datetime' && (
          <div className="max-w-md mx-auto space-y-5">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-4 h-4"/></button>
                <span className="font-bold text-gray-800 capitalize">{monthLabel}</span>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-4 h-4"/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['D','L','M','M','J','V','S'].map((d,i) => (
                  <div key={i} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const iso = calIso(day);
                  const isPast = iso < today;
                  const isSel  = iso === selectedDate;
                  return (
                    <button key={i} disabled={isPast}
                      onClick={() => { setSelectedDate(iso); setSelectedSlot(''); setErrorMsg(''); }}
                      className={`aspect-square rounded-full text-sm font-medium transition-colors
                        ${isPast ? 'text-gray-300 cursor-not-allowed' :
                          isSel  ? 'bg-blue-700 text-white' :
                                   'hover:bg-blue-50 text-gray-700'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <p className="font-bold text-gray-800">Selecciona un horario</p>
                </div>
                <p className="text-sm text-blue-700 font-medium mb-3 capitalize">{displayDate(selectedDate)}</p>
                {errorMsg && step === 'datetime' && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-3 py-2 mb-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                  </div>
                )}
                {slotsLoading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-6">
                    <Loader2 className="w-4 h-4 animate-spin" /> Consultando disponibilidad…
                  </div>
                ) : (
                <>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const taken = takenSlots.has(slot);
                    const past  = selectedDate === today && slot <= nowHHMM;
                    const off   = taken || past;
                    return (
                      <button key={slot}
                        disabled={off}
                        onClick={() => { setSelectedSlot(slot); setErrorMsg(''); }}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-colors flex flex-col items-center leading-tight
                          ${selectedSlot === slot
                            ? 'bg-blue-700 text-white border-blue-700'
                            : taken
                              ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed'
                              : past
                                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700 hover:border-blue-400'}`}>
                        <span className={taken ? 'line-through' : ''}>{slot}</span>
                        {taken && <span className="text-[10px] font-bold text-red-400 no-underline">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
                {TIME_SLOTS.every(s => takenSlots.has(s) || (selectedDate === today && s <= nowHHMM)) && (
                  <p className="text-center text-sm text-gray-500 mt-3">No hay horarios disponibles este día. Elige otra fecha.</p>
                )}
                </>
                )}
              </div>
            )}

            {selectedDate && selectedSlot && (
              <button onClick={() => setStep('contact')}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl text-lg transition-colors shadow">
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* ── STEP: contact ── */}
        {step === 'contact' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <Calendar className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900">{serviceInfo?.label} — {selectedSlot}</p>
                <p className="text-blue-700 text-sm capitalize">{displayDate(selectedDate)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <User className="w-4 h-4" /> Nombre completo *
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-lg outline-none transition-colors" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Phone className="w-4 h-4" /> Teléfono * (recibirás confirmación por SMS/WhatsApp)
                </label>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    {COUNTRY_CODES.map(cc => (
                      <button key={cc.code + cc.label}
                        onClick={() => setLada(cc.code)}
                        className={`px-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors
                          ${lada === cc.code && cc.label === (lada==='+52'?'MX':lada==='+1'?'US':'CA')
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                        {cc.flag} {cc.label}
                      </button>
                    ))}
                  </div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="6621234567"
                    className="flex-1 border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-lg outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Mail className="w-4 h-4" /> Email (opcional, para confirmación por correo)
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="correo@ejemplo.com"
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-lg outline-none transition-colors" />
              </div>
            </div>

            <button
              disabled={!name.trim() || phone.trim().length < 7}
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-lg transition-colors shadow">
              ✅ Confirmar Reservación
            </button>
          </div>
        )}

        {/* ── STEP: confirm (loading) ── */}
        {step === 'confirm' && loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <Loader2 className="w-14 h-14 text-blue-700 animate-spin" />
            <p className="text-gray-600 font-semibold text-lg">Creando tu reservación...</p>
            <p className="text-gray-400 text-sm">Enviando confirmación por SMS y WhatsApp</p>
          </div>
        )}

        {/* ── STEP: success ── */}
        {step === 'success' && (
          <div className="max-w-md mx-auto text-center space-y-5 py-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <h2 className="text-2xl font-black text-gray-800">¡Reservación Confirmada!</h2>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio</span>
                <span className="font-bold">{serviceInfo?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-bold capitalize">{displayDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hora</span>
                <span className="font-bold">{selectedSlot}</span>
              </div>
              {reservationId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Folio</span>
                  <span className="font-bold text-blue-700">#{reservationId}</span>
                </div>
              )}
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800">
              📱 Te enviamos una confirmación por <strong>SMS y WhatsApp</strong> al número {lada}{phone}.
              {email && <span> También a <strong>{email}</strong>.</span>}
            </div>
            <button onClick={onBack}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl text-lg transition-colors">
              Volver al inicio
            </button>
          </div>
        )}

        {/* ── STEP: error ── */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center space-y-5 py-8">
            <AlertCircle className="w-20 h-20 text-red-400 mx-auto" />
            <h2 className="text-xl font-black text-gray-800">Algo salió mal</h2>
            <p className="text-gray-600">{errorMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => setStep('datetime')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">
                Cambiar horario
              </button>
              <button onClick={() => setStep('contact')}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl transition-colors">
                Reintentar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
