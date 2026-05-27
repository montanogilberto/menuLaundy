import { Service } from '../types';

interface ServiceTableProps {
  services: Service[];
  type: 'wash' | 'dry' | 'complete';
}

export default function ServiceTable({ services, type }: ServiceTableProps) {
  const headers = {
    wash: ['Servicio', 'Canasta Máximo', 'Precio'],
    dry: ['Tiempo', 'Canasta Máximo', 'Precio'],
    complete: ['Servicio', 'Canasta Máximo', 'Precio'],
  };

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 shadow-lg">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-800 to-blue-900">
            {headers[type].map((header, idx) => (
              <th
                key={idx}
                className={`px-3 md:px-6 py-2 md:py-4 text-white font-black text-sm sm:text-lg md:text-3xl tracking-wide ${
                  idx === 2 ? 'text-right' : 'text-left'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((service, idx) => (
            <tr
              key={idx}
              className="border-b-2 border-slate-100 hover:bg-blue-50/50 transition-colors duration-200"
            >
              <td className="px-3 md:px-6 py-3 md:py-5 text-sm sm:text-lg md:text-3xl font-semibold text-slate-800 whitespace-nowrap">
                {service.name}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-5 min-w-[180px]">
                <div className="text-sm sm:text-lg md:text-3xl font-medium text-slate-800">
                  {service.max}
                </div>
                {service.maxDescription && (
                  <div className="text-[10px] sm:text-xs md:text-sm font-normal text-slate-500">
                    {service.maxDescription}
                  </div>
                )}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-5 text-right text-sm sm:text-lg md:text-3xl font-black text-blue-700 whitespace-nowrap">
                {service.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
