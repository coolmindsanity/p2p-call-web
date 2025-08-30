
import { useState, useRef, useCallback } from 'react';
import { STUN_SERVERS } from '../constants';
import { CallState } from '../types';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [offer, setOffer] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const hangUp = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if(remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setCallState(CallState.ENDED);
  }, [localStream, remoteStream]);
  
  const reset = useCallback(() => {
    hangUp();
    setOffer('');
    setAnswer('');
    setErrorMessage(null);
    setConnectionState('new');
    setCallState(CallState.IDLE);
  }, [hangUp]);

  const initMedia = useCallback(async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      let message = 'Could not access camera and microphone. Please check your system settings and browser permissions.';
      if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              message = 'Permission denied. Please allow this site to access your camera and microphone in your browser settings.';
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
              message = 'No camera or microphone found. Please ensure your devices are connected and enabled.';
          }
      }
      setErrorMessage(message);
      setCallState(CallState.MEDIA_ERROR);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    localCandidatesRef.current = [];

    const iceGatheringPromise = new Promise<void>(resolve => {
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                localCandidatesRef.current.push(event.candidate);
            } else {
                resolve();
            }
        };
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc) {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallState(CallState.CONNECTED);
        }
      }
    };

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    peerConnectionRef.current = pc;
    setConnectionState(pc.connectionState);
    return { pc, iceGatheringPromise };
  }, []);

  const startCall = useCallback(async () => {
    setCallState(CallState.CREATING_OFFER);
    const stream = await initMedia();
    if (stream) {
        const { pc, iceGatheringPromise } = createPeerConnection(stream);
        try {
            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);
    
            await iceGatheringPromise;
    
            const payload = {
                sdp: pc.localDescription,
                candidates: localCandidatesRef.current,
            };
    
            setOffer(btoa(JSON.stringify(payload)));
            setCallState(CallState.WAITING_FOR_ANSWER);
        } catch (e) {
            console.error("Error creating offer:", e);
            reset();
        }
    }
  }, [initMedia, createPeerConnection, reset]);

  const joinCall = useCallback(async (encodedOffer: string) => {
    setCallState(CallState.JOINING);
    const stream = await initMedia();
    if (stream) {
      const { pc, iceGatheringPromise } = createPeerConnection(stream);
      
      try {
        const payload = JSON.parse(atob(encodedOffer));
        if (!payload.sdp || !payload.candidates) throw new Error("Invalid offer format");

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        
        for (const candidate of payload.candidates) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }

        setCallState(CallState.CREATING_ANSWER);
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        await iceGatheringPromise;

        const answerPayload = {
            sdp: pc.localDescription,
            candidates: localCandidatesRef.current
        };

        setAnswer(btoa(JSON.stringify(answerPayload)));

      } catch(e) {
          console.error("Invalid offer payload", e);
          setErrorMessage("The provided call info is invalid or expired. Please ask for a new one.");
          setCallState(CallState.IDLE);
      }
    }
  }, [initMedia, createPeerConnection]);

  const acceptAnswer = useCallback(async (encodedAnswer: string) => {
    const pc = peerConnectionRef.current;
    if (pc && encodedAnswer) {
      try {
        const payload = JSON.parse(atob(encodedAnswer));
        if (!payload.sdp || !payload.candidates) throw new Error("Invalid answer format");

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        for (const candidate of payload.candidates) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error("Invalid answer payload", e);
      }
    }
  }, []);
  
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
    }
  }, [localStream]);

  return {
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
  };
};
