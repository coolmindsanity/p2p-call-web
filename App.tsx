
import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { CallState } from './types';
import VideoPlayer from './components/VideoPlayer';
import Controls from './components/Controls';
import ConnectionManager from './components/ConnectionManager';
import { playIncomingSound, playConnectedSound, playEndedSound } from './utils/sounds';

const App: React.FC = () => {
  const {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isVideoOff,
    callState,
    errorMessage,
    offer,
    answer,
    startCall,
    joinCall,
    acceptAnswer,
    toggleMute,
    toggleVideo,
    hangUp,
    reset,
  } = useWebRTC();

  const [joinOffer, setJoinOffer] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const prevCallStateRef = useRef<CallState | undefined>(undefined);

  useEffect(() => {
    const prevState = prevCallStateRef.current;
    
    if (prevState === callState) return;

    switch (callState) {
      case CallState.CREATING_ANSWER:
        playIncomingSound();
        break;
      case CallState.CONNECTED:
        playConnectedSound();
        break;
      case CallState.ENDED:
        playEndedSound();
        break;
    }

    prevCallStateRef.current = callState;
  }, [callState]);

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
    setJoinOffer('');
  };

  const handleReset = () => {
    reset();
    setJoinOffer('');
  };
  
  const handleJoinCall = () => {
    if (joinOffer.trim()) {
      joinCall(joinOffer);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg font-mono text-lg tracking-wider z-10" aria-live="off">
              {formatTime(elapsedTime)}
            </div>
            <div className="w-full h-full bg-black">
              <VideoPlayer stream={remoteStream} muted={false} />
            </div>
            <div className="absolute bottom-24 md:bottom-6 right-6 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-indigo-500">
              <VideoPlayer stream={localStream} muted={true} />
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
        return (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center tracking-tight">P2P Video Call</h1>
            <p className="text-gray-400">Secure, serverless video chat.</p>
            <div className="w-full space-y-4 mt-4">
              <button onClick={startCall} className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
                Create Call
              </button>
              <div className="flex items-center gap-4">
                <hr className="flex-grow border-gray-700" />
                <span className="text-gray-500 font-medium">OR</span>
                <hr className="flex-grow border-gray-700" />
              </div>
              <div className="space-y-2">
                <textarea 
                  value={joinOffer}
                  onChange={(e) => setJoinOffer(e.target.value)}
                  placeholder="Paste peer's call info to join..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                  aria-label="Peer's call info"
                />
                <button 
                  onClick={handleJoinCall} 
                  disabled={!joinOffer.trim()}
                  className="w-full px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Join Call
                </button>
              </div>
            </div>
          </div>
        );
      case CallState.ENDED:
        return (
           <div className="flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-bold text-center">Call Ended</h2>
            <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
              Start New Call
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
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
                    <VideoPlayer stream={localStream} muted={true} />
                  </div>
                </div>
                <ConnectionManager 
                  callState={callState}
                  connectionState={connectionState}
                  offer={offer}
                  answer={answer}
                  onAcceptAnswer={acceptAnswer}
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
