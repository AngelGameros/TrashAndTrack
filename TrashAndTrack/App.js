// App.js

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/Firebase/firebaseConfig'; // Asegúrate de la ruta correcta

// Importar las pantallas desde sus nuevas ubicaciones
import LoginScreen from './src/pages/Login/LoginScreen';
import HomeScreen from './src/pages/Home/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null); // Almacena el objeto de usuario autenticado
  const [loading, setLoading] = useState(true); // Indica si el estado de autenticación está siendo verificado

  useEffect(() => {
    // Suscribirse a los cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Actualiza el estado del usuario
      setLoading(false);    // Ya no estamos cargando
    });

    // Limpiar la suscripción cuando el componente se desmonta
    return unsubscribe;
  }, []);

  if (loading) {
    // Mostrar un indicador de carga mientras se verifica el estado de autenticación inicial
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Si el usuario está logueado, mostrar la pantalla de Home
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // Si no hay usuario, mostrar la pantalla de Login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
