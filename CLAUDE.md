# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a peer-to-peer video calling web application built with React, TypeScript, and WebRTC. It enables direct browser-to-browser video calls without requiring accounts or tracking, featuring optional end-to-end encryption using AES-GCM.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Firebase Setup

The app requires Firebase Realtime Database for signaling:

1. Copy `firebase.ts.example` to `firebase.ts`
2. Add your Firebase configuration to `firebase.ts`
3. **Important:** `firebase.ts` is gitignored to prevent credential exposure

## Architecture

### WebRTC Signaling Flow

The app uses Firebase Realtime Database as a signaling server for WebRTC connection establishment:

1. **Call Creation**: Caller generates a human-readable call ID (format: `adjective-noun-verb`, e.g., "happy-river-sings")
2. **Offer/Answer Exchange**: WebRTC SDP offers and answers are stored in Firebase at `/calls/{callId}`
3. **ICE Candidate Exchange**: ICE candidates are stored at `/calls/{callId}/offerCandidates` and `/calls/{callId}/answerCandidates`
4. **Direct Ringing**: Users can ring specific peers by writing to `/users/{userId}/incomingCall` (includes `from`, `callId`, and optional `callerAlias`)
5. **Call Metadata**: Each call stores `callerId`, `joinerId`, optional `encryptionKey`, and `declined` flag in Firebase

**Firebase Paths:**
- `/calls/{callId}` - Call signaling data (offer, answer, candidates, encryption key)
- `/users/{userId}/incomingCall` - Incoming call notifications
- `/status/{userId}` - User presence (isOnline, lastChanged)

### Call State Management

The application uses a comprehensive state machine (`CallState` enum in `types.ts:1`) to manage call lifecycle:

- `IDLE` → `LOBBY` → `CREATING_OFFER`/`JOINING` → `CONNECTED`
- Special states: `INCOMING_CALL`, `RINGING`, `RECONNECTING`, `DECLINED`, `MEDIA_ERROR`

All call state logic is centralized in the `useWebRTC` hook (`hooks/useWebRTC.ts`).

### End-to-End Encryption

Optional E2EE is implemented using:
- AES-GCM 256-bit encryption with per-frame IVs
- Encryption key exchange via Firebase signaling (caller generates key, joiner imports it from `/calls/{callId}/encryptionKey`)
- Transform streams applied to RTCRtpSender/RTCRtpReceiver encoded frames
- Implementation: `utils/crypto.ts`
- Per-frame counter-based IVs ensure unique nonces for each encrypted frame

Browser support check: looks for `createEncodedStreams` in `RTCRtpSender.prototype`.

### Component Structure

- **App.tsx**: Main application component managing state and routing between screens
- **hooks/useWebRTC.ts**: Core WebRTC logic including peer connection, media streams, signaling, reconnection, and E2EE
- **hooks/usePresence.ts**: Firebase presence tracking for online/offline status
- **hooks/usePeerStatus.ts**: Monitors presence status of pinned contacts
- **hooks/useDraggable.ts**: Drag-and-drop functionality for floating UI elements

### Key Features

- **Lobby System**: Pre-call preview with media settings (resolution, E2EE toggle). Entered via `enterLobby()` before creating, joining, or accepting calls.
- **Reconnection**: Automatic reconnection with exponential backoff (max 3 attempts, caller-only). Uses ICE restart via `restartIce()` in `useWebRTC.ts:227`.
- **Chat**: In-call text messaging via WebRTC data channel
- **Call History**: Stored in localStorage with alias support
- **Pinned Contacts**: Save frequent contacts with peer IDs for direct ringing
- **Floating Video**: Draggable remote video overlay during calls
- **Connection Stats**: Real-time display of packet loss, jitter, RTT, and bitrates (updated every 1 second)
- **Presence System**: Firebase presence tracking at `/status/{userId}` with online/offline status and timestamps

### Data Channel Messages

The data channel (`dataChannelRef` in `useWebRTC`) sends JSON messages:
```typescript
// Chat messages
{ type: 'chat', payload: string }

// Control messages (mute/video state)
{ type: 'control', payload: { type: 'mute' | 'video', value: boolean } }
```

### Resolution Settings

Predefined constraints in `hooks/useWebRTC.ts:12`:
- `1080p`: 1920x1080
- `720p`: 1280x720 (default)
- `480p`: 854x480

### Utility Functions

- **utils/id.ts**: Generates human-readable call IDs and UUIDs
- **utils/crypto.ts**: E2EE implementation with AES-GCM
- **utils/history.ts**: localStorage persistence for call history
- **utils/pins.ts**: localStorage persistence for pinned contacts
- **utils/user.ts**: User ID generation and display name management
- **utils/sounds.ts**: Audio feedback (incoming, connected, ringing, ended)

## Deployment

The app is configured for Firebase Hosting:

```bash
# Build and deploy
npm run build
firebase deploy
```

Configuration: `firebase.json` specifies `dist/` as the hosting directory with SPA rewrites.

## Important Notes

- Call IDs must match pattern: `/^[a-z]+-[a-z]+-[a-z]+$/` (validated in `App.tsx:71`)
- User IDs are anonymous UUIDs stored in localStorage (`p2p-user-id` key)
- Display names are stored in localStorage (`p2p-user-display-name` key)
- STUN servers from Google are configured in `constants.ts:2`
- The app requires HTTPS in production for WebRTC getUserMedia API
- Firebase credentials in `firebase.ts` should never be committed (file is in `.gitignore`)
- Firebase SDK is loaded via CDN script tags in index.html (not via npm)
- Ring timeout is 30 seconds (configurable via `RING_TIMEOUT_MS` in `useWebRTC.ts:10`)
- Reconnection delay uses exponential backoff: 2000ms * attempt number
- No CI/CD pipelines configured; deployment is manual via `firebase deploy`
