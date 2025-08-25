// Path: lib/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

type Env = {
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
};

// Expo SDK 50+: expoConfig.extra; older: manifest.extra
const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Env;

const firebaseConfig: FirebaseOptions = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
};

// --- App singleton
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Auth singleton (typed)
let _auth: Auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}
export const auth: Auth = _auth;

// --- Firestore & Storage (typed)
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
