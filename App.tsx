import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { CallState, CallHistoryEntry, PinnedEntry, CallStats, IncomingCall } from './types';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import ConnectionManager from './components/ConnectionManager';
import CallHistory from './components/CallHistory';
import PinnedCalls from './components/PinnedCalls';
import Tools from './components/Tools';
import About from './components/About';
import IncomingCallScreen from './components/IncomingCall';
import Lobby from './components/Lobby';
import { playIncomingSound, playConnectedSound, playEndedSound, playRingingSound, stopRingingSound } from './utils/sounds';
import { getHistory, saveHistory } from './utils/history';
import { getPinned, savePinned } from './utils/pins';
import { getUserId } from './utils/user';
import { db } from './firebase';
import { formatTime } from './utils/format';
import { useDraggable } from './hooks/useDraggable';

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

const LockIcon: React.FC<{className?: string}> = ({className}) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
</svg>
);

const ConnectionStatusIndicator: React.FC<{ callState: CallState, connectionState: RTCPeerConnectionState, isE2EEActive: boolean }> = ({ callState, connectionState, isE2EEActive }) => {
    let color = 'bg-gray-400 dark:bg-gray-500';
    let text = 'Unknown';
    let animate = false;

    if (callState === CallState.RECONNECTING) {
        color = 'bg-yellow-500';
        text = 'Reconnecting';
        animate = true;
    } else {
        switch (connectionState) {
            case 'connecting':
                color = 'bg-yellow-500';
                text = 'Connecting';
                animate = true;
                break;
            case 'connected':
                color = 'bg-green-500';
                text = 'Connected';
                break;
            case 'disconnected':
                color = 'bg-orange-500';
                text = 'Connection Lost';
                break;
            case 'failed':
                color = 'bg-red-500';
                text = 'Failed';
                break;
            case 'new':
                color = 'bg-blue-500';
                text = 'Initializing';
                animate = true;
                break;
            case 'closed':
                 color = 'bg-gray-400 dark:bg-gray-500';
                 text = 'Disconnected';
                 break;
        }
    }
    
    return (
        <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-white" title={`Connection Status: ${text}${isE2EEActive ? ' (End-to-End Encrypted)' : ''}`}>
            <span className={`w-3 h-3 rounded-full ${color} ${animate ? 'animate-pulse' : ''}`}></span>
            <span className="font-semibold hidden sm:block">{text}</span>
            {isE2EEActive && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 ml-1 border-l border-gray-300 dark:border-gray-600 pl-2">
                    <LockIcon className="w-4 h-4" />
                    <span className="font-semibold text-sm hidden sm:block">Encrypted</span>
                </div>
            )}
        </div>
    );
};

