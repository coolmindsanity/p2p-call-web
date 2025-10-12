import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
global.firebase = {
  initializeApp: vi.fn(),
  auth: vi.fn(() => ({
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn().mockResolvedValue({}),
    currentUser: { uid: 'test-user-id' },
  })),
  database: vi.fn(() => ({
    ref: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      push: vi.fn(),
    })),
    ServerValue: { TIMESTAMP: 'timestamp' },
  })),
} as any;

// Mock WebRTC APIs
global.RTCPeerConnection = vi.fn() as any;
global.RTCSessionDescription = vi.fn() as any;
global.RTCIceCandidate = vi.fn() as any;

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
  }),
} as any;

// Mock window.crypto for E2EE tests
if (!global.crypto) {
  global.crypto = {
    subtle: {
      generateKey: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    },
  } as any;
}
