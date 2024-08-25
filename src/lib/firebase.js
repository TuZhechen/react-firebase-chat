// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-95a64.firebaseapp.com",
  projectId: "reactchat-95a64",
  storageBucket: "reactchat-95a64.appspot.com",
  messagingSenderId: "154671251316",
  appId: "1:154671251316:web:e37c080ef6ee362357f621"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export storage
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();