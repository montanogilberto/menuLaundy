import Header from './components/Header';
import Carousel from './components/Carousel';
import Footer from './components/Footer';

function App() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 grid grid-rows-[13vh_74vh_13vh]">
      <Header />
      <Carousel />
      <Footer />
    </div>
  );
}

export default App;
