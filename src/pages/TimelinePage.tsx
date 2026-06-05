import { IonApp, IonContent, IonPage } from '@ionic/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { RadialOrbitalTimelineDemo } from '../components/ui/demo';

export default function TimelinePage() {
  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen className="bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50">
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1" role="main" aria-label="Timeline principal">
              <RadialOrbitalTimelineDemo />
            </main>
            <Footer />
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
