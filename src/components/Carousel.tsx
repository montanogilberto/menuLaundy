import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { slides as staticSlides, getCurrentMusicSelection } from '../data/services';
import ServiceTable from './ServiceTable';
import YouTubePlayer from './YouTubePlayer';

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled] = useState(true);
  const [slides, setSlides] = useState(staticSlides);

  // Update slides when music selection changes
  useEffect(() => {
    const updateSlides = () => {
      const musicSelection = getCurrentMusicSelection();
      const updatedSlides = staticSlides.map(slide =>
        slide.type === 'video' ? { ...slide, ...musicSelection } : slide
      );
      setSlides(updatedSlides);
    };

    updateSlides();
    // Check for updates every minute
    const interval = setInterval(updateSlides, 60000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    const currentSlide = slides[currentIndex];
    if (currentSlide?.type === 'video') {
      // Video slides: advance every 3 minutes (180000 ms), regardless of pause
      const interval = setInterval(nextSlide, 180000);
      return () => clearInterval(interval);
    } else if (!isPaused) {
      // Service slides: advance every 15 seconds (15000 ms) when not paused
      const interval = setInterval(nextSlide, 15000);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide, slides, currentIndex]);

  const getTableType = (title: string) => {
    if (title.includes('SECADO')) return 'dry';
    if (title.includes('COMPLETO')) return 'complete';
    return 'wash';
  };


  // Force video change only when video selection changes, not on every slide visit
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [lastVideoId, setLastVideoId] = useState<string>('');

  useEffect(() => {
    const currentSlide = slides[currentIndex];
    if (currentSlide?.type === 'video' && currentSlide.videoId) {
      const currentVideo = currentSlide.videoId;
      if (currentVideo !== lastVideoId) {
        // Video changed, update current video
        setCurrentVideoId(currentVideo);
        setLastVideoId(currentVideo);
      }
    }
  }, [slides, currentIndex, lastVideoId]);

  return (
    <div className="relative h-full w-full overflow-x-hidden overflow-y-auto md:overflow-hidden">
      <div
        className="flex min-h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="min-w-full min-h-full px-3 md:px-12 py-2 md:py-8 flex flex-col gap-3 md:gap-6"
          >
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl font-black text-3xl md:text-4xl tracking-wider shadow-xl border-b-4 border-cyan-500">
              {slide.title}
            </div>
            <div className="flex-1 bg-white rounded-2xl md:rounded-3xl shadow-2xl border-4 border-slate-200 overflow-visible md:overflow-hidden">
              <div className="p-5 md:p-10 h-full flex flex-col">
                {slide.type === 'service' && slide.services ? (
                  <>
                    <ServiceTable
                      services={slide.services}
                      type={getTableType(slide.title)}
                    />
                    {slide.note && (
                      <div
                        className="mt-3 md:mt-6 text-lg md:text-2xl text-slate-600 font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: slide.note }}
                      />
                    )}
                    {slide.note2 && (
                      <div
                        className="mt-3 md:mt-6 text-lg md:text-2xl text-slate-600 font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: slide.note2 }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex-1 h-[62vh] md:h-[62vh] relative">
                      <YouTubePlayer
                        key={`${currentIndex}-${currentVideoId}`} // Force re-render only when video changes
                        videoId={currentVideoId}
                        muted={!audioEnabled}
                        onPlay={() => setIsPaused(true)}
                        onEnded={() => {
                          setIsPaused(false);
                          // Only auto-advance if not on the video slide
                          if (slide.type !== 'video') {
                            nextSlide();
                          }
                        }}
                      />

                    </div>
                    {slide.note && (
                      <div className="mt-3 md:mt-6 text-lg md:text-2xl text-slate-600 font-medium">
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

      <div className="absolute top-[45%] md:top-1/2 -translate-y-1/2 left-2 md:left-8 right-2 md:right-8 flex justify-between items-center pointer-events-none">
        <button
          onClick={prevSlide}
          aria-label="Slide anterior"
          className="pointer-events-auto bg-slate-900/70 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 backdrop-blur-sm text-white rounded-full w-11 h-11 md:w-16 md:h-16 flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 border-2 border-white/20"
        >
          <ChevronLeft className="w-5 h-5 md:w-10 md:h-10" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Siguiente slide"
          className="pointer-events-auto bg-slate-900/70 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 backdrop-blur-sm text-white rounded-full w-11 h-11 md:w-16 md:h-16 flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 border-2 border-white/20"
        >
          <ChevronRight className="w-5 h-5 md:w-10 md:h-10" />
        </button>
      </div>

      <div
        className="absolute right-3 md:right-12 bottom-3 md:bottom-12 flex gap-2 md:gap-3 rounded-full bg-slate-900/40 backdrop-blur-sm px-3 py-2 border border-white/20"
        role="tablist"
        aria-label="Navegación del carrusel"
      >
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            role="tab"
            aria-selected={idx === currentIndex}
            aria-label={`Ir al slide ${idx + 1}`}
            className={`h-3 w-3 md:h-4 md:w-4 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              idx === currentIndex
                ? 'bg-blue-500 w-6 md:w-12 shadow-lg'
                : 'bg-white/60 hover:bg-white/90'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
