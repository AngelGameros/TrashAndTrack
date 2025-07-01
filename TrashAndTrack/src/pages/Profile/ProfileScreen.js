// src/pages/Profile/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Perfil</Text>
      <Text style={styles.subtitle}>Aquí se mostrará la información del perfil del usuario.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6E6FA', // Lavender
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4B0082', // Indigo
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6A5ACD', // SlateBlue
  },
});