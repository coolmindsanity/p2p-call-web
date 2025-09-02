import React, { useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import { usePinchToZoom } from '../hooks/usePinchToZoom';
import { useDraggable } from '../hooks/useDraggable';

interface LocalVideoPreviewProps {
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

const UnmuteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
       <path d="M13.5 4.06c0-1.336-1.076-2.412-2.411-2.412A2.412 2.412 0 0 0 8.677 4.06v8.682a2.412 2.412 0 0 0 4.823 0V4.06Z" />
       <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75a.75.75 0 0 1 .75-.75Z" />
       <path fillRule="evenodd" d="M2.023 2.023a.75.75 0 0 1 1.06 0L21.977 20.92a.75.75 0 1 1-1.06 1.06L2.023 3.083a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
   </svg>
);
   
const VideoOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
       <path d="M3.53 3.53a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 0 0 1.06-1.06l-18-18ZM20.25 11.625l1.58-1.58a1.5 1.5 0 0 0-1.06-2.56L18 8.935V7.5a3 3 0 0 0-3-3h-2.25l-1.822-1.823a.75.75 0 0 0-1.06 0l-.146.147-1.125 1.125a.75.75 0 0 0 0 1.06l.12.12L12 8.25V7.5h3v3.75l-4.28 4.28-.625.625a.75.75 0 0 0 0 1.06l.625.625 4.28 4.28V16.5h.75a3 3 0 0 0 3-3V11.625ZM4.5 19.5h8.25a3 3 0 0 0 3-3V13.125l-3.375-3.375L9 13.125v3.375h-3v-3.375l-.375-.375-1.5-1.5V16.5a3 3 0 0 0 3 3Z" />
   </svg>
);

const LocalVideoPreview: React.FC<LocalVideoPreviewProps> = ({ stream, isMuted, isVideoOff }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onPointerDown } = useDraggable(containerRef);
  const { zoom, onTouchStart, onTouchMove, onTouchEnd, isPinching } = usePinchToZoom();

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      className="absolute bottom-6 right-6 w-32 h-auto md:w-48 aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-white/20 touch-none cursor-move select-none z-20"
    >
      <div 
        className="w-full h-full relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <VideoPlayer 
            stream={stream} 
            muted={true}
            style={{
                transform: `scale(${zoom})`,
                transition: isPinching ? 'none' : 'transform 0.1s linear',
            }}
        />
        {(isMuted || isVideoOff) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 pointer-events-none">
            {isMuted && <UnmuteIcon className="w-6 h-6 text-white" />}
            {isVideoOff && <VideoOffIcon className="w-6 h-6 text-white" />}
          </div>
        )}
        {zoom > 1.05 && (
            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs font-mono px-1.5 py-0.5 rounded-full pointer-events-none" aria-live="polite">
                {zoom.toFixed(1)}x
            </div>
        )}
      </div>
    </div>
  );
};

export default LocalVideoPreview;
