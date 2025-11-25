
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper to get stored config
const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem('advancement_os_firebase_config');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse stored firebase config", e);
  }
  return null;
};

const storedConfig = getStoredConfig();

const envConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Use stored config if available, otherwise env config, otherwise placeholders
const firebaseConfig = storedConfig || {
  apiKey: envConfig.apiKey || "YOUR_API_KEY_HERE",
  authDomain: envConfig.authDomain || "your-project.firebaseapp.com",
  projectId: envConfig.projectId || "your-project-id",
  storageBucket: envConfig.storageBucket || "your-project.appspot.com",
  messagingSenderId: envConfig.messagingSenderId || "00000000000",
  appId: envConfig.appId || "1:00000000:web:0000000000"
};

// Check if we are in mock mode (missing keys or placeholders)
export const useMockBackend = !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE";

// Initialize Firebase only if not already initialized and if we have keys (or to just satisfy imports)
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

if (!useMockBackend) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        authInstance = getAuth(app);
        firestoreInstance = getFirestore(app);
        console.log("Firebase initialized successfully via", storedConfig ? "User Config" : "Env Config");
    } catch (e) {
        console.warn("Firebase initialization failed, falling back to mock backend", e);
    }
}

// Export Cloud Services (safe to be undefined in mock mode, services will check useMockBackend)
export const auth = authInstance as any;
export const firestore = firestoreInstance as any;
