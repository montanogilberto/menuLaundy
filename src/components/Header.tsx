

import { IonHeader, IonToolbar, IonTitle, IonImg } from '@ionic/react';
import logo from '../assets/logo_white.jpeg';

export default function Header() {
  return (
    <IonHeader className="relative bg-white text-slate-900 shadow-2xl border-b-4 border-blue-500">
      <IonToolbar className="w-full px-3 sm:px-4 md:px-8 py-3 md:py-5">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative shrink-0">
            <IonImg
              src={logo}
              alt="GMO Lavandería Auto-Lavado Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 object-contain drop-shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-cyan-400/20 rounded-full blur-sm"></div>
          </div>
          <div className="min-w-0">
            <IonTitle className="p-0 m-0">
              <span className="block text-sm sm:text-lg md:text-2xl font-serif font-bold text-slate-700 tracking-wide uppercase leading-tight">
                Lavandería Auto-Lavado
              </span>
            </IonTitle>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
