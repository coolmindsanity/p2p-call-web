// NOTE: This assumes the Firebase SDKs have been loaded via <script> tags in index.html

// ---
// IMPORTANT: Replace the placeholder values below with your own Firebase project configuration.
// You can get this from the Firebase console by following these steps:
// 1. Go to your Project Settings in the Firebase Console.
// 2. In the "General" tab, scroll down to "Your apps".
// 3. Select your web app.
// 4. Look for the "Firebase SDK snippet" section and choose "Config".
// 5. Copy the `firebaseConfig` object and paste it here.
// ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = (window as any).firebase.initializeApp(firebaseConfig);

// Get a reference to the Realtime Database service
export const db = (window as any).firebase.database();
