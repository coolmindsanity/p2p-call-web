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

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Firebase Setup

The app requires Firebase Realtime Database for signaling and Firebase Authentication for security:

1. Copy `firebase.ts.example` to `firebase.ts`
2. Add your Firebase configuration to `firebase.ts`
3. **Enable Anonymous Authentication** in Firebase Console
4. **Deploy Security Rules**: Run `firebase deploy --only database` to deploy the rules from `database.rules.json`
5. **Important:** `firebase.ts` is gitignored to prevent credential exposure

### Firebase Security Rules

The app includes comprehensive Firebase security rules (`database.rules.json`) that:
- Require authentication for all database operations
- Validate data structures for calls, users, and status
- Restrict write access to authorized users only
- Protect against unauthorized data modifications

## Architecture

### Authentication

The app uses **Firebase Anonymous Authentication** to secure the database while maintaining user privacy:
- Users are automatically authenticated on app load
- No personal information is collected or stored
- Each user gets a unique anonymous UID
- Authentication state is managed via `hooks/useAuth.ts`
- Loading and error states are handled gracefully in `App.tsx`

### Security Features

1. **HTTPS Enforcement**: Automatically redirects to HTTPS in production (`utils/security.ts`)
2. **WebRTC Feature Detection**: Checks browser support on startup
3. **Error Boundary**: Global error handling with detailed logging (`components/ErrorBoundary.tsx`)
4. **Security Headers**: Configured in `firebase.json` for HSTS, CSP, and XSS protection
5. **E2EE Support Detection**: Checks for Insertable Streams API availability

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

### ICE Server Configuration

Configured in `constants.ts` with both STUN and TURN servers:
- **STUN Servers**: Google's public STUN servers for NAT discovery
- **TURN Servers**: Open Relay Project TURN servers for restrictive NAT traversal
- For production, consider using paid TURN services (Twilio, Xirsys) for better reliability

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
- **components/ErrorBoundary.tsx**: Global error boundary for catching and displaying React errors
- **hooks/useWebRTC.ts**: Core WebRTC logic including peer connection, media streams, signaling, reconnection, and E2EE
- **hooks/useAuth.ts**: Firebase authentication management
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
- **PWA Support**: Service worker for offline capability and installability

### Progressive Web App (PWA)

The app is configured as a PWA with:
- Service worker (`public/sw.js`) for offline support and caching
- Web app manifest (`public/manifest.json`) for installability
- Cache-first strategy for static assets
- Network-first strategy for Firebase API calls
- Automatic cache cleanup on updates

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
- **utils/security.ts**: HTTPS enforcement and WebRTC feature detection

### Styling

The app uses **Tailwind CSS** with local build optimization:
- Configuration in `tailwind.config.js`
- PostCSS processing via `postcss.config.js`
- Main styles in `index.css` with custom utilities and animations
- Dark mode theme with glassmorphism effects
- Optimized content paths to exclude node_modules

## Testing

The project uses **Vitest** for testing:
- Configuration: `vitest.config.ts`
- Test setup: `test/setup.ts` (mocks Firebase and WebRTC APIs)
- Test files: `test/**/*.test.ts`
- Coverage available via `npm run test:coverage`

### Test Structure

- `test/utils/id.test.ts`: Tests for ID generation utilities
- `test/utils/security.test.ts`: Tests for security utilities and feature detection

## Deployment

The app is configured for Firebase Hosting:

```bash
# Build and deploy
npm run build
firebase deploy

# Deploy only database rules
firebase deploy --only database

# Deploy only hosting
firebase deploy --only hosting
```

Configuration: `firebase.json` specifies:
- `dist/` as the hosting directory with SPA rewrites
- Database security rules location
- Security headers (HSTS, CSP, X-Frame-Options, etc.)

## Important Notes

### Security
- Call IDs must match pattern: `/^[a-z]+-[a-z]+-[a-z]+$/` (validated in `App.tsx:71`)
- User IDs are anonymous UUIDs stored in localStorage (`p2p-user-id` key)
- Display names are stored in localStorage (`p2p-user-display-name` key)
- The app requires HTTPS in production for WebRTC getUserMedia API (enforced in code)
- Firebase credentials in `firebase.ts` should never be committed (file is in `.gitignore`)
- Anonymous authentication is required for database access
- Database security rules must be deployed before first use

### WebRTC Configuration
- ICE servers (STUN + TURN) are configured in `constants.ts`
- STUN servers from Google for NAT discovery
- TURN servers from Open Relay Project for NAT traversal
- For production, consider paid TURN services for better reliability
- Ring timeout is 30 seconds (configurable via `RING_TIMEOUT_MS` in `useWebRTC.ts:10`)
- Reconnection delay uses exponential backoff: 2000ms * attempt number

### External Dependencies
- React 19 and Firebase SDK are loaded via CDN (see `index.html`)
- Tailwind CSS is built locally and bundled
- All other dependencies are npm-managed

### Development
- No CI/CD pipelines configured; deployment is manual via `firebase deploy`
- Service worker caching may require hard refresh during development
- Use `npm run preview` to test production build locally
- Tests can be run in watch mode by omitting `--run` flag

## Browser Support

Requires modern browsers with:
- WebRTC support (RTCPeerConnection, getUserMedia)
- Insertable Streams (for E2EE - optional)
- Service Worker (for PWA - optional)
- ES2022 features

Recommended:
- Chrome/Edge 90+
- Firefox 90+
- Safari 15.4+ (limited E2EE support)
