import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { CallState, CallHistoryEntry, PinnedEntry } from './types';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import ConnectionManager from './components/ConnectionManager';
import CallHistory from './components/CallHistory';
import PinnedCalls from './components/PinnedCalls';
import Tools from './components/Tools';
import About from './components/About';
import { playIncomingSound, playConnectedSound, playEndedSound } from './utils/sounds';
import { getHistory, saveHistory } from './utils/history';
import { getPinned, savePinned } from './utils/pins';
import { formatTime } from './utils/format';

const UnmuteIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.998 4.5a7.5 7.5 0 0 1 7.5 7.5v3.665l-3.42-3.42a.75.75 0 0 0-1.06 1.06l4.243 4.242-1.06 1.06-4.243-4.242a.75.75 0 0 0-1.06 1.06l3.42 3.42V19.5a.75.75 0 0 1-1.5 0v-2.131A7.502 7.502 0 0 1 4.5 12.165v-3.665a7.5 7.5 0 0 1 7.498-7.5Z" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.53 3.53 20.47 20.47" />
</svg>
);

const VideoOffIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 4.5 21.75m11.25-11.25 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
</svg>
);

const App: React.FC = () => {
  const {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isVideoOff,
    callState,
    errorMessage,
    callId,
    startCall,
    joinCall,
    toggleMute,
    toggleVideo,
    hangUp,
    reset,
  } = useWebRTC();

  const [joinCallId, setJoinCallId] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [pinned, setPinned] = useState<PinnedEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'recent' | 'pinned' | 'tools' | 'about'>('new');
  
  const currentCallInfoRef = useRef<{ id: string, startTime: number } | null>(null);
  const prevCallStateRef = useRef<CallState | undefined>(undefined);
  
  useEffect(() => {
    // Load persisted history and pinned calls from localStorage on initial app load.
    setHistory(getHistory());
    setPinned(getPinned());
  }, []);

  useEffect(() => {
    const prevState = prevCallStateRef.current;
    
    if (prevState === callState) return;

    switch (callState) {
      case CallState.CREATING_ANSWER:
        playIncomingSound();
        break;
      case CallState.CONNECTED:
        playConnectedSound();
        if (callId) {
          currentCallInfoRef.current = { id: callId, startTime: Date.now() };
        }
        break;
      case CallState.ENDED:
        playEndedSound();
        if (currentCallInfoRef.current) {
          const duration = Math.round((Date.now() - currentCallInfoRef.current.startTime) / 1000);
          
          if (duration > 3) { // Only save calls longer than 3 seconds
            const newEntry: CallHistoryEntry = {
              id: currentCallInfoRef.current.id,
              timestamp: currentCallInfoRef.current.startTime,
              duration: duration,
              alias: pinned.find(p => p.id === currentCallInfoRef.current!.id)?.alias,
            };
            
            setHistory(prevHistory => {
              const updatedHistory = [newEntry, ...prevHistory.filter(h => h.id !== newEntry.id || h.timestamp !== newEntry.timestamp)];
              saveHistory(updatedHistory);
              return updatedHistory;
            });
          }
        }
        currentCallInfoRef.current = null;
        break;
    }

    prevCallStateRef.current = callState;
  }, [callState, callId, pinned]);

  useEffect(() => {
    if (callState === CallState.CONNECTED) {
      setElapsedTime(0); // Reset timer on new connection
      const timerId = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);

      return () => clearInterval(timerId); // Cleanup on dismount or state change
    }
  }, [callState]);
  
  const handleHangUp = () => {
    hangUp();
    setJoinCallId('');
  };

  const handleReset = () => {
    reset();
    setJoinCallId('');
  };
  
  const handleJoinCall = () => {
    if (joinCallId.trim()) {
      joinCall(joinCallId.trim().toLowerCase());
    }
  };
  
  const handleRejoin = (id: string) => {
    setJoinCallId(id);
    setActiveTab('new');
    joinCall(id);
  };

  const handleUpdateHistoryAlias = (timestamp: number, alias: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.map(entry =>
        entry.timestamp === timestamp ? { ...entry, alias: alias || undefined } : entry
      );
      saveHistory(updatedHistory);
      // Also update the alias in the pinned list if it exists there
      const entryToUpdate = updatedHistory.find(e => e.timestamp === timestamp);
      if(entryToUpdate) {
        handleUpdatePinnedAlias(entryToUpdate.id, alias);
      }
      return updatedHistory;
    });
  };

  const handleTogglePin = useCallback((entry: CallHistoryEntry | PinnedEntry) => {
    setPinned(prevPinned => {
      const isPinned = prevPinned.some(p => p.id === entry.id);
      let updatedPinned: PinnedEntry[];
      if (isPinned) {
        updatedPinned = prevPinned.filter(p => p.id !== entry.id);
      } else {
        const newPin: PinnedEntry = { id: entry.id, alias: entry.alias };
        updatedPinned = [...prevPinned, newPin].sort((a, b) => (a.alias || a.id).localeCompare(b.alias || b.id));
      }
      // Persist the updated list of pinned calls to localStorage.
      savePinned(updatedPinned);
      return updatedPinned;
    });
  }, []);

  const handleUnpin = useCallback((id: string) => {
    handleTogglePin({ id });
  }, [handleTogglePin]);

  const handleUpdatePinnedAlias = (id: string, alias: string) => {
    setPinned(prevPinned => {
      const updatedPinned = prevPinned.map(p =>
        p.id === id ? { ...p, alias: alias || undefined } : p
      );
      // Persist the alias change to localStorage.
      savePinned(updatedPinned);
      return updatedPinned;
    });
    // Also update history entries with the same ID
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(entry => 
            entry.id === id ? { ...entry, alias: alias || undefined } : entry
        );
        saveHistory(updatedHistory);
        return updatedHistory;
    });
  };
  
  const handleRestore = (data: { history: CallHistoryEntry[], pinned: PinnedEntry[] }) => {
    try {
      saveHistory(data.history);
      savePinned(data.pinned);
      alert('Restore successful! The application will now reload to apply the changes.');
      window.location.reload();
    } catch (error) {
      console.error("Failed to restore data:", error);
      alert("An error occurred during the restore process. Please check the console for details.");
    }
  };


  const renderIdleContent = () => {
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    const pinnedIds = new Set(pinned.map(p => p.id));
    
    return (
       <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm px-4">
         <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(40, 43, 54, 0.5); border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338ca; }
          `}</style>
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">P2P Video Call</h1>
            <p className="text-gray-400 mt-2">Secure, serverless video chat.</p>
        </div>

        <div className="w-full mt-4">
          <div className="flex border-b border-gray-700">
             <button 
              onClick={() => setActiveTab('new')} 
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'new' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              New
            </button>
            <button 
              onClick={() => setActiveTab('recent')} 
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'recent' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setActiveTab('pinned')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'pinned' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Pinned
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'tools' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              Tools
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'about' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              About
            </button>
          </div>
          
          <div className="mt-6">
            {activeTab === 'new' && (
              <div className="w-full space-y-4 p-6 bg-gray-800/50 rounded-lg">
                <div className="space-y-2">
                   <label htmlFor="call-id-input" className="font-medium text-gray-300">Join a Call</label>
                   <div className="flex gap-2">
                      <input 
                        id="call-id-input"
                        value={joinCallId}
                        onChange={(e) => setJoinCallId(e.target.value)}
                        placeholder="Enter call ID..."
                        className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Enter call ID to join"
                      />
                      <button 
                        onClick={handleJoinCall} 
                        disabled={!joinCallId.trim()}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        aria-label="Join Call"
                      >
                        Join
                      </button>
                   </div>
                </div>
                 <div className="flex items-center gap-4">
                  <hr className="flex-grow border-gray-700" />
                  <span className="text-gray-500 font-medium">OR</span>
                  <hr className="flex-grow border-gray-700" />
                </div>
                 <button onClick={startCall} className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
                  Create a New Call
                </button>
              </div>
            )}
            {activeTab === 'recent' && (
              <CallHistory 
                history={sortedHistory} 
                onRejoin={handleRejoin} 
                onUpdateAlias={handleUpdateHistoryAlias}
                onTogglePin={handleTogglePin}
                pinnedIds={pinnedIds}
              />
            )}
            {activeTab === 'pinned' && (
              <PinnedCalls 
                pins={pinned}
                onRejoin={handleRejoin}
                onUpdateAlias={handleUpdatePinnedAlias}
                onUnpin={handleUnpin}
              />
            )}
             {activeTab === 'tools' && (
              <Tools onRestore={handleRestore} />
            )}
            {activeTab === 'about' && (
              <About />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if ((callState === CallState.CREATING_OFFER || callState === CallState.JOINING) && !localStream) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite">
          <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-200">Starting Call...</h2>
          <p className="text-gray-400 max-w-xs">Please allow camera and microphone access when prompted by your browser.</p>
        </div>
      );
    }

    switch (callState) {
      case CallState.CONNECTED:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-x-4 gap-y-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg z-10 max-w-[90vw] flex-wrap" aria-live="polite">
              <div className="font-mono text-lg tracking-wider" aria-live="off">
                {formatTime(elapsedTime)}
              </div>
              {(isMuted || isVideoOff) && (
                  <div className="h-5 border-l border-gray-500 mx-2 hidden sm:block"></div>
              )}
              <div className="flex items-center gap-4">
                  {isMuted && (
                      <div className="flex items-center gap-1.5 text-yellow-400 animate-pulse" title="You are muted">
                          <UnmuteIcon className="w-5 h-5" />
                          <span className="font-semibold text-sm">Muted</span>
                      </div>
                  )}
                  {isVideoOff && (
                      <div className="flex items-center gap-1.5 text-yellow-400 animate-pulse" title="Your video is off">
                          <VideoOffIcon className="w-5 h-5" />
                          <span className="font-semibold text-sm">Video Off</span>
                      </div>
                  )}
              </div>
            </div>
            <div className="w-full h-full bg-black">
              <VideoPlayer stream={remoteStream} muted={false} />
            </div>
            <div className="absolute bottom-24 md:bottom-6 right-6 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-indigo-500">
              <div className="relative w-full h-full">
                <VideoPlayer stream={localStream} muted={true} />
                {(isMuted || isVideoOff) && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {isMuted && (
                      <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full" title="You are muted" aria-label="You are muted">
                        <UnmuteIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {isVideoOff && (
                      <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full" title="Your video is off" aria-label="Your video is off">
                        <VideoOffIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Controls
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onHangUp={handleHangUp}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
            />
          </div>
        );
      case CallState.IDLE:
        return renderIdleContent();
      case CallState.ENDED:
        return (
           <div className="flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold text-center">Call Ended</h2>
            <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
              Back to Home
            </button>
          </div>
        );
      case CallState.MEDIA_ERROR:
        return (
           <div className="flex flex-col items-center justify-center gap-4 text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
             <h2 className="text-3xl font-bold text-red-400">Device Access Error</h2>
             <p className="text-gray-400 max-w-sm">{errorMessage || 'Could not access your camera or microphone.'}</p>
             <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
               Try Again
             </button>
           </div>
        );
      default:
        return (
          <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <h2 className="text-xl font-semibold mb-2 text-center">Your Video</h2>
                  <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
                    <VideoPlayer stream={localStream} muted={true} />
                     {(isMuted || isVideoOff) && (
                      <div className="absolute top-2 left-2 flex items-center gap-2">
                        {isMuted && (
                          <div className="p-2 bg-black/60 backdrop-blur-sm rounded-full" title="You are muted" aria-label="You are muted">
                            <UnmuteIcon className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {isVideoOff && (
                          <div className="p-2 bg-black/60 backdrop-blur-sm rounded-full" title="Your video is off" aria-label="Your video is off">
                            <VideoOffIcon className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ConnectionManager 
                  callState={callState}
                  connectionState={connectionState}
                  callId={callId}
                  onCancel={handleHangUp}
                />
            </div>
          </div>
        );
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-900 text-white">
      {renderContent()}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono z-50">
        State: {callState}
      </div>
    </main>
  );
};

export default App;