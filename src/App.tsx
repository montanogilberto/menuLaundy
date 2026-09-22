import { useState } from 'react';
import { IonApp, IonContent, IonPage } from '@ionic/react';
import Header from './components/Header';
import Footer from './components/Footer';
import KioskHomePage from './pages/KioskHomePage';
import RewardsCheckPage from './pages/RewardsCheckPage';

type View = 'home' | 'rewards';

function App() {
  const [view, setView] = useState<View>('home');

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          {view === 'rewards' ? (
            <RewardsCheckPage onBack={() => setView('home')} />
          ) : (
            <div className="min-h-screen flex flex-col">
              <Header onRewardsClick={() => setView('rewards')} />
              <main className="flex-1" role="main" aria-label="Contenido principal">
                <KioskHomePage />
              </main>
              <Footer />
            </div>
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default App;
