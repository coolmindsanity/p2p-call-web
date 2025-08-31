import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { CallState, CallHistoryEntry, PinnedEntry, CallStats, IncomingCall, PeerStatus } from './types';
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
import { usePinchToZoom } from './hooks/usePinchToZoom';
import { usePresence } from './hooks/usePresence';
import { usePeerStatus } from './hooks/usePeerStatus';

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
                    <span className="font-semibold text-sm">Encrypted</span>
                </div>
            )}
        </div>
    );
};

const SignalBarsIcon: React.FC<{ level: 'good' | 'average' | 'poor' | 'unknown'; className?: string }> = ({ level, className }) => {
  const levelMap = {
    good: { bars: 4, color: 'text-green-500 dark:text-green-400' },
    average: { bars: 3, color: 'text-yellow-500 dark:text-yellow-400' },
    poor: { bars: 1, color: 'text-red-500 dark:text-red-400' },
    unknown: { bars: 2, color: 'text-gray-400 dark:text-gray-500' },
  };
  const { bars, color } = levelMap[level];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} ${color}`}>
      <path d="M21 4.25a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75Z" opacity={bars >= 4 ? 1 : 0.3} />
      <path d="M16.5 7.25a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75Z" opacity={bars >= 3 ? 1 : 0.3} />
      <path d="M12 10.25a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Z" opacity={bars >= 2 ? 1 : 0.3} />
      <path d="M7.5 13.25a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z" opacity={bars >= 1 ? 1 : 0.3} />
    </svg>
  );
};

const CallQualityIndicator: React.FC<{ stats: CallStats }> = ({ stats }) => {
  const getQualityLevel = (stats: CallStats): 'good' | 'average' | 'poor' | 'unknown' => {
    if (stats.roundTripTime === null || stats.jitter === null) {
      return 'unknown';
    }

    const rtt = stats.roundTripTime;
    const jitter = stats.jitter;
    let score = 0;

    if (rtt < 150) score += 2;
    else if (rtt < 400) score += 1;

    if (jitter < 30) score += 2;
    else if (jitter < 100) score += 1;
    
    if (stats.downloadBitrate !== null && stats.downloadBitrate < 100) score -= 1;
    if (stats.uploadBitrate !== null && stats.uploadBitrate < 100) score -= 1;

    if (score >= 4) return 'good';
    if (score >= 2) return 'average';
    return 'poor';
  };
  
  const qualityLevel = getQualityLevel(stats);

  const levelDetails = {
    good: { text: 'Excellent' },
    average: { text: 'Good' },
    poor: { text: 'Poor' },
    unknown: { text: 'Unknown' },
  };

  const { text } = levelDetails[qualityLevel];
  
  const statItem = (label: string, value: number | null, unit: string) => (
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold">{label}:</span>
      <span>{value !== null ? `${value}${unit}` : 'N/A'}</span>
    </div>
  );
  
  return (
    <div className="group relative flex items-center gap-2 text-sm text-slate-800 dark:text-white border-l border-gray-700 dark:border-gray-600 pl-3" title={`Call Quality: ${text}`}>
      <SignalBarsIcon level={qualityLevel} className="w-5 h-5" />
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-xs text-slate-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono shadow-lg">
        <h4 className="font-bold text-center mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Connection Details</h4>
        <div className="space-y-1">
          {statItem('RTT', stats.roundTripTime, 'ms')}
          {statItem('Jitter', stats.jitter, 'ms')}
          {statItem('Packet Loss', stats.packetsLost, '')}
          <div className="pt-1 mt-1 border-t border-slate-200 dark:border-gray-700"></div>
          {statItem('Upload', stats.uploadBitrate, 'kbps')}
          {statItem('Download', stats.downloadBitrate, 'kbps')}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-50 dark:bg-gray-900 border-r border-b border-slate-200 dark:border-gray-700 rotate-45"></div>
      </div>
    </div>
  );
};

const TechieStats: React.FC<{ stats: CallStats; onClick: () => void }> = ({ stats, onClick }) => {
    const StatItem: React.FC<{ label: string; value: number | null; unit: string }> = ({ label, value, unit }) => (
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">{label}:</span>
          <span className="text-white">{value !== null ? `${value}${unit}` : 'N/A'}</span>
        </div>
    );

    return (
        <div 
            onClick={onClick}
            className="absolute top-24 left-4 w-48 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-xs font-mono shadow-lg z-10 animate-fade-in cursor-pointer"
            aria-live="polite"
            role="status"
            title="Click to hide for this call"
        >
          <h4 className="font-bold text-center text-white mb-2 border-b border-white/20 pb-1">Techie Stats</h4>
          <div className="space-y-1">
            <StatItem label="RTT" value={stats.roundTripTime} unit="ms" />
            <StatItem label="Jitter" value={stats.jitter} unit="ms" />
            <StatItem label="Packet Loss" value={stats.packetsLost} unit="" />
            <div className="pt-1 mt-1 border-t border-white/20"></div>
            <StatItem label="Upload" value={stats.uploadBitrate} unit="kbps" />
            <StatItem label="Download" value={stats.downloadBitrate} unit="kbps" />
          </div>
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
    resolution,
    setResolution,
    enterLobby,
    startCall,
    joinCall,
    ringUser,
    declineCall,
    toggleMute,
    toggleVideo,
    hangUp,
    reset,
    // FIX: Destructure setCallState from the useWebRTC hook to manage call state transitions.
    setCallState,
  } = useWebRTC(localStorage.getItem('p2p-resolution') || '720p');

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
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showTechieStatsForCall, setShowTechieStatsForCall] = useState(true);
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const currentCallInfoRef = useRef<{ callId: string, startTime: number, peerId?: string } | null>(null);
  const prevCallStateRef = useRef<CallState | undefined>(undefined);
  
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);

  const { onPointerDown: onLocalVideoPointerDown } = useDraggable(localVideoContainerRef);
  const { onPointerDown: onControlsPointerDown } = useDraggable(controlsContainerRef);
  const { zoom, setZoom, resetZoom, isPinching, onTouchStart, onTouchMove, onTouchEnd } = usePinchToZoom();
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Custom hooks for presence
  usePresence(userId);
  // Get a list of peer IDs from the pinned contacts to monitor their online status.
  const peerIds = useMemo(() => pinned.map(p => p.peerId).filter(Boolean) as string[], [pinned]);
  // Subscribe to the presence status of the pinned peers.
  const peerStatus = usePeerStatus(peerIds);

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
    localStorage.setItem('p2p-resolution', resolution);
  }, [resolution]);

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Effect to listen for incoming calls
  useEffect(() => {
    if (!userId) return;

    const incomingCallRef = db.ref(`users/${userId}/incomingCall`);
    
    const listener = (snapshot: any) => {
      const callData = snapshot.val();
      
      // A new call is coming in, and we are idle and able to receive it.
      if (callData && callState === CallState.IDLE) {
        setIncomingCall(callData);
        setCallState(CallState.INCOMING_CALL);
      } 
      // The incoming call was cancelled (by caller or by declining) while we were in the INCOMING_CALL state.
      else if (!callData && callState === CallState.INCOMING_CALL) {
        setIncomingCall(null);
        setCallState(CallState.IDLE);
        stopRingingSound();
      }
    };

    incomingCallRef.on('value', listener);

    return () => {
      incomingCallRef.off('value', listener);
    };
  }, [userId, callState, setCallState]);

  useEffect(() => {
    const prevState = prevCallStateRef.current;
    
    // This logic should only run on state transitions
    if (prevState !== callState) {
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
            setShowTechieStatsForCall(true);
            if (callId && !currentCallInfoRef.current) {
              currentCallInfoRef.current = { callId: callId, startTime: Date.now(), peerId: peerId || undefined };
            }
            break;
          case CallState.ENDED:
          case CallState.DECLINED:
            if (callState === CallState.ENDED) playEndedSound();
            resetZoom();
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
    }
    
    // This logic handles the case where peerId arrives after the connection is established.
    if (callState === CallState.CONNECTED && currentCallInfoRef.current && peerId && !currentCallInfoRef.current.peerId) {
        currentCallInfoRef.current.peerId = peerId;
    }

  }, [callState, callId, pinned, peerId, resetZoom]);

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

  const handleHideTechieStats = () => {
    setShowTechieStatsForCall(false);
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

  const handleRetryFromError = () => {
    // If a specific action (like ringing a contact) led to the media error,
    // we need to re-initiate that same action upon retry to preserve the user's intent.
    if (lobbyAction) {
      handleEnterLobby(lobbyAction.type, lobbyAction.target);
    } else {
      // If there was no specific action, default to re-attempting a 'start call' flow.
      handleEnterLobby('start');
    }
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

  const handleRejoinFromHistory = (id: string) => {
    setJoinCallId(id);
    handleEnterLobby('join', id);
    setActiveTab('new');
  };

  const handleUpdateHistoryAlias = (timestamp: number, alias: string) => {
    const updatedHistory = history.map(h => 
      h.timestamp === timestamp ? { ...h, alias } : h
    );
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const handleDeleteFromHistory = (timestamp: number) => {
    const updatedHistory = history.filter(h => h.timestamp !== timestamp);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  }

  const handleTogglePin = (entry: CallHistoryEntry) => {
    setPinned(prevPinned => {
      const isPinned = prevPinned.some(p => p.callId === entry.callId);
      let updatedPins;
      if (isPinned) {
        updatedPins = prevPinned.filter(p => p.callId !== entry.callId);
      } else {
        const newPin: PinnedEntry = {
          callId: entry.callId,
          alias: entry.alias,
          peerId: entry.peerId,
        };
        updatedPins = [newPin, ...prevPinned];
      }
      savePinned(updatedPins);
      return updatedPins;
    });
  };

  const handleUpdatePinAlias = (callId: string, alias: string) => {
    const updatedPins = pinned.map(p => 
      p.callId === callId ? { ...p, alias } : p
    );
    setPinned(updatedPins);
    savePinned(updatedPins);
  };

  const handleUnpin = (callId: string) => {
    const updatedPins = pinned.filter(p => p.callId !== callId);
    setPinned(updatedPins);
    savePinned(updatedPins);
  };

  const handleRestore = (data: { history: CallHistoryEntry[], pinned: PinnedEntry[] }) => {
    setHistory(data.history);
    setPinned(data.pinned);
    saveHistory(data.history);
    savePinned(data.pinned);
    setActiveTab('new');
  };

  const handleInstallClick = () => {
    installPromptEvent?.prompt();
  };

  const renderHome = () => (
    <div className="relative isolate min-h-screen w-full flex flex-col items-center justify-center p-4 pt-16 md:pt-24 text-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-[-10] overflow-hidden">
            <div className="absolute inset-0 bg-slate-50 dark:bg-gray-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl animate-pulse-slow-1"></div>
            <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-teal-500/10 dark:bg-teal-500/20 blur-3xl animate-pulse-slow-2"></div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 animate-fade-in-down">
            Simple, Secure Video Calls
        </h1>
        <p className="max-w-xl text-lg text-slate-600 dark:text-gray-300 mb-8 animate-fade-in-down" style={{animationDelay: '150ms'}}>
            Connect directly with anyone, anywhere. No accounts, no tracking, just a private peer-to-peer connection.
        </p>
      
        <div className="relative w-full max-w-lg mx-auto z-10 animate-fade-in" style={{animationDelay: '300ms'}}>
            <div className="absolute inset-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl rounded-xl p-6">
                
                <div ref={tabsRef} className="relative flex items-center justify-around mb-6 border-b border-slate-300 dark:border-gray-700">
                    <button onClick={() => setActiveTab('new')} className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10" data-tab-id="new">New Call</button>
                    <button onClick={() => setActiveTab('recent')} className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10" data-tab-id="recent">Recent</button>
                    <button onClick={() => setActiveTab('pinned')} className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10" data-tab-id="pinned">Pinned</button>
                    <button onClick={() => setActiveTab('tools')} className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10" data-tab-id="tools">Tools</button>
                    <button onClick={() => setActiveTab('about')} className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10" data-tab-id="about">About</button>
                    <div className="absolute bottom-0 h-0.5 bg-indigo-500 transition-all duration-300 ease-out" style={indicatorStyle}></div>
                </div>

                <div className="min-h-[250px] flex items-center justify-center">
                  {activeTab === 'new' && (
                    <div className="w-full space-y-6">
                      <button 
                        onClick={() => handleEnterLobby('start')} 
                        className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-gradient-to-r dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
                      >
                        Start New Call
                      </button>
                      <div className="flex items-center text-slate-500 dark:text-gray-400">
                        <span className="flex-grow border-t border-slate-300 dark:border-gray-600"></span>
                        <span className="px-4 text-sm font-medium">OR</span>
                        <span className="flex-grow border-t border-slate-300 dark:border-gray-600"></span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={joinCallId}
                          onChange={(e) => setJoinCallId(e.target.value)}
                          placeholder="Enter Call ID"
                          className="flex-grow px-4 py-3 bg-slate-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                          onClick={handleJoinCall}
                          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                          disabled={!joinCallId.trim()}
                        >
                          Join Call
                        </button>
                      </div>
                    </div>
                  )}
                  {activeTab === 'recent' && (
                    <CallHistory
                      history={history}
                      onRejoin={handleRejoinFromHistory}
                      onUpdateAlias={handleUpdateHistoryAlias}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDeleteFromHistory}
                      pinnedIds={new Set(pinned.map(p => p.callId))}
                    />
                  )}
                  {activeTab === 'pinned' && (
                    <PinnedCalls
                      pins={pinned}
                      peerStatus={peerStatus}
                      onCall={handleCall}
                      onUpdateAlias={handleUpdatePinAlias}
                      onUnpin={handleUnpin}
                    />
                  )}
                  {activeTab === 'tools' && <Tools userId={userId} onRestore={handleRestore} canInstall={!!installPromptEvent} onInstallClick={handleInstallClick} />}
                  {activeTab === 'about' && <About isDevMode={isDevMode} onToggleDevMode={() => setIsDevMode(!isDevMode)} theme={theme} onToggleTheme={toggleTheme} />}
                </div>
            </div>
        </div>

         <style>{`
          @keyframes pulse-slow-1 {
            0%, 100% { transform: scale(1); opacity: 0.1; }
            50% { transform: scale(1.1); opacity: 0.15; }
          }
          @keyframes pulse-slow-2 {
            0%, 100% { transform: scale(1); opacity: 0.1; }
            50% { transform: scale(1.05); opacity: 0.12; }
          }
          .animate-pulse-slow-1 { animation: pulse-slow-1 8s infinite ease-in-out; }
          .animate-pulse-slow-2 { animation: pulse-slow-2 10s infinite ease-in-out; }
          
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.5s ease-out forwards;
          }

          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(128, 128, 128, 0.4);
              border-radius: 3px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(128, 128, 128, 0.5);
          }
          
          .animate-pop {
              animation: pop 0.4s ease-out;
          }
          @keyframes pop {
              0% { transform: scale(0.5); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
          }
         `}</style>
    </div>
  );

  const renderCallScreen = () => (
    <div className="absolute inset-0 w-full h-full bg-slate-900" 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
    >
      <div 
        ref={remoteVideoContainerRef}
        className="w-full h-full relative"
      >
        <VideoPlayer
          stream={remoteStream}
          muted={false}
          style={{
            transform: `scale(${zoom})`,
            transition: isPinching ? 'none' : 'transform 0.1s linear',
          }}
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
              <p className="mt-4 text-white">Waiting for peer to connect...</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center p-3 bg-black/50 backdrop-blur-sm rounded-xl z-10">
          <div className="flex items-center gap-3">
            <ConnectionStatusIndicator callState={callState} connectionState={connectionState} isE2EEActive={isE2EEActive} />
            {callStats && <CallQualityIndicator stats={callStats} />}
          </div>
          <div className="font-mono text-white text-sm" aria-label="Call duration">
            {formatTime(elapsedTime)}
          </div>
      </div>
      
      {isDevMode && callStats && showTechieStatsForCall && <TechieStats stats={callStats} onClick={handleHideTechieStats} />}

      <div 
        ref={localVideoContainerRef}
        onPointerDown={isTouchDevice ? undefined : onLocalVideoPointerDown}
        className="absolute top-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 cursor-move touch-action-none"
      >
        <VideoPlayer stream={localStream} muted={true} />
        {isMuted && (
          <div className="absolute bottom-2 left-2 p-1.5 bg-red-600/80 rounded-full">
            <UnmuteIcon className="w-4 h-4 text-white" />
          </div>
        )}
        {isVideoOff && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <VideoOffIcon className="w-8 h-8 text-white" />
            </div>
        )}
      </div>

      <div ref={controlsContainerRef}>
        <Controls 
          onToggleMute={toggleMute} 
          onToggleVideo={toggleVideo} 
          onHangUp={handleHangUp}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onPointerDown={isTouchDevice ? undefined : onControlsPointerDown}
        />
      </div>
    </div>
  );
  
  const renderConnectingScreen = () => (
    <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <ConnectionManager 
        callState={callState} 
        connectionState={connectionState} 
        callId={callId}
        peerId={peerId}
        pinnedContacts={pinned}
        onCancel={
          callState === CallState.RINGING && peerId ? 
          () => declineCall(callId!, peerId) : 
          handleHangUp
        }
      />
    </div>
  );

  const renderErrorScreen = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-900 p-6 text-center">
        <svg className="w-16 h-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Camera & Microphone Issue</h2>
        <div className="max-w-md mx-auto p-4 bg-slate-100 dark:bg-gray-800 rounded-lg text-sm text-slate-600 dark:text-gray-300 mb-6 font-mono">
            {errorMessage}
        </div>
        
        <div className="max-w-md mx-auto text-left space-y-3 text-slate-700 dark:text-gray-400 mb-8">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Make sure no other application (like Zoom or Teams) is using your camera.</li>
                <li>Check your browser settings to ensure this site has permission to access your camera and microphone.</li>
                <li>Verify your devices are properly connected and selected in your system settings.</li>
                <li>Try a different web browser.</li>
            </ul>
        </div>

        <div className="flex gap-4">
            <button onClick={handleRetryFromError} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">Retry Access</button>
            <button onClick={handleReset} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors">Back to Home</button>
        </div>
    </div>
  );

  const renderDeclinedScreen = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-900 p-6 text-center">
        <svg className="w-16 h-16 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Call Not Answered</h2>
        <p className="text-slate-600 dark:text-gray-400 mb-8">The other person did not answer or declined your call.</p>
        <button onClick={handleReset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">Back to Home</button>
    </div>
  );
  
  const renderEndedScreen = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-900 p-6 text-center">
        <svg className="w-16 h-16 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Call Ended</h2>
        <p className="text-slate-600 dark:text-gray-400 mb-8">You can now close this window.</p>
        <button onClick={handleReset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">Start New Call</button>
    </div>
  );
  
  switch (callState) {
    case CallState.IDLE:
      return renderHome();
    case CallState.LOBBY:
      return (
        <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
            <Lobby
                localStream={localStream}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                resolution={resolution}
                onResolutionChange={setResolution}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onConfirm={handleLobbyConfirm}
                onCancel={handleReset}
            />
        </div>
      );
    case CallState.CREATING_OFFER:
    case CallState.WAITING_FOR_ANSWER:
    case CallState.RINGING:
    case CallState.JOINING:
    case CallState.CREATING_ANSWER:
      return renderConnectingScreen();
    case CallState.CONNECTED:
    case CallState.RECONNECTING:
      return renderCallScreen();
    case CallState.ENDED:
      return renderEndedScreen();
    case CallState.DECLINED:
      return renderDeclinedScreen();
    case CallState.MEDIA_ERROR:
      return renderErrorScreen();
    case CallState.INCOMING_CALL:
       if (incomingCall) {
            const caller = pinned.find(p => p.peerId === incomingCall.from);
            const callerDisplayName = caller?.alias || incomingCall.callerAlias || incomingCall.from.substring(0,8);
            return <IncomingCallScreen 
                callInfo={incomingCall} 
                callerDisplayName={callerDisplayName}
                onAccept={() => handleEnterLobby('join', incomingCall.callId)}
                onDecline={() => declineCall(incomingCall.callId)}
            />
       }
       // If incomingCall is null (edge case), return to idle state
       return renderHome();
    default:
      return renderHome();
  }
};

export default App;