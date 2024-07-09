// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const key1 = "AIzaSy";
const key2 = "AaFQZFadAA6h4";
const key3 = "bxCeY0bK-9t4DPAKbmjE";
const firebaseConfig = {
  apiKey: key1 + key2 + key3,
  authDomain: "respondnow-8217f.firebaseapp.com",
  projectId: "respondnow-8217f",
  storageBucket: "respondnow-8217f.appspot.com",
  messagingSenderId: "943080255739",
  appId: "1:943080255739:web:22e6352678e495eccfc05e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = firebase.auth();

const db = firebase.firestore();


export { auth, db };