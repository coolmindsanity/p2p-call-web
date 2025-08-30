import React from 'react';

interface ControlsProps {
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

const MuteIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m6 6.375a3.375 3.375 0 0 1-3.375-3.375V1.5m3.375 13.125a3.375 3.375 0 0 0 3.375-3.375V1.5m-3.375 13.125v-1.5" />
  </svg>
);

const UnmuteIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.998 4.5a7.5 7.5 0 0 1 7.5 7.5v3.665l-3.42-3.42a.75.75 0 0 0-1.06 1.06l4.243 4.242-1.06 1.06-4.243-4.242a.75.75 0 0 0-1.06 1.06l3.42 3.42V19.5a.75.75 0 0 1-1.5 0v-2.131A7.502 7.502 0 0 1 4.5 12.165v-3.665a7.5 7.5 0 0 1 7.498-7.5Z" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.53 3.53 20.47 20.47" />
</svg>
);

const VideoOnIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
</svg>
);

const VideoOffIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 4.5 21.75m11.25-11.25 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
</svg>
);

const HangUpIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M19.5 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" transform="rotate(-45 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 2.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M19.5 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" transform="rotate(45 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 2.25v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75M2.25 9.75v1.5m-5.25-1.5v1.5m-5.25-1.5v1.5m3.75 0v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75m3.75 3.75v3.75m-3.75-3.75h3.75m-3.75 0h-3.75" />
  </svg>
);


const Controls: React.FC<ControlsProps> = ({ onToggleMute, onToggleVideo, onHangUp, isMuted, isVideoOff }) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800/70 backdrop-blur-sm p-3 rounded-full shadow-lg">
      <button 
        onClick={onToggleMute} 
        className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'}`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <UnmuteIcon className="w-6 h-6 text-white"/> : <MuteIcon className="w-6 h-6 text-white" />}
      </button>
      <button 
        onClick={onToggleVideo} 
        className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'}`}
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
};

export default Controls;