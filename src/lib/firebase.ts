import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, (firebaseConfigData as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Sesi login hanya berlaku selama tab/browser aktif.
// Saat browser ditutup atau logout, pengguna wajib login ulang.
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn("Could not set auth session persistence:", err);
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Validate connection to Firestore on initial boot
import('firebase/firestore').then(({ doc, getDocFromServer }) => {
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  });
});

