// src/config/Firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Si vas a usar Firestore o cualquier otro servicio, impórtalo aquí:
// import { getFirestore } from 'firebase/firestore'; 

// Tu configuración de Firebase específica
const firebaseConfig = {
  apiKey: "AIzaSyAFke4dQQfIPsBFkshWvCB9jVuYuilDWuA",
  authDomain: "trashandtrack-928dc.firebaseapp.com",
  projectId: "trashandtrack-928dc",
  storageBucket: "trashandtrack-928dc.firebasestorage.app",
  messagingSenderId: "412401788328",
  appId: "1:412401788328:web:3e8574a349f16fe181299d"
};

// Inicializar la aplicación Firebase
const app = initializeApp(firebaseConfig);

// Obtener la instancia de autenticación
const auth = getAuth(app);

// Si necesitas Firestore, puedes inicializarlo así:
// const db = getFirestore(app);

// Exportar los servicios de Firebase que vas a utilizar en tu aplicación
export { auth /*, db*/ };