const DeveloperStats: React.FC<{ stats: CallStats | null, callState: CallState }> = ({ stats, callState }) => {
  if (!stats) return null;

  const getBitrateColor = (bitrate: number | null): string => {
    if (bitrate === null) return 'text-gray-500 dark:text-gray-400';
    if (bitrate > 500) return 'text-green-500 dark:text-green-400';
    if (bitrate > 100) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  const statItem = (label: string, value: number | null, unit: string, colorClass: string = 'text-gray-500 dark:text-gray-400') => (
    <div className="flex items-center gap-1.5" title={label}>
      <span className="font-semibold">{label}:</span>
      <span className={colorClass}>{value !== null ? value : 'N/A'}{unit}</span>
    </div>
  );

  const isConnected = callState === CallState.CONNECTED;

  return (
    <div className="text-xs font-mono hidden md:flex items-center gap-x-3 text-gray-500 dark:text-gray-400 border-l border-gray-700 dark:border-gray-600 pl-3">
      {isConnected && (
        <>
          {statItem('RTT', stats.roundTripTime, 'ms')}
          {statItem('Jitter', stats.jitter, 'ms')}
          {statItem('Loss', stats.packetsLost, '')}
          <div className="h-4 border-l border-gray-600 dark:border-gray-700"></div>
        </>
      )}
      {statItem('Up', stats.uploadBitrate, 'kbps', getBitrateColor(stats.uploadBitrate))}
      {statItem('Down', stats.downloadBitrate, 'kbps', getBitrateColor(stats.downloadBitrate))}
    </div>
  );
};

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
    peerId,
    isE2EEActive,
    callStats,
    enterLobby,
    startCall,
    joinCall,
    ringUser,
    declineCall,
    toggleMute,
    toggleVideo,
    hangUp,
    reset,
  } = useWebRTC();

  const [userId, setUserId] = useState<string | null>(null);
  const [joinCallId, setJoinCallId] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [pinned, setPinned] = useState<PinnedEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'recent' | 'pinned' | 'tools' | 'about'>('new');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isDevMode, setIsDevMode] = useState<boolean>(() => localStorage.getItem('p2p-dev-mode') === 'true');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('p2p-theme') as 'light' | 'dark') || 'dark'
  );
  const [lobbyAction, setLobbyAction] = useState<{type: 'start' | 'join' | 'ring', target?: PinnedEntry | string } | null>(null);
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const currentCallInfoRef = useRef<{ callId: string, startTime: number, peerId?: string } | null>(null);
  const prevCallStateRef = useRef<CallState | undefined>(undefined);
  
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const controlsContainerRef = useRef<HTMLDivElement>(null);

  const { onPointerDown: onLocalVideoPointerDown } = useDraggable(localVideoContainerRef);
  const { onPointerDown: onControlsPointerDown } = useDraggable(controlsContainerRef);
  
  useEffect(() => {
    // When the active tab changes, calculate the new position for the indicator.
    const activeTabElement = tabsRef.current?.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement as HTMLElement;
        setIndicatorStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
        });
    }
  }, [activeTab]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('p2p-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('p2p-dev-mode', String(isDevMode));
  }, [isDevMode]);

  useEffect(() => {
    // Load persisted data and user ID on initial app load.
    setHistory(getHistory());
    setPinned(getPinned());
    setUserId(getUserId());
  }, []);

  // Effect to listen for incoming calls
  useEffect(() => {
    if (!userId) return;

    const incomingCallRef = db.ref(`users/${userId}/incomingCall`);
    
    const listener = (snapshot: any) => {
      const callData = snapshot.val();
      if (callData && callState === CallState.IDLE) {
        setIncomingCall(callData);
      } else {
        setIncomingCall(null);
      }
    };

    incomingCallRef.on('value', listener);

    return () => {
      incomingCallRef.off('value', listener);
    };
  }, [userId, callState]);

  useEffect(() => {
    const prevState = prevCallStateRef.current;
    
    if (prevState === callState) return;

    // Stop any sounds from previous states
    stopRingingSound();

    switch (callState) {
      case CallState.INCOMING_CALL:
        playRingingSound();
        break;
      case CallState.CREATING_ANSWER:
        playIncomingSound();
        break;
      case CallState.CONNECTED:
        playConnectedSound();
        if (callId && !currentCallInfoRef.current) {
          currentCallInfoRef.current = { callId: callId, startTime: Date.now(), peerId: peerId || undefined };
        }
        break;
      case CallState.ENDED:
        playEndedSound();
        if (currentCallInfoRef.current) {
          const duration = Math.round((Date.now() - currentCallInfoRef.current.startTime) / 1000);
          
          if (duration > 3) { // Only save calls longer than 3 seconds
            const newEntry: CallHistoryEntry = {
              callId: currentCallInfoRef.current.callId,
              timestamp: currentCallInfoRef.current.startTime,
              duration: duration,
              peerId: currentCallInfoRef.current.peerId,
              alias: pinned.find(p => p.callId === currentCallInfoRef.current!.callId)?.alias,
            };
            
            setHistory(prevHistory => {
              const updatedHistory = [newEntry, ...prevHistory.filter(h => h.callId !== newEntry.callId || h.timestamp !== newEntry.timestamp)];
              saveHistory(updatedHistory);
              return updatedHistory;
            });
          }
        }
        currentCallInfoRef.current = null;
        break;
    }

    prevCallStateRef.current = callState;
  }, [callState, callId, pinned, peerId]);

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
    setLobbyAction(null);
  };

  const handleEnterLobby = (action: 'start' | 'join' | 'ring', target?: PinnedEntry | string) => {
    setLobbyAction({ type: action, target });
    enterLobby();
  };
  
  const handleLobbyConfirm = () => {
    if (!lobbyAction) return;
    
    switch(lobbyAction.type) {
        case 'start':
            startCall();
            break;
        case 'join':
            if (typeof lobbyAction.target === 'string') {
                joinCall(lobbyAction.target);
            }
            break;
        case 'ring':
             if (typeof lobbyAction.target === 'object') {
                ringUser(lobbyAction.target as PinnedEntry);
            }
            break;
    }
    setLobbyAction(null);
  };

  const handleJoinCall = () => {
    if (joinCallId.trim()) {
      handleEnterLobby('join', joinCallId.trim().toLowerCase());
    }
  };

  const handleCall = (pin: PinnedEntry) => {
    if (pin.peerId) {
        handleEnterLobby('ring', pin);
    } else {
        handleEnterLobby('join', pin.callId);
    }
  };
  
  const handleRejoin = (callId: string) => {
    const formattedCallId = callId.trim().toLowerCase();
    setJoinCallId(formattedCallId);
    setActiveTab('new');
    handleEnterLobby('join', formattedCallId);
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
        handleUpdatePinnedAlias(entryToUpdate.callId, alias);
      }
      return updatedHistory;
    });
  };

  const handleTogglePin = useCallback((entry: CallHistoryEntry | PinnedEntry) => {
    setPinned(prevPinned => {
      const isPinned = prevPinned.some(p => p.callId === entry.callId);
      let updatedPinned: PinnedEntry[];
      if (isPinned) {
        updatedPinned = prevPinned.filter(p => p.callId !== entry.callId);
      } else {
        const newPin: PinnedEntry = { callId: entry.callId, alias: entry.alias, peerId: (entry as CallHistoryEntry).peerId };
        updatedPinned = [...prevPinned, newPin].sort((a, b) => (a.alias || a.callId).localeCompare(b.alias || b.callId));
      }
      // Persist the updated list of pinned calls to localStorage.
      savePinned(updatedPinned);
      return updatedPinned;
    });
  }, []);

  const handleUnpin = useCallback((callId: string) => {
    handleTogglePin({ callId });
  }, [handleTogglePin]);

  const handleUpdatePinnedAlias = (callId: string, alias: string) => {
    setPinned(prevPinned => {
      const updatedPinned = prevPinned.map(p =>
        p.callId === callId ? { ...p, alias: alias || undefined } : p
      );
      // Persist the alias change to localStorage.
      savePinned(updatedPinned);
      return updatedPinned;
    });
    // Also update history entries with the same ID
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(entry => 
            entry.callId === callId ? { ...entry, alias: alias || undefined } : entry
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

  const handleAcceptCall = () => {
    if (incomingCall) {
        joinCall(incomingCall.callId);
        setIncomingCall(null);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
        // We need to inform the caller that the call was declined.
        // This is done by writing to the call document.
        const callRef = db.ref(`calls/${incomingCall.callId}`);
        callRef.update({ declined: true });

        // Clean up the incoming call notification for this user.
        const myIncomingCallRef = db.ref(`users/${userId}/incomingCall`);
        myIncomingCallRef.remove();

        setIncomingCall(null);
    }
  };


  const renderIdleContent = () => {
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    const pinnedIds = new Set(pinned.map(p => p.callId));
    
    return (
       <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm px-4">
         <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(40, 43, 54, 0.5); border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4338ca; }
            
            @keyframes fade-in-down {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }

            @keyframes pop {
              0% { transform: scale(1); }
              50% { transform: scale(1.4); }
              100% { transform: scale(1); }
            }
            .animate-pop { animation: pop 0.3s ease-out; }

            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          `}</style>
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">P2P Video Call</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Secure, serverless video chat.</p>
        </div>

        <div className="w-full mt-4">
          <div ref={tabsRef} className="relative flex border-b border-gray-200 dark:border-gray-700">
             <button
              data-tab-id="new"
              onClick={() => setActiveTab('new')} 
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'new' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              New
            </button>
            <button 
              data-tab-id="recent"
              onClick={() => setActiveTab('recent')} 
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'recent' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Recent
            </button>
            <button 
              data-tab-id="pinned"
              onClick={() => setActiveTab('pinned')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'pinned' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Pinned
            </button>
            <button 
              data-tab-id="tools"
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'tools' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Tools
            </button>
            <button 
              data-tab-id="about"
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'about' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              About
            </button>
            <div
                className="absolute bottom-[-1px] h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300 ease-in-out"
                style={indicatorStyle}
            />
          </div>
          
          <div className="mt-6 min-h-[700px]">
            {activeTab === 'new' && (
              <div className="w-full space-y-4 p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <div className="space-y-2">
                   <label htmlFor="call-id-input" className="font-medium text-gray-700 dark:text-gray-300">Join a Call</label>
                   <div className="flex gap-2">
                      <input 
                        id="call-id-input"
                        value={joinCallId}
                        onChange={(e) => setJoinCallId(e.target.value)}
                        placeholder="Enter call ID..."
                        className="flex-grow px-4 py-3 bg-slate-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                        aria-label="Enter call ID to join"
                      />
                      <button 
                        onClick={handleJoinCall} 
                        disabled={!joinCallId.trim()}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-600 dark:hover:from-teal-600 dark:hover:to-teal-700 rounded-lg font-semibold text-white transition-all disabled:bg-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:text-gray-200 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                        aria-label="Join Call"
                      >
                        Join
                      </button>
                   </div>
                </div>
                 <div className="flex items-center gap-4">
                  <hr className="flex-grow border-gray-300 dark:border-gray-700" />
                  <span className="text-gray-400 dark:text-gray-500 font-medium">OR</span>
                  <hr className="flex-grow border-gray-300 dark:border-gray-700" />
                </div>
                 <button onClick={() => handleEnterLobby('start')} className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-gradient-to-r dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
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
                onCall={handleCall}
                onUpdateAlias={handleUpdatePinnedAlias}
                onUnpin={handleUnpin}
              />
            )}
             {activeTab === 'tools' && (
              <Tools userId={userId} onRestore={handleRestore} />
            )}
            {activeTab === 'about' && (
              <About 
                isDevMode={isDevMode} 
                onToggleDevMode={() => setIsDevMode(p => !p)} 
                theme={theme}
                onToggleTheme={toggleTheme}
              />
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
          <svg className="animate-spin h-10 w-10 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Starting Call...</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">Please allow camera and microphone access when prompted by your browser.</p>
        </div>
      );
    }

    switch (callState) {
      case CallState.INCOMING_CALL:
          if (!incomingCall) return renderIdleContent();
          return <IncomingCallScreen callInfo={incomingCall} onAccept={handleAcceptCall} onDecline={handleDeclineCall} />;
      case CallState.LOBBY:
        return (
            <Lobby
                localStream={localStream}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onConfirm={handleLobbyConfirm}
                onCancel={handleReset}
            />
        );
      case CallState.CONNECTED:
      case CallState.RECONNECTING:
        const topBarItems: React.ReactNode[] = [];
        topBarItems.push(<ConnectionStatusIndicator key="status" callState={callState} connectionState={connectionState} isE2EEActive={isE2EEActive} />);
        topBarItems.push(
            <div key="timer" className="font-mono text-lg tracking-wider text-slate-800 dark:text-white" aria-live="off">
                {formatTime(elapsedTime)}
            </div>
        );
        const muteVideoStatus = [];
        if (isMuted) {
            muteVideoStatus.push(
                <div key="mute" className="flex items-center gap-1.5 text-amber-600 dark:text-yellow-300 animate-pulse animate-fade-in" title="You are muted">
                    <UnmuteIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Muted</span>
                </div>
            );
        }
        if (isVideoOff) {
            muteVideoStatus.push(
                <div key="video" className="flex items-center gap-1.5 text-amber-600 dark:text-yellow-300 animate-pulse animate-fade-in" title="Your video is off">
                    <VideoOffIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Video Off</span>
                </div>
            );
        }
        if (muteVideoStatus.length > 0) {
            topBarItems.push(<div key="mute-video-group" className="flex items-center gap-4">{muteVideoStatus}</div>);
        }
        if (isDevMode && callStats) {
            topBarItems.push(<DeveloperStats key="dev-stats" stats={callStats} callState={callState} />);
        }
        
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {callState === CallState.RECONNECTING && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20" role="status">
                    <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-200">Connection Lost</h2>
                    <p className="text-gray-400">Attempting to reconnect...</p>
                </div>
            )}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-x-3 bg-white/60 dark:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg z-10 max-w-[90vw] flex-wrap border border-slate-300/80 dark:border-white/10 shadow-md" aria-live="polite">
              {topBarItems.map((item, index) => (
                  <React.Fragment key={index}>
                      {item}
                      {index < topBarItems.length - 1 && (
                          <div className="h-5 border-l border-gray-400 dark:border-gray-600 hidden sm:block"></div>
                      )}
                  </React.Fragment>
              ))}
            </div>
            <div className="w-full h-full bg-black">
              <VideoPlayer stream={remoteStream} muted={false} />
            </div>
            <div
              ref={localVideoContainerRef}
              onPointerDown={onLocalVideoPointerDown}
              className="absolute bottom-24 md:bottom-6 right-6 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-indigo-500 cursor-move touch-action-none"
            >
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
              ref={controlsContainerRef}
              onPointerDown={onControlsPointerDown}
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
            <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-transform transform hover:scale-105">
              Back to Home
            </button>
          </div>
        );
       case CallState.DECLINED:
        return (
           <div className="flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold text-center text-amber-500 dark:text-amber-400">Call Not Answered</h2>
            <p className="text-gray-500 dark:text-gray-400">The other user did not answer or declined the call.</p>
            <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-transform transform hover:scale-105">
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
             <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">Device Access Error</h2>
             <p className="text-gray-500 dark:text-gray-400 max-w-sm">{errorMessage || 'Could not access your camera or microphone.'}</p>
             <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-transform transform hover:scale-105">
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
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
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
                  peerId={peerId}
                  pinnedContacts={pinned}
                  onCancel={() => callState === CallState.RINGING && callId && peerId ? declineCall(callId, peerId) : handleHangUp()}
                />
            </div>
          </div>
        );
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 text-slate-800 dark:text-white overflow-hidden">
      {renderContent()}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 dark:text-gray-500 font-mono z-50">
        State: {callState}
      </div>
    </main>
  );
};

export default App;