// src/pages/Reports/ReportsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Llenado de Reportes</Text>
      <Text style={styles.subtitle}>Formulario para generar reportes de recolección.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E1', // MistyRose
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#CD5C5C', // IndianRed
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FA8072', // Salmon
  },
});