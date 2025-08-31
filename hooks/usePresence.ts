import { useEffect } from 'react';
import { db, ServerValue } from '../firebase';

/**
 * A custom hook to manage a user's online presence in Firebase Realtime Database.
 * It leverages Firebase's `onDisconnect` functionality to reliably update the user's
 * status when they connect or disconnect.
 *
 * @param userId The unique ID of the current user.
 */
export const usePresence = (userId: string | null) => {
  useEffect(() => {
    if (!userId) return;

    // Reference to the user's status in the '/status/' path
    const userStatusRef = db.ref(`/status/${userId}`);
    
    // Reference to Firebase's special '.info/connected' path
    const connectedRef = db.ref('.info/connected');

    const listener = connectedRef.on('value', (snapshot: any) => {
      // If the user is not connected, do nothing. Firebase's `onDisconnect` will handle it.
      if (snapshot.val() === false) {
        return;
      }

      // If the user is connected, set their status to online and record the timestamp.
      // The `onDisconnect` handler will be triggered by the Firebase servers when the connection is lost.
      userStatusRef.onDisconnect().set({
        isOnline: false,
        lastChanged: ServerValue.TIMESTAMP,
      }).then(() => {
        // Once the `onDisconnect` is established, set the user's current status.
        userStatusRef.set({
          isOnline: true,
          lastChanged: ServerValue.TIMESTAMP,
        });
      });
    });

    // Cleanup function to remove the listener when the component unmounts or userId changes.
    return () => {
      connectedRef.off('value', listener);
    };
  }, [userId]);
};