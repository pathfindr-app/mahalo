import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAYReyOsNfW8Zsa1cUKFGSQOEnylDc_yNk",
  authDomain: "mahalorewardscard.firebaseapp.com",
  projectId: "mahalorewardscard",
  storageBucket: "mahalorewardscard.firebasestorage.app",
  messagingSenderId: "550890960598",
  appId: "1:550890960598:web:a1b0f5655500e58ae2fb77",
  measurementId: "G-ZF9GE5B0Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app; 