import { useState, useEffect } from 'react';
import { IonApp, IonContent, IonPage } from '@ionic/react';
import Header from './components/Header';
import Footer from './components/Footer';
import KioskHomePage from './pages/KioskHomePage';
import RewardsCheckPage from './pages/RewardsCheckPage';
import ReservationPage from './pages/ReservationPage';
import ReceiptModal from './components/ReceiptModal';

type View = 'home' | 'rewards' | 'reservation';

const RECEIPT_BASE = 'https://imageprofile.blob.core.windows.net/ticketspos/receipts';

function receiptUrl(id: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  return `${RECEIPT_BASE}/${yyyy}/${mm}/receipt_${id}.html`;
}

function App() {
  const [view, setView]             = useState<View>('home');
  const [receiptId, setReceiptId]   = useState<string | null>(null);

  // Auto-open receipt if ?receipt=XXXX is in the URL (e.g. from QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('receipt');
    if (id) setReceiptId(id);
  }, []);

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          {view === 'rewards' ? (
            <RewardsCheckPage onBack={() => setView('home')} />
          ) : view === 'reservation' ? (
            <ReservationPage onBack={() => setView('home')} />
          ) : (
            <div className="min-h-screen flex flex-col">
              <Header onRewardsClick={() => setView('rewards')} />
              <main className="flex-1" role="main" aria-label="Contenido principal">
                <KioskHomePage onViewReceipt={setReceiptId} onReserve={() => setView('reservation')} />
              </main>
              <Footer />
            </div>
          )}

          {/* Receipt modal — shown over any view */}
          {receiptId && (
            <ReceiptModal
              url={receiptUrl(receiptId)}
              onClose={() => {
                setReceiptId(null);
                // Clean up URL param without reload
                const url = new URL(window.location.href);
                url.searchParams.delete('receipt');
                window.history.replaceState({}, '', url);
              }}
            />
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default App;
