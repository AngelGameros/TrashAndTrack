"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { auth, db } from "../../config/Firebase/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { LinearGradient } from "expo-linear-gradient"

export default function HomeScreen({ navigation }) {
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  // Estado para el nombre a mostrar
  const [displayName, setDisplayName] = useState("")
  const [isLoadingName, setIsLoadingName] = useState(true)

  // Estado para el camión
  const [assignedTruck, setAssignedTruck] = useState(null)
  const [loadingTruck, setLoadingTruck] = useState(true)

  // Estado para refresco pull-to-refresh
  const [refreshing, setRefreshing] = useState(false)

  const fetchUserName = async () => {
    if (auth.currentUser) {
      setIsLoadingName(true)
      try {
        const docRef = doc(db, "usersApproval", auth.currentUser.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const userData = docSnap.data()
          const nombre = userData.nombre || ""
          const apellidoPaterno = userData.apellidoPaterno || ""
          const fullName = [nombre, apellidoPaterno].filter(Boolean).join(" ")
          setDisplayName(fullName || auth.currentUser.email)
        } else {
          setDisplayName(auth.currentUser.email)
        }
      } catch (error) {
        console.error("Error al obtener el nombre del usuario para HomeScreen:", error)
        setDisplayName(auth.currentUser.email)
      } finally {
        setIsLoadingName(false)
      }
    } else {
      setIsLoadingName(false)
    }
  }

  const fetchAssignedTruck = async () => {
    try {
      setLoadingTruck(true)
      const uid = auth.currentUser.uid
      const response = await fetch(`http://${IP_URL}:5000/api/camionasignado/${uid}`)
      const data = await response.json()
      setAssignedTruck(data.camion)
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setLoadingTruck(false)
    }
  }

  // Función para refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchUserName(), fetchAssignedTruck()])
    setRefreshing(false)
  }, [])

  // Carga inicial
  useEffect(() => {
    fetchUserName()
    fetchAssignedTruck()
  }, [])

  const getStatusDisplay = (status) => {
    switch (status) {
      case "activo":
        return { text: "ACTIVO", color: "#10B981", backgroundColor: "#D1FAE5", icon: "check-circle" }
      case "en_mantenimiento":
        return { text: "EN MANTENIMIENTO", color: "#F59E0B", backgroundColor: "#FEF3C7", icon: "build" }
      case "fuera_de_servicio":
        return { text: "FUERA DE SERVICIO", color: "#EF4444", backgroundColor: "#FEE2E2", icon: "error" }
      default:
        return { text: "DESCONOCIDO", color: "#6B7280", backgroundColor: "#F3F4F6", icon: "help" }
    }
  }

  if (loadingTruck || isLoadingName) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContent}>
          <MaterialIcons name="local-shipping" size={80} color="#4A90E2" />
          <Text style={styles.loadingTitle}>Cargando información...</Text>
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loadingSpinner} />
        </View>
      </View>
    )
  }

  if (!assignedTruck) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.noTruckContainer}>
          <MaterialIcons name="local-shipping" size={100} color="#E5E7EB" />
          <Text style={styles.noTruckTitle}>Sin Camión Asignado</Text>
          <Text style={styles.noTruckText}>
            Actualmente no tienes un camión asignado. Contacta con tu supervisor para más información.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusInfo = getStatusDisplay(assignedTruck.estado)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]} tintColor="#4A90E2" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta principal del camión */}
        <View style={styles.truckCard}>
          <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.truckCardGradient}>
            {/* Icono del camión */}
            <View style={styles.truckIconContainer}>
              <MaterialIcons name="local-shipping" size={80} color="#4A90E2" />
              <View style={styles.truckIconGlow} />
            </View>

            {/* Información básica */}
            <Text style={styles.truckName}>
              {assignedTruck.marca} {assignedTruck.modelo}
            </Text>
            <Text style={styles.truckId}>ID: {assignedTruck.idCamion}</Text>

            {/* Badge de estado */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
              <MaterialIcons name={statusInfo.icon} size={16} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Información detallada */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Información del Vehículo</Text>

          <InfoRow icon="branding-watermark" label="Marca:" value={assignedTruck.marca} />
          <InfoRow icon="directions-car" label="Modelo:" value={assignedTruck.modelo} />
          <InfoRow icon="confirmation-number" label="Placas:" value={assignedTruck.placa} />
          <InfoRow icon="scale" label="Capacidad de Carga:" value={`${assignedTruck.capacidadCarga} kg`} />
          <InfoRow icon="timeline" label="Viajes Realizados:" value={assignedTruck.totalViajes} />
          <InfoRow icon="schedule" label="Último Viaje:" value={assignedTruck.ultimaFechaViaje ?? "N/A"} />
        </View>

        {/* Botones de acción principales */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={() => navigation.navigate("RouteTab")}>
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionButtonGradient}>
              <MaterialIcons name="map" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>VER RUTAS ASIGNADAS</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => navigation.navigate("Incidents")}>
            <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.actionButtonGradient}>
              <MaterialIcons name="report-problem" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>REPORTAR INCIDENCIA</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumen de Actividad</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="local-shipping" size={32} color="#4A90E2" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Rutas Completadas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="assignment" size={32} color="#10B981" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Reportes Enviados</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="warning" size={32} color="#F59E0B" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Incidentes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    color: "#4A90E2",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 20,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  truckCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  truckCardGradient: {
    padding: 30,
    alignItems: "center",
  },
  truckIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  truckIconGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    borderRadius: 50,
    zIndex: -1,
  },
  truckName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  truckId: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 160,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  primaryActionButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryActionButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  noTruckContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noTruckTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 12,
  },
  noTruckText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
