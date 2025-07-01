// src/pages/Info/InfoScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Información</Text>
      <Text style={styles.subtitle}>Información útil y manuales.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#AFEEEE', // PaleTurquoise
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4682B4', // SteelBlue
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6A5ACD', // SlateBlue
  },
});