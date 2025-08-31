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

const HangUpIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a11.942 11.942 0 0 0 6.105 6.105c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-1.5a.75.75 0 0 0-1.5 0v1.5a4.5 4.5 0 0 0 4.5 4.5h2.25a4.5 4.5 0 0 0 4.5-4.5v-6.253c0-1.42-1.04-2.626-2.435-2.884l-4.423-1.105a.375.375 0 0 0-.39.139l-.97 1.293a.375.375 0 0 1-.523.016a9.942 9.942 0 0 0-4.636-4.636a.375.375 0 0 1 .016-.523l1.293-.97a.375.375 0 0 0 .139-.39L6.353 3.42A2.85 2.85 0 0 0 4.872 1.5H3.5a1.5 1.5 0 0 0-1.5 1.5v1.5Z" clipRule="evenodd" />
  </svg>
);


const Controls = forwardRef<HTMLDivElement, ControlsProps>(({ onToggleMute, onToggleVideo, onHangUp, isMuted, isVideoOff, onPointerDown }, ref) => {
  return (
    <div 
      ref={ref}
      onPointerDown={onPointerDown}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-3 rounded-full shadow-lg cursor-move touch-action-none border border-slate-300/70 dark:border-white/10"
    >
      <button 
        onClick={onToggleMute} 
        className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-300 hover:bg-slate-400/80 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <UnmuteIcon className="w-6 h-6 text-white"/> : <MuteIcon className="w-6 h-6 text-slate-800 dark:text-white" />}
      </button>
      <button 
        onClick={onToggleVideo} 
        className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-300 hover:bg-slate-400/80 dark:bg-gray-600 dark:hover:bg-gray-500'}`}
        aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
        title={isVideoOff ? 'Turn video on' : 'Turn video off'}
      >
        {isVideoOff ? <VideoOffIcon className="w-6 h-6 text-white"/> : <VideoOnIcon className="w-6 h-6 text-slate-800 dark:text-white" />}
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