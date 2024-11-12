// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBR7F7w83gIh8XXVVWk9m__BJzDIYfU-s8",
    authDomain: "v7studio-f258c.firebaseapp.com",
    projectId: "v7studio-f258c",
    storageBucket: "v7studio-f258c.appspot.com",
    messagingSenderId: "509372777956",
    appId: "1:509372777956:web:d41b077493110b96b8f3f1",
    measurementId: "G-HWS53L3MYV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
