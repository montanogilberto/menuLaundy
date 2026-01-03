

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
          </tr>
        </tbody>
      </table>
    </header>
  );
}
