// src/pages/Scan/ScanScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Escaneo QR</Text>
      <Text style={styles.subtitle}>Aquí se activará la cámara para escanear códigos QR.</Text>
      {/* Podrías integrar un lector de QR aquí */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0FFFF', // LightCyan
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#008B8B', // DarkCyan
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#20B2AA', // LightSeaGreen
  },
});