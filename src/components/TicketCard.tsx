import { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
}

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
});

export default function TicketCard({ ticket }: TicketCardProps) {
  const total = ticket.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <section
      aria-label={`Ticket ${ticket.id}`}
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-4 md:px-8 py-4 md:py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg md:text-2xl font-black tracking-wide">TICKET DETALLADO</h2>
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-cyan-100 border border-white/20">
            #{ticket.id}
          </span>
        </div>
        <div className="text-xs md:text-sm text-blue-100 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
          <p className="font-medium">ID: <span className="font-normal text-blue-50">{ticket.id}</span></p>
          <p className="font-medium">Fecha: <span className="font-normal text-blue-50">{new Date(ticket.createdAt).toLocaleString('es-MX')}</span></p>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[540px] border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Categoría</th>
                <th className="text-left py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Servicio</th>
                <th className="text-left py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Canasta</th>
                <th className="text-right py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Precio</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items.map((item, idx) => (
                <tr key={`${item.serviceName}-${idx}`} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/30">
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.category}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.serviceName}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.basket}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-right font-semibold text-blue-700">
                    {currencyFormatter.format(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={3} className="pt-4 pb-3 px-2 md:px-3 text-right text-base md:text-lg font-black text-slate-900">
                  Subtotal
                </td>
                <td className="pt-4 pb-3 px-2 md:px-3 text-right text-base md:text-lg font-black text-blue-800">
                  {currencyFormatter.format(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {ticket.note && (
          <p className="mt-4 md:mt-5 text-sm md:text-base text-slate-600 leading-relaxed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="font-semibold text-slate-800">Nota:</span> {ticket.note}
          </p>
        )}
      </div>
    </section>
  );
}
