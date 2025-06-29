// src/pages/Home/HomeScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth } from '../../config/Firebase/firebaseConfig'; // Asegúrate de la ruta relativa correcta
import { signOut } from 'firebase/auth';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Obtener el correo del usuario actual cuando la pantalla se carga
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email);
    }
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      Alert.alert('Sesión Cerrada', 'Has cerrado sesión correctamente.');
      // El observador en App.js detectará este cambio y redirigirá al usuario.
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      Alert.alert('Error', 'No se pudo cerrar sesión. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.subtitle}>Has iniciado sesión como:</Text>
      <Text style={styles.emailText}>{userEmail}</Text>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF', // Azul claro de fondo
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50', // Azul oscuro para el título
  },
  subtitle: {
    fontSize: 18,
    color: '#5D6D7E', // Gris azulado para subtítulo
    marginBottom: 5,
  },
  emailText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 40,
    textAlign: 'center',
  },
  signOutButton: {
    width: '100%',
    maxWidth: 250,
    height: 50,
    backgroundColor: '#E74C3C', // Rojo para el botón de cerrar sesión
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
