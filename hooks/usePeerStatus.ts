import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { PeerStatus } from '../types';

/**
 * A custom hook to track the online status of multiple peers.
 * It subscribes to the '/status/' path for each peer ID provided and
 * returns a map of their real-time presence information.
 *
 * @param peerIds An array of user IDs to monitor.
 * @returns An object mapping each peer ID to their `PeerStatus`.
 */
export const usePeerStatus = (peerIds: string[]) => {
  const [peerStatus, setPeerStatus] = useState<{ [key: string]: PeerStatus }>({});

  useEffect(() => {
    // A map to hold the listener functions for later cleanup
    const listeners: { [key: string]: (snapshot: any) => void } = {};

    peerIds.forEach(id => {
      const peerStatusRef = db.ref(`/status/${id}`);
      
      const listener = (snapshot: any) => {
        const status = snapshot.val();
        if (status) {
          setPeerStatus(prevStatus => ({
            ...prevStatus,
            [id]: status,
          }));
        }
      };

      peerStatusRef.on('value', listener);
      listeners[id] = listener;
    });

    // Cleanup function: Detach all listeners when the component unmounts or peerIds change
    return () => {
      peerIds.forEach(id => {
        const peerStatusRef = db.ref(`/status/${id}`);
        if (listeners[id]) {
          peerStatusRef.off('value', listeners[id]);
        }
      });
    };
  }, [peerIds]); // Rerun the effect if the list of peerIds changes

  return peerStatus;
};