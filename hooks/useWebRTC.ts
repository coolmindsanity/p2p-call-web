import { useState, useRef, useCallback, useEffect } from 'react';
import { STUN_SERVERS } from '../constants';
import { CallState } from '../types';
import { db } from '../firebase';
import { generateCallId } from '../utils/id';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callDocRef = useRef<any>(null); // Firebase Database Reference
  const answerCandidatesRef = useRef<any>(null); // Firebase Database Reference
  const offerCandidatesRef = useRef<any>(null); // Firebase Database Reference

  const cleanUp = useCallback(() => {
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
    
    // Detach all Firebase listeners
    if (callDocRef.current) callDocRef.current.off();
    if (answerCandidatesRef.current) answerCandidatesRef.current.off();
    if (offerCandidatesRef.current) offerCandidatesRef.current.off();
    
    // Optionally delete the call document from the database
    if (callDocRef.current) callDocRef.current.remove();

    callDocRef.current = null;
    answerCandidatesRef.current = null;
    offerCandidatesRef.current = null;
  }, [localStream, remoteStream]);

  const hangUp = useCallback(() => {
    cleanUp();
    setCallState(CallState.ENDED);
  }, [cleanUp]);
  
  const reset = useCallback(() => {
    cleanUp();
    setCallId(null);
    setErrorMessage(null);
    setConnectionState('new');
    setCallState(CallState.IDLE);
  }, [cleanUp]);

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

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
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

    peerConnectionRef.current = pc;
    setConnectionState(pc.connectionState);
    return pc;
  }, []);

  const startCall = useCallback(async () => {
    setCallState(CallState.CREATING_OFFER);
    const stream = await initMedia();
    if (stream) {
      const pc = createPeerConnection(stream);
      const newCallId = generateCallId();
      setCallId(newCallId);

      callDocRef.current = db.ref(`calls/${newCallId}`);
      offerCandidatesRef.current = callDocRef.current.child('offerCandidates');
      answerCandidatesRef.current = callDocRef.current.child('answerCandidates');
      
      pc.onicecandidate = (event) => {
        event.candidate && offerCandidatesRef.current.push(event.candidate.toJSON());
      };
      
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      
      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await callDocRef.current.set({ offer });

      callDocRef.current.on('value', (snapshot: any) => {
        const data = snapshot.val();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });
      
      answerCandidatesRef.current.on('child_added', (snapshot: any) => {
        const candidate = new RTCIceCandidate(snapshot.val());
        pc.addIceCandidate(candidate);
      });
      
      setCallState(CallState.WAITING_FOR_ANSWER);
    }
  }, [initMedia, createPeerConnection]);

  const joinCall = useCallback(async (id: string) => {
    setCallState(CallState.JOINING);
    const stream = await initMedia();
    if (stream) {
      const pc = createPeerConnection(stream);
      setCallId(id);

      callDocRef.current = db.ref(`calls/${id}`);
      offerCandidatesRef.current = callDocRef.current.child('offerCandidates');
      answerCandidatesRef.current = callDocRef.current.child('answerCandidates');

      pc.onicecandidate = (event) => {
        event.candidate && answerCandidatesRef.current.push(event.candidate.toJSON());
      };

      const callSnapshot = await callDocRef.current.get();
      const callData = callSnapshot.val();
      
      if (callData?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);

          const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          };
          
          await callDocRef.current.update({ answer });
          
          offerCandidatesRef.current.on('child_added', (snapshot: any) => {
            const candidate = new RTCIceCandidate(snapshot.val());
            pc.addIceCandidate(candidate);
          });
          setCallState(CallState.CREATING_ANSWER);
      } else {
          setErrorMessage(`Call ID "${id}" not found or is invalid.`);
          reset();
      }
    }
  }, [initMedia, createPeerConnection, reset]);

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

  useEffect(() => {
    // Add a beforeunload listener to hang up the call
    const handleBeforeUnload = () => {
      hangUp();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hangUp]);

  return {
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
  };
};