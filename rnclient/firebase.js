// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from "firebase/auth"

// Your web app's Firebase configuration

const key1 = "AIzaSy";
const key2 = "AaFQZFadAA6h4";
const key3 = "bxCeY0bK-9t4DPAKbmjE";
const firebaseConfig = {
        apiKey: key1 + key2 + key3,
        authDomain: "respondnow-8217f.firebaseapp.com",
        databaseURL: "https://respondnow-8217f-default-rtdb.firebaseio.com",
        projectId: "respondnow-8217f",
        storageBucket: "respondnow-8217f.appspot.com",
        messagingSenderId: "943080255739",
        appId: "1:943080255739:web:22e6352678e495eccfc05e"
      };
      

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// console.log('APP:', app);
const db = getDatabase(app);

const auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
// console.log('DATABASE:', db);

export {auth, db};
