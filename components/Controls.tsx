import React, { forwardRef } from 'react';

interface ControlsProps {
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const MuteIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const UnmuteIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="2" x2="22" y1="2" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5"/>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 .43 1.57"/>
    <path d="M10.43 5.43A2.96 2.96 0 0 1 12 5a3 3 0 0 1 3 3v2.57"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const VideoOnIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m22 8-6 4 6 4V8Z"/>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
  </svg>
);

const VideoOffIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 16v-3.27a4 4 0 0 0-1.27-2.83L8 4H2v16h13.73"/>
    <path d="m22 8-6 4 6 4V8Z"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const HangUpIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.68 13.31a16 16 0 0 0 3.41 3.41l3.17-3.17a2 2 0 0 1 2.83 0l1.27 1.27a2 2 0 0 1 0 2.83l-1.11 1.11a2 2 0 0 1-3.11 0h0a16 16 0 0 1-7.01-4.05"/>
        <path d="m2.29 2.29 19.42 19.42"/>
        <path d="M3.72 2.72a2 2 0 0 1 2.83 0l1.27 1.27a2 2 0 0 1 0 2.83L4.7 10.95a16 16 0 0 0 4.05 7.01 2 2 0 0 1 0 3.11l-1.11 1.11a2 2 0 0 1-2.83 0L2.71 16.28a2 2 0 0 1 0-2.83z"/>
    </svg>
);


const Controls = forwardRef<HTMLDivElement, ControlsProps>(({ onToggleMute, onToggleVideo, onHangUp, isMuted, isVideoOff, onPointerDown }, ref) => {
  return (
    <div 
      ref={ref}
      onPointerDown={onPointerDown}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 rounded-full shadow-lg cursor-move touch-none border border-white/20"
    >
      <button 
        onClick={onToggleMute} 
        className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-500/50 hover:bg-gray-500/70'}`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <UnmuteIcon className="w-6 h-6 text-white"/> : <MuteIcon className="w-6 h-6 text-white" />}
      </button>
      <button 
        onClick={onToggleVideo} 
        className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-500/50 hover:bg-gray-500/70'}`}
        aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
        title={isVideoOff ? 'Turn video on' : 'Turn video off'}
      >
        {isVideoOff ? <VideoOffIcon className="w-6 h-6 text-white"/> : <VideoOnIcon className="w-6 h-6 text-white" />}
      </button>
      <button 
        onClick={onHangUp} 
        className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
        aria-label="Hang up"
        title="Hang up"
      >
        <HangUpIcon className="w-6 h-6 text-white" />
      </button>
    </div>
  );
});

export default Controls;