import { useState, useRef, useCallback, useEffect } from 'react';
import { STUN_SERVERS } from '../constants';
import { CallState, CallStats, PinnedEntry } from '../types';
import { db } from '../firebase';
import { generateCallId } from '../utils/id';
import { getUserId, getUserDisplayName } from '../utils/user';
import { generateKey, importKey, setupE2EE } from '../utils/crypto';

const MAX_RECONNECTION_ATTEMPTS = 3;
const RING_TIMEOUT_MS = 30000; // 30 seconds

const RESOLUTION_CONSTRAINTS = {
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
  '720p': { width: { ideal: 1280 }, height: { ideal: 720 } },
  '480p': { width: { ideal: 854 }, height: { ideal: 480 } },
};

export const useWebRTC = (initialResolution: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isE2EEActive, setIsE2EEActive] = useState(false);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [resolution, setResolution] = useState<string>(initialResolution);
  const [enableE2EE, setEnableE2EE] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const callDocRef = useRef<any>(null); // Firebase Database Reference
  const answerCandidatesRef = useRef<any>(null); // Firebase Database Reference
  const offerCandidatesRef = useRef<any>(null); // Firebase Database Reference
  
  const reconnectionAttemptsRef = useRef(0);
  const isCallerRef = useRef(false);
  const reconnectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatsRef = useRef<{ timestamp: number, totalBytesSent: number, totalBytesReceived: number } | null>(null);
  const hasConnectedOnceRef = useRef(false);

  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const onMessageCallbackRef = useRef<((data: string) => void) | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const setOnMessage = useCallback((callback: (data: string) => void) => {
    onMessageCallbackRef.current = callback;
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(message);
    } else {
        console.error("Data channel is not open. Cannot send message.");
    }
  }, []);

  const cleanUp = useCallback((keepCallDoc = false) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);

    if(remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    if (callDocRef.current) callDocRef.current.off();
    if (answerCandidatesRef.current) answerCandidatesRef.current.off();
    if (offerCandidatesRef.current) offerCandidatesRef.current.off();
    
    if (reconnectionTimerRef.current) clearTimeout(reconnectionTimerRef.current);
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    reconnectionTimerRef.current = null;
    ringingTimeoutRef.current = null;
    statsIntervalRef.current = null;
    
    if (callDocRef.current && !keepCallDoc) callDocRef.current.remove();

    if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
    }
    onMessageCallbackRef.current = null;

    callDocRef.current = null;
    answerCandidatesRef.current = null;
    offerCandidatesRef.current = null;
    encryptionKeyRef.current = null;
    lastStatsRef.current = null;
    hasConnectedOnceRef.current = false;
    setIsE2EEActive(false);
    setCallStats(null);
  }, [remoteStream]);

  const hangUp = useCallback(() => {
    cleanUp();
    setCallState(CallState.ENDED);
  }, [cleanUp]);

  const declineCall = useCallback(async (incomingCallId: string, peerToRingId?: string) => {
      const myUserId = getUserId();
      const callRef = db.ref(`calls/${incomingCallId}`);
      
      if (peerToRingId) {
          const calleeIncomingCallRef = db.ref(`users/${peerToRingId}/incomingCall`);
          await calleeIncomingCallRef.remove();
      } 
      else {
          const myIncomingCallRef = db.ref(`users/${myUserId}/incomingCall`);
          await myIncomingCallRef.remove();
      }

      await callRef.update({ declined: true });
      
      cleanUp(true);
      setTimeout(() => callRef.remove(), 2000);
      setCallState(CallState.IDLE);
  }, [cleanUp]);
  
  const reset = useCallback(() => {
    cleanUp();
    setCallId(null);
    setPeerId(null);
    setErrorMessage(null);
    setConnectionState('new');
    setCallState(CallState.IDLE);
  }, [cleanUp]);

  const initMedia = useCallback(async (res: string) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setErrorMessage(null);
      
      const videoConstraints = RESOLUTION_CONSTRAINTS[res as keyof typeof RESOLUTION_CONSTRAINTS] || RESOLUTION_CONSTRAINTS['720p'];
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });

      stream.getAudioTracks().forEach(t => t.enabled = !isMuted);
      stream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
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
          } else if (error.name === 'OverconstrainedError') {
              message = `The selected resolution (${res}) is not supported by your device. Try a lower quality.`;
          }
      }
      setErrorMessage(message);
      setCallState(CallState.MEDIA_ERROR);
      return null;
    }
  }, [isMuted, isVideoOff]);
  
  useEffect(() => {
    if (callState === CallState.LOBBY) {
        initMedia(resolution);
    }
  }, [resolution, callState, initMedia]);

  const enterLobby = useCallback(async () => {
    const stream = await initMedia(resolution);
    if(stream) {
        setCallState(CallState.LOBBY);
    }
  }, [initMedia, resolution]);

  const restartIce = useCallback(async () => {
      const pc = peerConnectionRef.current;
      if (!pc || !callDocRef.current) return;

      try {
          const offerDescription = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offerDescription);

          const offer = {
              sdp: offerDescription.sdp,
              type: offerDescription.type,
          };

          await callDocRef.current.update({ offer });
      } catch (error) {
          console.error("Failed to restart ICE connection:", error);
          hangUp();
      }
  }, [hangUp]);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    
    pc.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        dataChannelRef.current.onmessage = (e) => {
            onMessageCallbackRef.current?.(e.data);
        };
        dataChannelRef.current.onopen = () => console.log('Data channel opened by peer.');
        dataChannelRef.current.onclose = () => console.log('Data channel closed by peer.');
    };

    pc.onconnectionstatechange = () => {
      if (pc) {
        setConnectionState(pc.connectionState);

        if (pc.connectionState === 'connected') {
          hasConnectedOnceRef.current = true;
          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          reconnectionAttemptsRef.current = 0;
          if (reconnectionTimerRef.current) {
            clearTimeout(reconnectionTimerRef.current);
            reconnectionTimerRef.current = null;
          }
          if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
          }
          statsIntervalRef.current = setInterval(async () => {
            if (peerConnectionRef.current) {
              const stats = await peerConnectionRef.current.getStats();
              let newStats: CallStats = { packetsLost: null, jitter: null, roundTripTime: null, uploadBitrate: null, downloadBitrate: null };
              let totalBytesSent = 0;
              let totalBytesReceived = 0;
              const now = Date.now();
              
              stats.forEach(report => {
                if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
                  newStats.packetsLost = report.packetsLost;
                  newStats.jitter = report.jitter ? Math.round(report.jitter * 1000) : null;
                }
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                   newStats.roundTripTime = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : null;
                }
                if (report.type === 'outbound-rtp') {
                    totalBytesSent += report.bytesSent;
                }
                if (report.type === 'inbound-rtp') {
                    totalBytesReceived += report.bytesReceived;
                }
              });

              if (lastStatsRef.current) {
                const timeDiffSeconds = (now - lastStatsRef.current.timestamp) / 1000;
                if (timeDiffSeconds > 0) {
                    const sentDiff = totalBytesSent - lastStatsRef.current.totalBytesSent;
                    const receivedDiff = totalBytesReceived - lastStatsRef.current.totalBytesReceived;
                    newStats.uploadBitrate = Math.round((sentDiff * 8) / (timeDiffSeconds * 1000));
                    newStats.downloadBitrate = Math.round((receivedDiff * 8) / (timeDiffSeconds * 1000));
                }
              }
              lastStatsRef.current = { timestamp: now, totalBytesSent, totalBytesReceived };

              setCallStats(newStats);
            }
          }, 1000);
          
          setCallState(CallState.CONNECTED);
          if (encryptionKeyRef.current) {
             if (setupE2EE(pc, encryptionKeyRef.current)) {
                setIsE2EEActive(true);
             }
          }
        } else if (pc.connectionState === 'failed') {
          console.error("Peer connection failed. Hanging up.");
          hangUp();
        } else if (pc.connectionState === 'disconnected') {
          setIsE2EEActive(false);
          setCallStats(null);
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
          lastStatsRef.current = null;
          
          if (isCallerRef.current && reconnectionAttemptsRef.current < MAX_RECONNECTION_ATTEMPTS && !reconnectionTimerRef.current) {
            reconnectionTimerRef.current = setTimeout(() => {
                reconnectionAttemptsRef.current++;
                console.log(`Connection lost. Attempting to reconnect... (Attempt ${reconnectionAttemptsRef.current})`);
                setCallState(CallState.RECONNECTING);
                
                reconnectionTimerRef.current = null;
                
                restartIce();
            }, 2000 * reconnectionAttemptsRef.current);
          } else if (reconnectionAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS && callState !== CallState.ENDED) {
             console.log("Reconnection failed after maximum attempts.");
             hangUp();
          }
        } else if (['closed'].includes(pc.connectionState)) {
          setIsE2EEActive(false);
          setCallStats(null);
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
          lastStatsRef.current = null;
        }
      }
    };

    peerConnectionRef.current = pc;
    setConnectionState(pc.connectionState);
    return pc;
  }, [restartIce, hangUp, callState]);

  const initiateCall = useCallback(async (id: string, isRinging: boolean = false) => {
    if (!localStreamRef.current) {
        console.error("Cannot initiate call without a local stream.");
        setCallState(CallState.MEDIA_ERROR);
        return;
    }
    setCallState(isRinging ? CallState.RINGING : CallState.CREATING_OFFER);
    isCallerRef.current = true;
    reconnectionAttemptsRef.current = 0;
    
    const pc = createPeerConnection(localStreamRef.current);
    setCallId(id);

    const dc = pc.createDataChannel('chat');
    dc.onopen = () => console.log('Data channel opened.');
    dc.onclose = () => console.log('Data channel closed.');
    dc.onmessage = (e) => {
        onMessageCallbackRef.current?.(e.data);
    };
    dataChannelRef.current = dc;

    callDocRef.current = db.ref(`calls/${id}`);
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

    const callerId = getUserId();
    const callDataToSet: { [key: string]: any } = { offer, callerId };
    
    if (enableE2EE) {
        const { key, rawKey } = await generateKey();
        encryptionKeyRef.current = key;
        const exportableKey = Array.from(new Uint8Array(rawKey));
        callDataToSet.encryptionKey = exportableKey;
    } else {
        encryptionKeyRef.current = null;
        console.warn("Starting a call without End-to-End Encryption.");
    }
    
    await callDocRef.current.set(callDataToSet);

    callDocRef.current.on('value', async (snapshot: any) => {
      const data = snapshot.val();
      if (!data) {
        if (callState !== CallState.IDLE && callState !== CallState.ENDED) {
          hangUp();
        }
        return;
      }

      if (data?.declined) {
          setCallState(CallState.DECLINED);
          cleanUp();
          return;
      }

      if (data?.joinerId && !peerId) {
          setPeerId(data.joinerId);
      }

      if (data?.answer && (!pc.currentRemoteDescription || pc.currentRemoteDescription.sdp !== data.answer.sdp)) {
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDescription);
      }
    });
    
    answerCandidatesRef.current.on('child_added', (snapshot: any) => {
      const candidate = new RTCIceCandidate(snapshot.val());
      pc.addIceCandidate(candidate);
    });

    if (!isRinging) {
      setCallState(CallState.WAITING_FOR_ANSWER);
    }
    
  }, [createPeerConnection, hangUp, callState, peerId, cleanUp, enableE2EE]);

  const ringUser = useCallback(async (peer: PinnedEntry) => {
    if (!peer.peerId) {
        console.error("Cannot ring user without a peer ID.");
        return;
    }
    const newCallId = generateCallId();
    setPeerId(peer.peerId);
    setCallId(newCallId);

    const myUserId = getUserId();
    const myDisplayName = getUserDisplayName();
    const incomingCallRef = db.ref(`users/${peer.peerId}/incomingCall`);
    
    const callPayload: {from: string; callId: string; callerAlias?: string} = {
      from: myUserId,
      callId: newCallId,
    };

    if (myDisplayName) {
      callPayload.callerAlias = myDisplayName;
    }

    await incomingCallRef.set(callPayload);

    await initiateCall(newCallId, true);

    ringingTimeoutRef.current = setTimeout(() => {
        declineCall(newCallId, peer.peerId);
    }, RING_TIMEOUT_MS);

  }, [initiateCall, declineCall]);


  const startCall = useCallback(async () => {
    const newCallId = generateCallId();
    await initiateCall(newCallId);
  }, [initiateCall]);

  const joinCall = useCallback(async (id: string) => {
    isCallerRef.current = false;
    reconnectionAttemptsRef.current = 0;

    const callRef = db.ref(`calls/${id}`);
    const callSnapshot = await callRef.get();
    const callData = callSnapshot.val();
      
    if (callData?.offer) {
      if (!localStreamRef.current) {
        console.error("Cannot join call without a local stream.");
        setCallState(CallState.MEDIA_ERROR);
        return;
      }
      setCallState(CallState.JOINING);

      const initialOfferSdp = callData.offer.sdp;

      if (callData.callerId) {
        setPeerId(callData.callerId);
      }

      if (callData.encryptionKey) {
        const rawKey = new Uint8Array(callData.encryptionKey).buffer;
        encryptionKeyRef.current = await importKey(rawKey);
      } else {
        console.warn("Call does not support E2EE: encryption key is missing from signaling data.");
      }
      
      const pc = createPeerConnection(localStreamRef.current);
      setCallId(id);

      callDocRef.current = callRef;
      offerCandidatesRef.current = callDocRef.current.child('offerCandidates');
      answerCandidatesRef.current = callDocRef.current.child('answerCandidates');

      pc.onicecandidate = (event) => {
        event.candidate && answerCandidatesRef.current.push(event.candidate.toJSON());
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };
      
      const joinerId = getUserId();
      await callDocRef.current.update({ answer, joinerId });
      
      const calleeIncomingCallRef = db.ref(`users/${joinerId}/incomingCall`);
      await calleeIncomingCallRef.remove();

      offerCandidatesRef.current.on('child_added', (snapshot: any) => {
        const candidate = new RTCIceCandidate(snapshot.val());
        pc.addIceCandidate(candidate);
      });

      callDocRef.current.on('value', async (snapshot: any) => {
          const data = snapshot.val();
          if (!data) {
              if (callState !== CallState.IDLE && callState !== CallState.ENDED) {
                  hangUp();
              }
              return;
          }
          
          if (data?.offer && data.offer.sdp !== initialOfferSdp) {
              console.log("Received a new offer for reconnection.");
              setCallState(CallState.RECONNECTING);
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              
              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);
  
              const newAnswer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              };
              
              await callDocRef.current.update({ answer: newAnswer });
          }
      });

      setCallState(CallState.CREATING_ANSWER);
    } else {
        console.log(`Call ID "${id}" is available. Initializing a new call.`);
        await initiateCall(id);
    }
  }, [createPeerConnection, hangUp, initiateCall, callState]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState !== CallState.IDLE && callState !== CallState.ENDED) {
        hangUp();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hangUp, callState]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isVideoOff,
    callState,
    setCallState,
    errorMessage,
    callId,
    peerId,
    isE2EEActive,
    callStats,
    resolution,
    setResolution,
    enableE2EE,
    setEnableE2EE,
    enterLobby,
    startCall,
    joinCall,
    ringUser,
    declineCall,
    toggleMute,
    toggleVideo,
    hangUp,
    reset,
    setOnMessage,
    sendMessage,
  };
};
