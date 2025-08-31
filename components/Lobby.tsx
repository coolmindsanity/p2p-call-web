import React, { useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { usePinchToZoom } from '../hooks/usePinchToZoom';

interface LobbyProps {
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const MuteIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75a.75.75 0 0 1 .75-.75Z" />
  </svg>
);

const UnmuteIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 4.06c0-1.336-1.076-2.412-2.411-2.412A2.412 2.412 0 0 0 8.677 4.06v8.682a2.412 2.412 0 0 0 4.823 0V4.06Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75a.75.75 0 0 1 .75-.75Z" />
    <path fillRule="evenodd" d="M2.023 2.023a.75.75 0 0 1 1.06 0L21.977 20.92a.75.75 0 1 1-1.06 1.06L2.023 3.083a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
</svg>
);

const VideoOnIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-2.25l3.44 3.44a1.5 1.5 0 0 0 2.56-1.06V6.37a1.5 1.5 0 0 0-2.56-1.06L15.75 8.75V7.5a3 3 0 0 0-3-3H4.5Z" />
</svg>
);

const VideoOffIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3.53 3.53a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 0 0 1.06-1.06l-18-18ZM20.25 11.625l1.58-1.58a1.5 1.5 0 0 0-1.06-2.56L18 8.935V7.5a3 3 0 0 0-3-3h-2.25l-1.822-1.823a.75.75 0 0 0-1.06 0l-.146.147-1.125 1.125a.75.75 0 0 0 0 1.06l.12.12L12 8.25V7.5h3v3.75l-4.28 4.28-.625.625a.75.75 0 0 0 0 1.06l.625.625 4.28 4.28V16.5h.75a3 3 0 0 0 3-3V11.625ZM4.5 19.5h8.25a3 3 0 0 0 3-3V13.125l-3.375-3.375L9 13.125v3.375h-3v-3.375l-.375-.375-1.5-1.5V16.5a3 3 0 0 0 3 3Z" />
</svg>
);

const Lobby: React.FC<LobbyProps> = ({
  localStream,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onConfirm,
  onCancel
}) => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const { zoom, setZoom, resetZoom, isPinching, onTouchStart, onTouchMove, onTouchEnd } = usePinchToZoom();
  const lobbyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = lobbyContainerRef.current;
    if (!container) return;

    // Find all focusable elements within the lobby
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Set initial focus on the primary action button ("Join Now")
    const joinButton = Array.from(focusableElements).find(el => el.textContent?.includes('Join Now'));
    if (joinButton) {
        joinButton.focus();
    } else {
        firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) { // Handle Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Handle Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTouchDevice]); // Rerun if the presence of the slider changes

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  const handleConfirm = () => {
    resetZoom();
    onConfirm();
  };

  const handleCancel = () => {
    resetZoom();
    onCancel();
  };
  
  return (
    <div ref={lobbyContainerRef} className="flex flex-col items-center justify-center w-full max-w-4xl p-4 md:p-8 animate-fade-in">
        <style>{`
            .desktop-instruction { display: block; }
            .touch-instruction { display: none; }
            @media (pointer: coarse) {
                .desktop-instruction { display: none; }
                .touch-instruction { display: block; }
            }
            /* Custom styles for vertical range input */
            .zoom-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 120px;
              height: 4px;
              background: rgba(203, 213, 225, 0.7); /* slate-300 */
              border-radius: 2px;
              outline: none;
              transform: rotate(-90deg);
              transform-origin: 60px 60px;
            }
            .dark .zoom-slider {
              background: rgba(55, 65, 81, 0.7); /* gray-600 */
            }
            .zoom-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: white;
              border: 2px solid #6366f1; /* indigo-500 */
              border-radius: 50%;
              cursor: ns-resize;
            }
            .zoom-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              background: white;
              border: 2px solid #6366f1; /* indigo-500 */
              border-radius: 50%;
              cursor: ns-resize;
            }
        `}</style>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 text-center">Ready to join?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-center">Check your camera and microphone before starting.</p>
        <p className="desktop-instruction text-gray-500 dark:text-gray-400 text-sm mb-4 text-center">
            Use the slider to adjust your video zoom.
        </p>
        <p className="touch-instruction text-gray-500 dark:text-gray-400 text-sm mb-4 text-center">
            Use two fingers to pinch and zoom the video.
        </p>

        <div className="w-full flex justify-center items-center mb-6">
            <div className="relative">
                <div 
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-800 shadow-lg border-2 border-slate-300 dark:border-gray-700 relative cursor-grab touch-none"
                >
                    <VideoPlayer
                        stream={localStream}
                        muted={true}
                        style={{
                            transform: `scale(${zoom})`,
                            transition: isPinching ? 'none' : 'transform 0.1s linear',
                        }}
                     />
                    {zoom > 1.05 && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-full pointer-events-none" aria-live="polite">
                            {zoom.toFixed(1)}x
                        </div>
                    )}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button 
                            onClick={onToggleMute} 
                            className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-300 hover:bg-slate-400/80 dark:bg-gray-800/60 dark:hover:bg-gray-700/80 backdrop-blur-sm'}`}
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <UnmuteIcon className="w-6 h-6 text-white"/> : <MuteIcon className="w-6 h-6 text-slate-800 dark:text-white" />}
                        </button>
                        <button 
                            onClick={onToggleVideo} 
                            className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-300 hover:bg-slate-400/80 dark:bg-gray-800/60 dark:hover:bg-gray-700/80 backdrop-blur-sm'}`}
                            aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
                            title={isVideoOff ? 'Turn video on' : 'Turn video off'}
                        >
                            {isVideoOff ? <VideoOffIcon className="w-6 h-6 text-white"/> : <VideoOnIcon className="w-6 h-6 text-slate-800 dark:text-white" />}
                        </button>
                    </div>
                </div>
                {!isTouchDevice && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-full ml-8 h-48 flex items-center justify-center">
                        <input
                            type="range"
                            min="1"
                            max="4"
                            step="0.1"
                            value={zoom}
                            onChange={handleSliderChange}
                            className="zoom-slider"
                            aria-label="Video zoom"
                        />
                    </div>
                )}
            </div>
        </div>


        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <button 
                onClick={handleCancel} 
                className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors order-2 sm:order-1"
            >
                Back
            </button>
            <button 
                onClick={handleConfirm} 
                className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-gradient-to-r dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105 order-1 sm:order-2"
            >
                Join Now
            </button>
        </div>
         <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default Lobby;