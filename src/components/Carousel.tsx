import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { slides } from '../data/services';
import ServiceTable from './ServiceTable';
import YouTubePlayer from './YouTubePlayer';

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + slides.length) % slides.length);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(nextSlide, 12000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, nextSlide]);

  const getTableType = (title: string) => {
    if (title.includes('SECADO')) return 'dry';
    if (title.includes('COMPLETO')) return 'complete';
    return 'wash';
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div key={idx} className="min-w-full h-full px-12 py-8 flex flex-col gap-6">
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-8 py-4 rounded-2xl font-black text-4xl tracking-wider shadow-xl border-b-4 border-cyan-500">
              {slide.title}
            </div>
            <div className="flex-1 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 overflow-hidden">
              <div className="p-10 h-full flex flex-col">
                {slide.type === 'service' && slide.services ? (
                  <>
                    <ServiceTable
                      services={slide.services}
                      type={getTableType(slide.title)}
                    />
                    {slide.note && (
                      <div
                        className="mt-6 text-2xl text-slate-600 font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: slide.note }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex-1 h-[62vh]">
                      <YouTubePlayer
                        videoId={slide.videoId || ''}
                        onPlay={() => setIsPaused(true)}
                        onPause={() => setIsPaused(false)}
                        onEnded={() => {
                          setIsPaused(false);
                          nextSlide();
                        }}
                      />
                    </div>
                    {slide.note && (
                      <div className="mt-6 text-2xl text-slate-600 font-medium">
                        {slide.note}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 flex justify-between items-center pointer-events-none">
        <button
          onClick={prevSlide}
          className="pointer-events-auto bg-slate-900/60 hover:bg-slate-900/90 backdrop-blur-sm text-white rounded-full w-16 h-16 flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 border-2 border-white/20"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
        <button
          onClick={nextSlide}
          className="pointer-events-auto bg-slate-900/60 hover:bg-slate-900/90 backdrop-blur-sm text-white rounded-full w-16 h-16 flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 border-2 border-white/20"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>

      <div className="absolute right-12 bottom-12 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-4 w-4 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'bg-blue-500 w-12 shadow-lg'
                : 'bg-white/60 hover:bg-white/90'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
