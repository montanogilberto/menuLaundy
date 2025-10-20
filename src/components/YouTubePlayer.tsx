import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  muted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  muted = true,
  onPlay,
  onEnded,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (containerRef.current && window.YT && window.YT.Player) {
        const player = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            mute: muted ? 1 : 0,
            loop: 0,
            playlist: videoId,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            cc_load_policy: 0,
            showinfo: 0,
            autohide: 1,
            start: 0,
          },
          events: {
            onReady: (event: any) => {
              setIsLoading(false);
              // Force play to ensure autoplay works
              event.target.playVideo();
              if (onPlay) onPlay();
            },
            onStateChange: (event: any) => {
              const { ENDED, PLAYING, PAUSED, BUFFERING, CUED } = window.YT.PlayerState;
              if (event.data === ENDED && onEnded) onEnded();
              if (event.data === PLAYING && onPlay) onPlay();
              if (event.data === PAUSED || event.data === BUFFERING || event.data === CUED) {
                // Auto-resume if paused, buffering, or cued (for kiosk mode - always keep active)
                setTimeout(() => {
                  event.target.playVideo();
                }, 100);
              }
            },
            onError: () => {
              // Retry loading on error
              setTimeout(() => {
                if (onEnded) onEnded();
              }, 5000);
            }
          },
        });

        // Store player reference for cleanup
        (containerRef.current as any)._player = player;
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (containerRef.current && (containerRef.current as any)._player) {
        (containerRef.current as any)._player.destroy();
      }
    };
  }, [videoId, muted, onPlay, onEnded]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full pointer-events-none"></div>
    </div>
  );
}
