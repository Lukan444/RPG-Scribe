// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ"
};

// Check if we have real Firebase credentials
const hasRealCredentials =
  process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_API_KEY !== "your-api-key" &&
  process.env.REACT_APP_FIREBASE_API_KEY !== "demo-api-key";

// Debug log Firebase configuration
console.log('Firebase Config:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '***' : 'not set',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '***' : 'not set',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-app',
  hasRealCredentials
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore with proper TypeScript typing
// Note: Modern cache API (persistentLocalCache) will be enabled when TypeScript types are fully supported
const db: Firestore = getFirestore(app);
// Initialize Firebase Storage
const storage = getStorage(app);

// If we're in development mode and don't have real credentials, show warning
if (isDevelopment && !hasRealCredentials) {
  console.warn(
    "Firebase is running with demo credentials. Authentication will not work properly. " +
    "Please set up a Firebase project and update the .env file with your Firebase configuration."
  );

  // You could set up auth and firestore emulators here if needed
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
} else {
  // Note: Firebase v10+ automatically handles persistence optimization
  // The deprecated enableIndexedDbPersistence() has been removed
  // Modern cache API will be implemented when TypeScript types are fully available
  console.log('Firestore initialized with automatic persistence optimization');
}

// Set authentication persistence to LOCAL (persists even when browser is closed)
// This is wrapped in a try/catch because it can only be called once per page load
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase authentication persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('Error setting authentication persistence:', error);
    });
} catch (error) {
  console.warn('Authentication persistence already set');
}

export { app, auth, db, storage };
