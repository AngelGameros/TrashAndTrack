import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, SafeAreaView, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { auth, db } from '../../config/Firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL
  
  // Estado para el nombre a mostrar
  const [displayName, setDisplayName] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(true);

  // Estado para el camión
  const [assignedTruck, setAssignedTruck] = useState(null);
  const [loadingTruck, setLoadingTruck] = useState(true);

  // Estado para refresco pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

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
          const fullName = [nombre, apellidoPaterno].filter(Boolean).join(' ');
          setDisplayName(fullName || auth.currentUser.email);
        } else {
          setDisplayName(auth.currentUser.email);
        }
      } catch (error) {
        console.error("Error al obtener el nombre del usuario para HomeScreen:", error);
        setDisplayName(auth.currentUser.email);
      } finally {
        setIsLoadingName(false);
      }
    } else {
      setIsLoadingName(false);
    }
  };

  const fetchAssignedTruck = async () => {
    try {
      setLoadingTruck(true);
      const uid = auth.currentUser.uid;
      const response = await fetch(`http://${IP_URL}:5000/api/camionasignado/${uid}`);
      const data = await response.json();
      setAssignedTruck(data.camion);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoadingTruck(false);
    }
  };

  // Función para refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserName(), fetchAssignedTruck()]);
    setRefreshing(false);
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchUserName();
    fetchAssignedTruck();
  }, []);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'activo':
        return { text: 'ACTIVO', color: '#4CAF50', backgroundColor: '#E8F5E9' };
      case 'en_mantenimiento':
        return { text: 'EN MANTENIMIENTO', color: '#FFC107', backgroundColor: '#FFF8E1' };
      case 'fuera_de_servicio':
        return { text: 'FUERA DE SERVICIO', color: '#F44336', backgroundColor: '#FFEBEE' };
      default:
        return { text: 'DESCONOCIDO', color: '#9E9E9E', backgroundColor: '#F5F5F5' };
    }
  };

  if (loadingTruck || isLoadingName) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text>Cargando información...</Text>
      </View>
    );
  }

  if (!assignedTruck) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No hay camión asignado.</Text>
      </View>
    );
  }

  const statusInfo = getStatusDisplay(assignedTruck.estado);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0097A7']}
            tintColor="#0097A7"
          />
        }
      >
        <Text style={styles.welcomeTitle}>
          ¡Bienvenido, {displayName}!
        </Text>
        <Text style={styles.moduleTitle}>Mi Camión Asignado</Text>

        <View style={styles.truckCard}>
          <MaterialIcons name="local-shipping" size={80} color="#00796B" style={styles.truckIcon} />
          <Text style={styles.truckName}>{assignedTruck.marca} {assignedTruck.modelo}</Text>
          <Text style={styles.truckId}>ID: {assignedTruck.idCamion}</Text>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>

          <View style={styles.infoSection}>
            <InfoRow icon="branding-watermark" label="Marca:" value={assignedTruck.marca} />
            <InfoRow icon="model-training" label="Modelo:" value={assignedTruck.modelo} />
            <InfoRow icon="car-rental" label="Placas:" value={assignedTruck.placa} />
            <InfoRow icon="inventory" label="Capacidad de Carga:" value={`${assignedTruck.capacidadCarga} kg`} />
            <InfoRow icon="alt-route" label="Viajes Realizados:" value={assignedTruck.totalViajes} />
            <InfoRow icon="history" label="Último Viaje:" value={assignedTruck.ultimaFechaViaje ?? 'N/A'} />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Ruta')}>
            <MaterialIcons name="map" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>VER RUTAS ASIGNADAS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={() => navigation.navigate('Incidentes')}>
            <MaterialIcons name="report-problem" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>REPORTAR INCIDENCIA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color="#546E7A" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    color: '#5D6D7E',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 25,
    textAlign: 'center',
  },
  truckCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    elevation: 5,
    shadowColor: '#B0BEC5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  truckIcon: {
    marginBottom: 15,
  },
  truckName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  truckId: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoSection: {
    width: '100%',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    paddingTop: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 15,
    color: '#546E7A',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#263238',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#0097A7',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#00796B',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
  },
  reportButton: {
    backgroundColor: '#E57373',
    marginTop: 10,
  },
});
