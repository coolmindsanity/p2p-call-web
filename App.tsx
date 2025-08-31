


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
import MediaErrorScreen from './components/MediaErrorScreen';
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
    let color = 'bg-gray-500';
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
                 color = 'bg-gray-500';
                 text = 'Disconnected';
                 break;
        }
    }
    
    return (
        <div className="flex items-center gap-2 text-sm text-white" title={`Connection Status: ${text}${isE2EEActive ? ' (End-to-End Encrypted)' : ''}`}>
            <span className={`w-3 h-3 rounded-full ${color} ${animate ? 'animate-pulse' : ''}`}></span>
            {isE2EEActive && <LockIcon className="w-4 h-4 text-green-400" />}
            <span className="font-semibold hidden sm:block">{text}</span>
        </div>
    );
};

const SignalBarsIcon: React.FC<{ level: 'good' | 'average' | 'poor' | 'unknown'; className?: string }> = ({ level, className }) => {
  const levelMap = {
    good: { bars: 4, color: 'text-green-400' },
    average: { bars: 3, color: 'text-yellow-400' },
    poor: { bars: 1, color: 'text-red-400' },
    unknown: { bars: 2, color: 'text-gray-500' },
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
    <div className="group relative flex items-center gap-2 text-sm text-white border-l border-gray-600 pl-3" title={`Call Quality: ${text}`}>
      <SignalBarsIcon level={qualityLevel} className="w-5 h-5" />
      
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono shadow-lg">
        <h4 className="font-bold text-center mb-2 border-b border-gray-700 pb-1 text-white">Connection Details</h4>
        <div className="space-y-1">
          {statItem('RTT', stats.roundTripTime, 'ms')}
          {statItem('Jitter', stats.jitter, 'ms')}
          {statItem('Packet Loss', stats.packetsLost, '')}
          <div className="pt-1 mt-1 border-t border-gray-700"></div>
          {statItem('Upload', stats.uploadBitrate, 'kbps')}
          {statItem('Download', stats.downloadBitrate, 'kbps')}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-t border-r border-gray-700 rotate-45 transform -translate-y-1/2"></div>
      </div>
    </div>
  );
};
const App: React.FC = () => {
    const [userId] = useState(getUserId());
    const [history, setHistory] = useState<CallHistoryEntry[]>(() => getHistory());
    const [pinned, setPinned] = useState<PinnedEntry[]>(() => getPinned());
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [activeTab, setActiveTab] = useState<'new' | 'recent' | 'pinned' | 'tools' | 'about'>('new');
    const [joinInput, setJoinInput] = useState('');
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [peerToRing, setPeerToRing] = useState<PinnedEntry | null>(null);

    const {
        localStream, remoteStream, connectionState, isMuted, isVideoOff, callState, setCallState,
        errorMessage, callId, peerId, isE2EEActive, callStats, resolution, setResolution,
        enableE2EE, setEnableE2EE,
        enterLobby, startCall, joinCall, ringUser, declineCall, toggleMute, toggleVideo, hangUp, reset,
    } = useWebRTC('720p');

    usePresence(userId);
    const peerIdsToWatch = useMemo(() => pinned.map(p => p.peerId).filter((id): id is string => !!id), [pinned]);
    const peerStatus = usePeerStatus(peerIdsToWatch);

    const controlsRef = useRef<HTMLDivElement>(null);
    const { onPointerDown: onControlsPointerDown } = useDraggable(controlsRef);
    
    const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const { zoom, onTouchStart, onTouchMove, onTouchEnd, isPinching } = usePinchToZoom();

    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callStartTimeRef = useRef<number | null>(null);
    const callDetailsForHistoryRef = useRef<{ callId: string; peerId?: string; alias?: string } | null>(null);

    // PWA install prompt effect
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Firebase incoming call listener
    useEffect(() => {
        if (!userId) return;
        const incomingCallRef = db.ref(`users/${userId}/incomingCall`);
        const listener = (snapshot: any) => {
            const call = snapshot.val();
            if (call) {
                // Only set to INCOMING_CALL if we are in an idle state.
                // This prevents the UI from flashing back to the incoming call screen
                // after the user has already clicked "Accept" and is moving to the lobby.
                if ([CallState.IDLE, CallState.ENDED, CallState.DECLINED].includes(callState)) {
                    setIncomingCall(call);
                    setCallState(CallState.INCOMING_CALL);
                }
            } else {
                setIncomingCall(null);
                if (callState === CallState.INCOMING_CALL) {
                    setCallState(CallState.IDLE);
                }
            }
        };
        incomingCallRef.on('value', listener);
        return () => incomingCallRef.off('value', listener);
    }, [userId, callState, setCallState]);

    // Call state effects (sounds, timer, history)
    useEffect(() => {
        const findAlias = (pId: string | null) => {
            if (!pId) return undefined;
            const pinnedContact = pinned.find(p => p.peerId === pId);
            if (pinnedContact?.alias) return pinnedContact.alias;
            const historyContact = [...history].sort((a,b) => b.timestamp - a.timestamp).find(h => h.peerId === pId);
            return historyContact?.alias;
        };

        switch (callState) {
            case CallState.INCOMING_CALL:
                playIncomingSound();
                break;
            case CallState.RINGING:
                playRingingSound();
                break;
            case CallState.CONNECTED:
                stopRingingSound();
                playConnectedSound();
                callStartTimeRef.current = Date.now();
                if (callId) {
                    callDetailsForHistoryRef.current = { callId, peerId: peerId || undefined, alias: peerId ? findAlias(peerId) : undefined };
                }
                setCallDuration(0);
                timerRef.current = setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
                break;
            case CallState.ENDED:
            case CallState.DECLINED:
                stopRingingSound();
                playEndedSound();
                if (timerRef.current) clearInterval(timerRef.current);
                if (callStartTimeRef.current && callDetailsForHistoryRef.current) {
                    const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                    const newHistory: CallHistoryEntry = {
                        ...callDetailsForHistoryRef.current,
                        timestamp: Date.now(),
                        duration,
                    };
                    setHistory(prev => [newHistory, ...prev]);
                }
                setCallDuration(0);
                timerRef.current = null;
                callStartTimeRef.current = null;
                callDetailsForHistoryRef.current = null;
                break;
            case CallState.IDLE:
                stopRingingSound();
                break;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callState, callId, peerId]);

    useEffect(() => {
        saveHistory(history);
    }, [history]);

    useEffect(() => {
        savePinned(pinned);
    }, [pinned]);

    const handleJoin = useCallback((id: string) => {
        if (!id.trim()) return;
        joinCall(id.trim());
    }, [joinCall]);

    const handleRejoin = useCallback((id: string) => {
        setJoinInput(id);
        enterLobby();
    }, [enterLobby]);

    const handleCreateCall = useCallback(() => {
        startCall();
    }, [startCall]);

    const handleCallPinned = useCallback((pin: PinnedEntry) => {
        if (pin.peerId) {
            setPeerToRing(pin);
            enterLobby();
        } else {
            setJoinInput(pin.callId);
            enterLobby();
        }
    }, [enterLobby]);

    const handleAcceptCall = useCallback(() => {
        if (incomingCall) {
            joinCall(incomingCall.callId);
        }
    }, [incomingCall, joinCall]);

    const handleDeclineCall = useCallback(() => {
        if (incomingCall) {
            declineCall(incomingCall.callId);
        }
        setIncomingCall(null);
        reset();
    }, [incomingCall, declineCall, reset]);
    
    const handleHangUp = useCallback(() => {
        hangUp();
    }, [hangUp]);

    const handleCancelConnecting = useCallback(() => {
        if (callState === CallState.RINGING && callId && peerId) {
            declineCall(callId, peerId);
        } else {
            if(callId) declineCall(callId);
        }
        reset();
    }, [callState, callId, peerId, declineCall, reset]);

    const handleLobbyConfirm = useCallback(() => {
        if (peerToRing) {
            ringUser(peerToRing);
            setPeerToRing(null);
        } else if (incomingCall) {
            handleAcceptCall();
        } else if (joinInput) {
            handleJoin(joinInput);
        } else {
            handleCreateCall();
        }
    }, [peerToRing, ringUser, incomingCall, joinInput, handleAcceptCall, handleJoin, handleCreateCall]);

    const handleLobbyCancel = useCallback(() => {
        setPeerToRing(null);
        reset();
    }, [reset]);

    const handleUpdateHistoryAlias = useCallback((timestamp: number, alias: string) => {
        setHistory(prev => prev.map(h => h.timestamp === timestamp ? { ...h, alias } : h));
    }, []);

    const handleDeleteHistory = useCallback((timestamp: number) => {
        setHistory(prev => prev.filter(h => h.timestamp !== timestamp));
    }, []);

    const handleTogglePin = useCallback((entry: CallHistoryEntry) => {
        setPinned(prev => {
            if (prev.some(p => p.callId === entry.callId)) {
                return prev.filter(p => p.callId !== entry.callId);
            }
            const { callId, alias, peerId } = entry;
            return [{ callId, alias, peerId }, ...prev];
        });
    }, []);
    
    const handleUpdatePinAlias = useCallback((callId: string, alias: string) => {
        setPinned(prev => prev.map(p => p.callId === callId ? { ...p, alias } : p));
    }, []);

    const handleUnpin = useCallback((callId: string) => {
        setPinned(prev => prev.filter(p => p.callId !== callId));
    }, []);

    const handleRestoreData = useCallback((data: { history: CallHistoryEntry[], pinned: PinnedEntry[] }) => {
        setHistory(data.history);
        setPinned(data.pinned);
    }, []);

    const handleInstallClick = useCallback(() => {
        if (installPrompt) {
            installPrompt.prompt();
        }
    }, [installPrompt]);
    
    const callerDisplayName = useMemo(() => {
        if (!incomingCall) return 'Someone';
        const pinnedContact = pinned.find(p => p.peerId === incomingCall.from);
        if (pinnedContact?.alias) return pinnedContact.alias;
        const historyContact = history.find(h => h.peerId === incomingCall.from);
        if (historyContact?.alias) return historyContact.alias;
        return incomingCall.callerAlias || incomingCall.from.substring(0, 8);
    }, [incomingCall, pinned, history]);
    
    const isConnecting = [CallState.CREATING_OFFER, CallState.WAITING_FOR_ANSWER, CallState.RINGING, CallState.JOINING, CallState.CREATING_ANSWER].includes(callState);
    const showMainPage = [CallState.IDLE, CallState.ENDED, CallState.DECLINED].includes(callState);
    
    const tabs: { id: 'new' | 'recent' | 'pinned' | 'tools' | 'about', label: string }[] = [
        { id: 'new', label: 'New Call' },
        { id: 'recent', label: 'Recent' },
        { id: 'pinned', label: 'Pinned' },
        { id: 'tools', label: 'Tools' },
        { id: 'about', label: 'About' },
    ];
    
    const handleStartNewCallFlow = useCallback(() => {
        setJoinInput('');
        enterLobby();
    }, [enterLobby]);

    const renderTabContent = () => {
        switch(activeTab) {
            case 'new':
                return (
                    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 p-4">
                        <button
                            onClick={handleStartNewCallFlow}
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-transform transform hover:scale-105 shadow-lg"
                        >
                            Start a New Call
                        </button>
                        
                        <div className="w-full flex items-center">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="flex-shrink mx-4 text-gray-500 text-sm font-semibold">OR</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>

                        <div className="w-full flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={joinInput}
                                onChange={(e) => setJoinInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && joinInput.trim() && enterLobby()}
                                placeholder="Enter Call ID to join"
                                className="flex-grow w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                            />
                            <button
                                onClick={() => joinInput.trim() && enterLobby()}
                                disabled={!joinInput.trim()}
                                className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                                Join Call
                            </button>
                        </div>
                    </div>
                );
            case 'recent':
                return <CallHistory history={history} onRejoin={handleRejoin} onUpdateAlias={handleUpdateHistoryAlias} onTogglePin={handleTogglePin} pinnedIds={new Set(pinned.map(p => p.callId))} onDelete={handleDeleteHistory} />;
            case 'pinned':
                return <PinnedCalls pins={pinned} peerStatus={peerStatus} onCall={handleCallPinned} onUpdateAlias={handleUpdatePinAlias} onUnpin={handleUnpin} />;
            case 'tools':
                return <Tools userId={userId} onRestore={handleRestoreData} canInstall={!!installPrompt} onInstallClick={handleInstallClick} />;
            case 'about':
                return <About />;
        }
    };

    return (
        <div className="min-h-screen text-slate-200">
            {/* Main Page UI: Only rendered when in an idle state */}
            {showMainPage && (
                <div className="relative container mx-auto px-4 py-8 md:py-16 flex flex-col items-center gap-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white">Simple, Secure Video Calls</h1>
                        <p className="text-gray-400 mt-2">Connect directly with anyone, anywhere. No accounts, no tracking, just a private peer-to-peer connection.</p>
                    </div>
                    
                    <div className="w-full max-w-2xl mt-8 relative glass-container-glow">
                        <div className="relative glass-card-background backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                            <div className="border-b border-gray-200/10 px-4 md:px-8">
                                <nav className="-mb-px flex space-x-6 justify-center" aria-label="Tabs">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`${
                                                activeTab === tab.id
                                                ? 'border-indigo-400 text-slate-100'
                                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                                            aria-current={activeTab === tab.id ? 'page' : undefined}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="min-h-[20rem] p-4 md:p-8 flex justify-center">
                                {renderTabContent()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-screen states that replace the main UI */}
            {callState === CallState.MEDIA_ERROR && <MediaErrorScreen errorMessage={errorMessage} onRetry={reset} />}
            {callState === CallState.INCOMING_CALL && incomingCall && <IncomingCallScreen callInfo={incomingCall} callerDisplayName={callerDisplayName} onAccept={() => enterLobby()} onDecline={handleDeclineCall} />}
            {callState === CallState.LOBBY && (
                <div className="w-full h-screen flex items-center justify-center p-4">
                    <Lobby localStream={localStream} isMuted={isMuted} isVideoOff={isVideoOff} onToggleMute={toggleMute} onToggleVideo={toggleVideo} onConfirm={handleLobbyConfirm} onCancel={handleLobbyCancel} resolution={resolution} onResolutionChange={setResolution} enableE2EE={enableE2EE} onEnableE2EEChange={setEnableE2EE} />
                </div>
            )}

            {/* Overlays for connecting and active call states */}
            {isConnecting && (
                <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex items-center justify-center z-20">
                    <ConnectionManager callState={callState} connectionState={connectionState} callId={callId} peerId={peerId} pinnedContacts={pinned} onCancel={handleCancelConnecting} />
                </div>
            )}
            {(callState === CallState.CONNECTED || callState === CallState.RECONNECTING) && (
                <div className="absolute inset-0 bg-black">
                    <div ref={remoteVideoContainerRef} className="w-full h-full" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                        <VideoPlayer ref={remoteVideoRef} stream={remoteStream} muted={false} style={{ transform: `scale(${zoom})`, transition: isPinching ? 'none' : 'transform 0.1s linear' }} />
                    </div>
                    <div className="absolute bottom-6 right-6 w-32 h-auto md:w-48 aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                        <VideoPlayer stream={localStream} muted={true} />
                        {(isMuted || isVideoOff) && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                                {isMuted && <UnmuteIcon className="w-6 h-6 text-white" />}
                                {isVideoOff && <VideoOffIcon className="w-6 h-6 text-white" />}
                            </div>
                        )}
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-4 bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10">
                        <ConnectionStatusIndicator callState={callState} connectionState={connectionState} isE2EEActive={isE2EEActive} />
                        {callStats && <CallQualityIndicator stats={callStats} />}
                        <span className="font-mono text-white text-sm">{formatTime(callDuration)}</span>
                    </div>
                    <Controls ref={controlsRef} onPointerDown={onControlsPointerDown} onToggleMute={toggleMute} onToggleVideo={toggleVideo} onHangUp={handleHangUp} isMuted={isMuted} isVideoOff={isVideoOff} />
                </div>
            )}
        </div>
    );
};

export default App;