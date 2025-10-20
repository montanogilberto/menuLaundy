

import logo from '../assets/logo_white.jpeg';

export default function Header() {
  return (
    <header className="relative bg-white text-slate-900 shadow-2xl border-b-4 border-blue-500">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="px-4 md:px-8 py-4 md:py-6 align-middle text-left">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <img
                    src={logo}
                    alt="GMO Lavandería Auto-Lavado Logo"
                    className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-lg filter blur-[0.5px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-cyan-400/20 rounded-full blur-sm"></div>
                </div>
                <div>
                  <span className="block text-lg md:text-2xl font-serif font-bold text-slate-700 tracking-wide uppercase">
                    Lavandería Auto-Lavado
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 md:px-8 py-4 md:py-6 align-middle text-center">
              {/* Washing Machine Animation */}
              <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto">
                {/* Outer drum */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full border-4 border-blue-500 shadow-lg flex items-center justify-center">
                  {/* Inner rotating drum */}
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-100 to-blue-300 rounded-full border-2 border-blue-400 relative overflow-hidden animate-spin" style={{animationDuration: '3s'}}>
                    {/* Water waves */}
                    <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-700 rounded-full animate-pulse delay-700"></div>
                    {/* Clothes */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
                {/* Glass door */}
                <div className="absolute inset-1 bg-blue-50/30 rounded-full border-2 border-blue-300/50"></div>
              </div>
            </td>
            <td className="px-4 md:px-8 py-4 md:py-6 text-right align-middle">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 md:px-6 py-2 md:py-3 rounded-2xl font-black text-sm md:text-xl shadow-lg border-2 border-blue-300 inline-block">
                Pantalla 50" • Modo Kiosko
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </header>
  );
}
