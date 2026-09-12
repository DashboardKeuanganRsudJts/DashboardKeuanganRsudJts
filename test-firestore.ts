import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfigData from './firebase-applet-config.json';
const app = initializeApp(firebaseConfigData);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfigData.firestoreDatabaseId);
console.log(db);
