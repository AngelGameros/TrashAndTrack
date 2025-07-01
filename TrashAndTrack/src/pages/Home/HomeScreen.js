// src/pages/Home/HomeScreen.js (Módulo de Camión Asignado)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth, db } from '../../config/Firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState(''); // Estado para el nombre a mostrar
  const [isLoadingName, setIsLoadingName] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      if (auth.currentUser) {
        setIsLoadingName(true);
        try {
          const docRef = doc(db, "usersApproval", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const nombre = userData.nombre || '';
            const apellidoPaterno = userData.apellidoPaterno || '';

            // Construir el nombre completo, filtrando campos vacíos
            const fullName = [nombre, apellidoPaterno]
              .filter(Boolean) // Elimina cualquier string vacío o null/undefined
              .join(' '); // Une los restantes con un espacio

            setDisplayName(fullName || auth.currentUser.email);
          } else {
            // Si por alguna razón no hay documento de aprobación, usar el email
            setDisplayName(auth.currentUser.email);
          }
        } catch (error) {
          console.error("Error al obtener el nombre del usuario para HomeScreen:", error);
          // En caso de error, usar el email
          setDisplayName(auth.currentUser.email);
        } finally {
          setIsLoadingName(false);
        }
      } else {
        setIsLoadingName(false); // No hay usuario, no hay nombre que cargar
      }
    };

    fetchUserName();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo de Camión Asignado</Text>
      <Text style={styles.subtitle}>¡Bienvenido, {displayName}!</Text>

      {/* Aquí podrías añadir la interfaz del camión asignado */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles del Camión</Text>
        <Text style={styles.cardText}>Nivel de gasolina: 75%</Text>
        <Text style={styles.cardText}>Peso de carga actual: 3.250 kg</Text>
        <Text style={styles.cardText}>Temperatura: 18°C</Text>
        <Text style={styles.cardText}>Humedad: 55%</Text>
        <Text style={styles.cardText}>Detector de gases peligrosos: OK</Text>
      </View>

      {/* El botón de cerrar sesión ahora estará principalmente en el menú lateral */}
      {/* <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
        )}
      </TouchableOpacity> */}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50', // Azul oscuro para el título
  },
  subtitle: {
    fontSize: 18,
    color: '#5D6D7E', // Gris azulado para subtítulo
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    maxWidth: 380,
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495E',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
    paddingBottom: 5,
    width: '100%',
  },
  cardText: {
    fontSize: 16,
    color: '#5D6D7E',
    marginBottom: 8,
  },
  signOutButton: {
    width: '100%',
    maxWidth: 250,
    height: 50,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});