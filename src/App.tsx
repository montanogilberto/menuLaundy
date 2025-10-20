import Header from './components/Header';
import Carousel from './components/Carousel';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 grid grid-rows-[auto_1fr_auto] max-w-screen-2xl mx-auto">
      <Header />
      <Carousel />
      <Footer />
    </div>
  );
}

export default App;
