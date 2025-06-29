// src/config/Firebase/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase específica, leyendo de variables de entorno
const firebaseConfig = {
  // Asegúrate de que las variables de entorno tienen el prefijo EXPO_PUBLIC_
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Inicializar la aplicación Firebase
const app = initializeApp(firebaseConfig);

// Obtener la instancia de autenticación y asignarla a una variable antes de exportar.
const authInstance = getAuth(app);

// Exportar la instancia de autenticación con el nombre 'auth'
export { authInstance as auth };
