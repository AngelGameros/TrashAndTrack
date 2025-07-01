// src/pages/Calendar/CalendarScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Calendario de Recolecciones</Text>
      <Text style={styles.subtitle}>Aquí se mostrará el calendario y las fechas de recolección.</Text>
      {/* Podrías integrar un componente de calendario aquí */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC', // Cornsilk
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#DAA520', // Goldenrod
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#B8860B', // DarkGoldenrod
  },
});