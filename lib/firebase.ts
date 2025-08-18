// /lib/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;

const firebaseConfig = {
  apiKey: extra?.FIREBASE_API_KEY,
  authDomain: extra?.FIREBASE_AUTH_DOMAIN,
  projectId: extra?.FIREBASE_PROJECT_ID,
  storageBucket: extra?.FIREBASE_STORAGE_BUCKET, // <-- doit être défini dans app.json
  messagingSenderId: extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra?.FIREBASE_APP_ID,
};

// Initialise Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialise Auth
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  auth = getAuth(app);
}

// ✅ Initialise Firestore et Storage
const firestore = getFirestore(app);
const storage = getStorage(app); // <-- AJOUT

export { auth, firestore, storage };

