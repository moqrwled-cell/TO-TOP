import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCD1szc5K2U2UN-KJU1JrKGa2iSIrV7RCw",
  authDomain: "to-top-e4ba4.firebaseapp.com",
  projectId: "to-top-e4ba4",
  storageBucket: "to-top-e4ba4.firebasestorage.app",
  messagingSenderId: "2756380282",
  appId: "1:2756380282:web:a56d755eab18a38e9e9dc3",
  measurementId: "G-TN5664VGYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let db;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (error) {
  console.error("Firestore offline cache failed, falling back to default.", error);
  db = getFirestore(app);
}
