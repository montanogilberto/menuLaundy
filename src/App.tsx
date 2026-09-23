import { useState, useEffect } from 'react';
import {
  IonApp, IonContent, IonPage,
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
  IonRouterOutlet,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import {
  homeOutline, calendarOutline, qrCodeOutline,
  starOutline, giftOutline,
} from 'ionicons/icons';

import Header from './components/Header';
import KioskHomePage from './pages/KioskHomePage';
import RewardsCheckPage from './pages/RewardsCheckPage';
import ReservationPage from './pages/ReservationPage';
import QRPage from './pages/QRPage';
import ReceiptModal from './components/ReceiptModal';

const RECEIPT_BASE = 'https://imageprofile.blob.core.windows.net/ticketspos/receipts';

function receiptUrl(id: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  return `${RECEIPT_BASE}/${yyyy}/${mm}/receipt_${id}.html`;
}

function App() {
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('receipt');
    if (id) setReceiptId(id);
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/home">
              <IonPage>
                <Header />
                <IonContent fullscreen>
                  <KioskHomePage onViewReceipt={setReceiptId} />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/reservar">
              <IonPage>
                <IonContent fullscreen>
                  <ReservationPage onBack={() => window.history.back()} />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/qr">
              <IonPage>
                <IonContent fullscreen>
                  <QRPage />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/puntos">
              <IonPage>
                <IonContent fullscreen>
                  <RewardsCheckPage onBack={() => window.history.back()} />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/recompensas">
              <IonPage>
                <IonContent fullscreen>
                  <RewardsCheckPage onBack={() => window.history.back()} />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon icon={homeOutline} />
              <IonLabel>Inicio</IonLabel>
            </IonTabButton>

            <IonTabButton tab="reservar" href="/reservar">
              <IonIcon icon={calendarOutline} />
              <IonLabel>Reservar</IonLabel>
            </IonTabButton>

            <IonTabButton tab="qr" href="/qr">
              <IonIcon icon={qrCodeOutline} />
              <IonLabel>Mi QR</IonLabel>
            </IonTabButton>

            <IonTabButton tab="puntos" href="/puntos">
              <IonIcon icon={starOutline} />
              <IonLabel>Mis Puntos</IonLabel>
            </IonTabButton>

            <IonTabButton tab="recompensas" href="/recompensas">
              <IonIcon icon={giftOutline} />
              <IonLabel>Recompensas</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>

      {receiptId && (
        <ReceiptModal
          url={receiptUrl(receiptId)}
          onClose={() => {
            setReceiptId(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('receipt');
            window.history.replaceState({}, '', url);
          }}
        />
      )}
    </IonApp>
  );
}

export default App;
