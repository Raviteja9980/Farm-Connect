
// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let storage: FirebaseStorage;
let firebaseInitializedCorrectly = false;

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  console.error(
    'CRITICAL: Firebase config is incomplete. Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set. Firebase features will not work.'
  );
  // Provide non-functional instances to avoid immediate crashes at import time.
  app = {} as FirebaseApp;
  storage = {} as FirebaseStorage;
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      firebaseInitializedCorrectly = true;
    } catch (e) {
      console.error("CRITICAL: Firebase app initialization failed.", e);
      app = {} as FirebaseApp;
    }
  } else {
    app = getApp();
    firebaseInitializedCorrectly = true; // Assume if app exists, it was initialized correctly.
  }

  if (firebaseInitializedCorrectly) {
    try {
      storage = getStorage(app);
    } catch (error) {
      console.error("CRITICAL: Failed to initialize Firebase Storage. Ensure your Firebase project is correctly configured and Storage is enabled.", error);
      storage = {} as FirebaseStorage; // Provide a non-functional storage instance
      firebaseInitializedCorrectly = false; // Mark as not fully initialized
    }
  } else {
    storage = {} as FirebaseStorage;
  }
}

export { app, storage, firebaseInitializedCorrectly };
