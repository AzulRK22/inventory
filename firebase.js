// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCURk9cgOAGvhBg_dtZd47XtFyio-wwwEk",
  authDomain: "inventory-management-682ae.firebaseapp.com",
  projectId: "inventory-management-682ae",
  storageBucket: "inventory-management-682ae.appspot.com",
  messagingSenderId: "925949183711",
  appId: "1:925949183711:web:5195fefcebeb7fc40f4b6a",
  measurementId: "G-WV23EHML6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

export{firestore, storage}