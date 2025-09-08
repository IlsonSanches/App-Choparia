import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQcPmDRrMjx0fu8v41sjbgv6ycST6stmU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "choparia-vendas.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "choparia-vendas",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "choparia-vendas.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "735188714145",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:735188714145:web:2df5968e7494e20c1726e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
