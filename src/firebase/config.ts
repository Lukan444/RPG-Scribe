// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Initialize Firestore
const db = getFirestore(app);

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

// If we're in development mode and don't have real credentials, use mock implementation
if (isDevelopment && !hasRealCredentials) {
  console.warn(
    "Firebase is running with demo credentials. Authentication will not work properly. " +
    "Please set up a Firebase project and update the .env file with your Firebase configuration."
  );

  // You could set up auth and firestore emulators here if needed
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
} else {
  // Enable Firestore offline persistence
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore persistence unavailable - multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required for persistence
        console.warn('Firestore persistence unavailable - unsupported browser');
      } else {
        console.error('Error enabling Firestore persistence:', err);
      }
    });
}

export { app, auth, db };
