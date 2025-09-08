import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase - SUBSTITUA pelos seus dados do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQcPmDRrMjx0fu8v41sjbgv6ycST6stmU",
  authDomain: "choparia-vendas.firebaseapp.com",
  projectId: "choparia-vendas",
  storageBucket: "choparia-vendas.firebasestorage.app",
  messagingSenderId: "735188714145",
  appId: "1:735188714145:web:2df5968e7494e20c1726e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
