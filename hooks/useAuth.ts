import { useState, useEffect } from 'react';
import { auth, ensureAuthenticated } from '../firebase';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await ensureAuthenticated();
        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error: any) {
        console.error('Failed to authenticate:', error);

        // Provide helpful error message
        let errorMessage = 'Authentication failed';
        if (error.code === 'auth/configuration-not-found' ||
            (error.message && error.message.includes('CONFIGURATION_NOT_FOUND'))) {
          errorMessage = 'Anonymous authentication is not enabled. Please enable it in Firebase Console: Authentication → Sign-in method → Anonymous';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setAuthError(errorMessage);
      } finally {
        setIsAuthenticating(false);
      }
    };

    // Check if already authenticated
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) {
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        setAuthError(null);
      } else {
        // Not authenticated, try to authenticate
        initAuth();
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAuthenticated, isAuthenticating, authError };
};
