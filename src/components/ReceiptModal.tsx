import { X, ExternalLink } from 'lucide-react';

interface Props {
  url: string;
  onClose: () => void;
}

export default function ReceiptModal({ url, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-[#0a2d6e] px-5 py-3 shrink-0">
        <p className="text-white font-black text-lg">🧾 Tu Recibo</p>
        <div className="flex items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-cyan-300 hover:text-white text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en nueva pestaña
          </a>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Receipt iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          title="Recibo"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
