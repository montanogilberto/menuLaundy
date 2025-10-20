import { Service } from '../types';

interface ServiceTableProps {
  services: Service[];
  type: 'wash' | 'dry' | 'complete';
}

export default function ServiceTable({ services, type }: ServiceTableProps) {
  const headers = {
    wash: ['Servicio', 'Máximo', 'Precio'],
    dry: ['Tiempo', 'Máximo', 'Precio'],
    complete: ['Servicio', 'Máximo', 'Precio'],
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-800 to-blue-900">
            {headers[type].map((header, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-white font-black text-3xl tracking-wide ${
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
              <td className="px-6 py-5 text-3xl font-semibold text-slate-800">
                {service.name}
              </td>
              <td className="px-6 py-5 text-3xl font-medium text-slate-600">
                {service.max}
              </td>
              <td className="px-6 py-5 text-right text-3xl font-black text-blue-700">
                {service.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
