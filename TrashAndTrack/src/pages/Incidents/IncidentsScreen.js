// src/pages/Incidents/IncidentsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IncidentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Llenado de Incidentes</Text>
      <Text style={styles.subtitle}>Formulario para reportar incidentes en ruta.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAD2', // LightGoldenrodYellow
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#B8860B', // DarkGoldenrod
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#DAA520', // Goldenrod
  },
});