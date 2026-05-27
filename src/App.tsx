import { IonApp, IonContent, IonPage } from '@ionic/react';
import Header from './components/Header';
import Carousel from './components/Carousel';
import Footer from './components/Footer';
import TicketCard from './components/TicketCard';
import { sampleTicket } from './data/services';

function App() {
  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen className="bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50">
          <div className="min-h-screen max-w-screen-2xl mx-auto flex flex-col">
            <Header />
            <main className="flex-1">
              <Carousel />
            </main>
            <Footer />
            <div className="px-3 sm:px-4 md:px-6 lg:px-10 py-6 md:py-10">
              <TicketCard ticket={sampleTicket} />
            </div>
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default App;
