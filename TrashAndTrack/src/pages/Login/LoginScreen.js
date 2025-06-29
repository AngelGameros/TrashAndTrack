// src/pages/Login/LoginScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/Firebase/firebaseConfig'; // Asegúrate de la ruta relativa correcta

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Alterna entre registro e inicio de sesión
  const [loading, setLoading] = useState(false); // Estado de carga

  const handleAuthentication = async () => {
    setLoading(true);
    try {
      if (isRegistering) {
        // Lógica para registrar un nuevo usuario
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Éxito', '¡Usuario registrado y sesión iniciada correctamente!');
      } else {
        // Lógica para iniciar sesión con un usuario existente
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Éxito', '¡Sesión iniciada correctamente!');
      }
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      // Mostrar un mensaje de error más específico al usuario
      let errorMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está en uso. Intenta iniciar sesión.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      }
      Alert.alert('Error de autenticación', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleAuthentication}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isRegistering ? 'Registrarse' : 'Iniciar Sesión'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.toggleButtonText}>
          {isRegistering ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes una cuenta? Regístrate'}
        </Text>
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
    backgroundColor: '#F7F7F7', // Fondo claro
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    width: '100%',
    maxWidth: 350,
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    width: '100%',
    maxWidth: 350,
    height: 55,
    backgroundColor: '#007AFF', // Azul brillante
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
