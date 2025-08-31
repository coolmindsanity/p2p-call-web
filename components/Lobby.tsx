import React from 'react';
import VideoPlayer from './VideoPlayer';

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

const Lobby: React.FC<LobbyProps> = ({
  localStream,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl p-4 md:p-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 text-center">Ready to join?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">Check your camera and microphone before starting.</p>

        <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-800 shadow-lg border-2 border-slate-300 dark:border-gray-700 relative mb-6">
            <VideoPlayer stream={localStream} muted={true} />
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

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <button 
                onClick={onCancel} 
                className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors order-2 sm:order-1"
            >
                Back
            </button>
            <button 
                onClick={onConfirm} 
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
