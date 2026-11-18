import { useEffect, useRef, useState, Fragment, type ReactNode } from 'react';
import { IonContent, IonFooter, IonHeader } from '@ionic/react';
import { Bot, Send, MessageCircle } from 'lucide-react';
import LoginPage from './LoginPage';
import { useClientSession } from '../lib/clientSession';
import { sendSupportMessage, SupportChatUnavailable } from '../api/supportChat';
import { SUPPORT_WHATSAPP_URL } from '../data/services';

interface Message {
  id: number;
  from: 'user' | 'agent';
  text: string;
  /** Agent couldn't answer: offer WhatsApp under the bubble */
  handoff?: boolean;
}

const QUICK_REPLIES = [
  '¿Cuántos puntos tengo?',
  'Quiero reservar',
  'Precios',
  'Horario y ubicación',
  '¿Cómo canjeo mis recompensas?',
];

// The agent writes for WhatsApp: *bold* and line breaks
function renderText(text: string): ReactNode {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2
      ? <strong key={i}>{part.slice(1, -1)}</strong>
      : <Fragment key={i}>{part}</Fragment>);
}

/** Soporte tab: chat with the store's virtual agent (the same one as on WhatsApp). */
export default function SupportChatPage() {
  const session = useClientSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft]       = useState('');
  const [sending, setSending]   = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const nextId     = useRef(1);

  // Fresh greeting per customer; logging out clears the conversation
  useEffect(() => {
    setMessages(session ? [{
      id: nextId.current++,
      from: 'agent',
      text: `¡Hola, ${session.first_name}! 👋 Soy el asistente de la lavandería.\n\nPregúntame por tus puntos, reservaciones, precios u horarios.`,
    }] : []);
  }, [session?.clientId]);

  useEffect(() => {
    contentRef.current?.scrollToBottom(250);
  }, [messages.length, sending]);

  if (!session) {
    return (
      <IonContent fullscreen>
        <LoginPage reason="para chatear con soporte" />
      </IonContent>
    );
  }

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    setDraft('');
    setMessages(m => [...m, { id: nextId.current++, from: 'user', text }]);
    setSending(true);
    let reply: Message;
    try {
      const answer = await sendSupportMessage(session.clientId, text);
      reply = answer
        ? { id: nextId.current++, from: 'agent', text: answer }
        : { id: nextId.current++, from: 'agent', text: 'No tengo una respuesta para eso. Escríbenos por WhatsApp y una persona del equipo te ayuda.', handoff: true };
    } catch (e) {
      reply = {
        id: nextId.current++,
        from: 'agent',
        text: e instanceof SupportChatUnavailable
          ? 'El chat en la app todavía no está disponible. Mientras tanto, escríbenos por WhatsApp.'
          : 'No pude responder en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
        handoff: true,
      };
    } finally {
      setSending(false);
    }
    setMessages(m => [...m, reply]);
  };

  const showQuickReplies = messages.length === 1 && !sending;

  return (
    <>
      <IonHeader className="ion-no-border">
        <div className="bg-[#1E3A8A] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-[#1E3A8A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base leading-tight">Asistente GMO</p>
            <p className="text-blue-200 text-xs flex items-center gap-1">
              Asistente virtual
            </p>
          </div>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-xs font-bold rounded-full px-3 py-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </IonHeader>

      <IonContent ref={contentRef} fullscreen>
        <div className="min-h-full bg-[#f0f4fa] px-3 sm:px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-line break-words shadow-sm ${
                  m.from === 'user'
                    ? 'bg-[#2563EB] text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-slate-800 rounded-2xl rounded-bl-md'}`}
                >
                  {renderText(m.text)}
                </div>
                {m.handoff && (
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 flex items-center gap-1.5 bg-[#25D366] text-white text-sm font-bold rounded-full px-4 py-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Escribir por WhatsApp
                  </a>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-start" aria-label="El asistente está escribiendo">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 mt-1">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="bg-white border border-blue-200 text-[#1E3A8A] text-sm font-semibold rounded-full px-3.5 py-2 hover:bg-blue-50 active:scale-95 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </IonContent>

      <IonFooter className="ion-no-border">
        <form
          onSubmit={e => { e.preventDefault(); send(draft); }}
          className="bg-white border-t border-slate-200 px-3 py-2.5"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Escribe tu mensaje…"
              enterKeyHint="send"
              maxLength={1000}
              className="flex-1 min-w-0 bg-slate-100 rounded-full px-4 py-3 text-base text-slate-800 outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Enviar"
              className="w-12 h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </IonFooter>
    </>
  );
}
