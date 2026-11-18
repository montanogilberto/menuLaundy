import { useState, useEffect } from 'react';
import {
  IonApp, IonContent, IonPage, IonHeader,
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
  IonRouterOutlet,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import {
  homeOutline, calendarOutline, qrCodeOutline,
  chatbubbleEllipsesOutline, logoWhatsapp,
} from 'ionicons/icons';

import Header from './components/Header';
import Footer from './components/Footer';
import KioskHomePage from './pages/KioskHomePage';
import RewardsCheckPage from './pages/RewardsCheckPage';
import ReservationPage from './pages/ReservationPage';
import QRPage from './pages/QRPage';
import ReceiptModal from './components/ReceiptModal';
import LoginPage from './pages/LoginPage';
import RequireLogin from './components/RequireLogin';
import SupportChatPage from './pages/SupportChatPage';
import WhatsAppPage from './pages/WhatsAppPage';
import { SUPPORT_WHATSAPP_URL } from './data/services';

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
                <IonHeader>
                  <Header />
                </IonHeader>
                <IonContent fullscreen>
                  <KioskHomePage onViewReceipt={setReceiptId} />
                  <Footer />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/reservar">
              <IonPage>
                <IonContent fullscreen>
                  <RequireLogin>
                    <ReservationPage onBack={() => window.history.back()} />
                  </RequireLogin>
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/qr">
              <IonPage>
                <IonContent fullscreen>
                  <RequireLogin>
                    <QRPage />
                  </RequireLogin>
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/puntos">
              <IonPage>
                <IonContent fullscreen>
                  <RequireLogin>
                    <RewardsCheckPage onBack={() => window.history.back()} />
                  </RequireLogin>
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/recompensas">
              <IonPage>
                <IonContent fullscreen>
                  <RequireLogin>
                    <RewardsCheckPage onBack={() => window.history.back()} />
                  </RequireLogin>
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/soporte">
              <IonPage>
                <SupportChatPage />
              </IonPage>
            </Route>

            <Route exact path="/whatsapp">
              <IonPage>
                <IonContent fullscreen>
                  <WhatsAppPage />
                </IonContent>
              </IonPage>
            </Route>

            <Route exact path="/login">
              <IonPage>
                <IonContent fullscreen>
                  <LoginPage afterLogin="home" />
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

            {/* Mis Puntos / Recompensas stay at /puntos and /recompensas, reached from Inicio */}
            <IonTabButton tab="soporte" href="/soporte">
              <IonIcon icon={chatbubbleEllipsesOutline} />
              <IonLabel>Soporte</IonLabel>
            </IonTabButton>

            {/* Opens WhatsApp on tap (user gesture, so no popup block); /whatsapp is the fallback page */}
            <IonTabButton tab="whatsapp" href="/whatsapp" onClick={() => window.open(SUPPORT_WHATSAPP_URL, '_blank', 'noopener')}>
              <IonIcon icon={logoWhatsapp} />
              <IonLabel>WhatsApp</IonLabel>
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
