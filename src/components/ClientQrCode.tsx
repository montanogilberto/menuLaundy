import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useClientQr } from '../lib/useClientQr';

interface Props {
  clientId: number;
  size: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  fgColor?: string;
}

/** The client's signed QR, with a spinner while it loads and a retry on error. */
export default function ClientQrCode({ clientId, size, level = 'M', fgColor = '#000000' }: Props) {
  const { qrValue, loading, error, reload } = useClientQr(clientId);

  if (qrValue) {
    return <QRCodeSVG value={qrValue} size={size} level={level} bgColor="#ffffff" fgColor={fgColor} />;
  }
  return (
    <div style={{ width: size, height: size }}
      className="flex flex-col items-center justify-center gap-3 text-center rounded-xl bg-slate-50 px-3">
      {loading || !error ? (
        <>
          <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Cargando tu QR...</p>
        </>
      ) : (
        <>
          <p className="text-slate-600 text-sm font-semibold">{error}</p>
          <button
            onClick={e => { e.stopPropagation(); reload(); }}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg px-3 py-2">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </>
      )}
    </div>
  );
}
