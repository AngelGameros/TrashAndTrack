// src/pages/Route/RouteScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RouteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Ruta Asignada</Text>
      <Text style={styles.subtitle}>Aquí se mostrará la ruta de recolección.</Text>
      {/* Podrías integrar un mapa aquí */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FFFA', // MintCream
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2E8B57', // SeaGreen
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#3CB371', // MediumSeaGreen
  },
});