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
    <section className="bg-white rounded-2xl md:rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-4 md:px-8 py-3 md:py-4 text-white">
        <h2 className="text-lg md:text-2xl font-black tracking-wide">TICKET DETALLADO</h2>
        <div className="text-xs md:text-sm text-blue-100 mt-1">
          <p>ID: {ticket.id}</p>
          <p>Fecha: {new Date(ticket.createdAt).toLocaleString('es-MX')}</p>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Categoría</th>
                <th className="text-left py-2 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Servicio</th>
                <th className="text-left py-2 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Canasta</th>
                <th className="text-right py-2 px-2 md:px-3 text-sm md:text-base text-slate-700 font-bold">Precio</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items.map((item, idx) => (
                <tr key={`${item.serviceName}-${idx}`} className="border-b border-slate-100">
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.category}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.serviceName}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-slate-800">{item.basket}</td>
                  <td className="py-2.5 px-2 md:px-3 text-sm md:text-base text-right font-semibold text-blue-700">
                    {currencyFormatter.format(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-4 px-2 md:px-3 text-right text-base md:text-lg font-black text-slate-900">
                  Subtotal
                </td>
                <td className="pt-4 px-2 md:px-3 text-right text-base md:text-lg font-black text-blue-800">
                  {currencyFormatter.format(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {ticket.note && (
          <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Nota:</span> {ticket.note}
          </p>
        )}
      </div>
    </section>
  );
}
