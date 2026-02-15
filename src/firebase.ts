// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDql7i6YjV0jPAd7qHfBIqSHeGX0Hih98M",
  authDomain: "loginsight-e1f84.firebaseapp.com",
  projectId: "loginsight-e1f84",
  storageBucket: "loginsight-e1f84.firebasestorage.app",
  messagingSenderId: "123809379755",
  appId: "1:123809379755:web:cae5af14844d31b62e8eee",
  measurementId: "G-SSGCYS7512"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);