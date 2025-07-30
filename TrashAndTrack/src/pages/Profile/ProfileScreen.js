"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native"
import { auth, db } from "../../config/Firebase/firebaseConfig"
import { doc, updateDoc } from "firebase/firestore"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export default function ProfileScreen() {
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("No hay usuario autenticado")

      const response = await fetch(`http://${IP_URL}:5000/api/usuarios/firebase/${currentUser.uid}`)
      if (!response.ok) throw new Error("Error al obtener datos del usuario")

      const result = await response.json()
      if (!result?.usuario) throw new Error("La respuesta no contiene datos de usuario")

      setUserData(result.usuario)
      setPhoneNumber(result.usuario.numeroTelefono || "")
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      Alert.alert("Error", "No se pudo cargar la información del perfil")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchUserData()
  }, [])

  const handleUpdatePhone = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "El número de teléfono no puede estar vacío")
      return
    }

    if (phoneNumber === userData.numeroTelefono) {
      Alert.alert("Info", "No hay cambios que guardar")
      setIsEditing(false)
      return
    }

    setIsUpdating(true)

    try {
      const currentUser = auth.currentUser
      if (!currentUser?.uid) throw new Error("No hay usuario autenticado")

      const sqlResponse = await fetch(`http://${IP_URL}:5000/api/usuarios/phone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          numero_telefono: phoneNumber,
        }),
      })

      if (!sqlResponse.ok) throw new Error("Error al actualizar el número en SQL Server")

      const userDocRef = doc(db, "usersApproval", currentUser.uid)
      await updateDoc(userDocRef, { numeroTelefono: phoneNumber })

      setUserData((prev) => ({ ...prev, numeroTelefono: phoneNumber }))
      Alert.alert("Éxito", "Número de teléfono actualizado correctamente")
      setIsEditing(false)
    } catch (error) {
      console.error("Error al actualizar el teléfono:", error)

      let errorMessage = "No se pudo actualizar el número de teléfono"
      if (error.code === "not-found") {
        errorMessage = "Documento de usuario no encontrado"
      } else if (error.message.includes("permission-denied")) {
        errorMessage = "No tienes permiso para realizar esta acción"
      }

      Alert.alert("Error", errorMessage)
      setPhoneNumber(userData.numeroTelefono || "")
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <MaterialIcons name="error-outline" size={80} color="#EF4444" />
        <Text style={styles.errorTitle}>Error de Carga</Text>
        <Text style={styles.errorText}>No se pudo cargar la información del usuario</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header with Profile */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userData.nombre + " " + userData.primerApellido,
                )}&background=FFFFFF&color=4A90E2&size=120`,
              }}
              style={styles.avatar}
            />
            <View style={styles.statusIndicator} />
          </View>
          <Text style={styles.userName}>
            {userData.nombre} {userData.primerApellido} {userData.segundoApellido}
          </Text>
          <View style={styles.userTypeBadge}>
            <MaterialIcons name="badge" size={16} color="#FFFFFF" />
            <Text style={styles.userTypeText}>
              {userData.tipoUsuario === "recolector" ? "Recolector" : "Administrador"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Información Personal</Text>

          {/* Email */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="email" size={20} color="#4A90E2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Correo electrónico</Text>
              <Text style={styles.infoValue}>{userData.correo}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="phone" size={20} color="#4A90E2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              {isEditing ? (
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="Ingresa tu número"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.infoValue}>{phoneNumber || "No proporcionado"}</Text>
              )}
            </View>
            {!isEditing && (
              <TouchableOpacity style={styles.editIconButton} onPress={() => setIsEditing(true)}>
                <MaterialIcons name="edit" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* User ID */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons name="fingerprint" size={20} color="#4A90E2" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID de usuario</Text>
              <Text style={styles.smallInfoValue}>{userData.firebaseUid}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdatePhone}
              disabled={isUpdating}
            >
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionButtonGradient}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>GUARDAR CAMBIOS</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false)
                setPhoneNumber(userData.numeroTelefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterialIcons name="close" size={20} color="#6B7280" />
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="local-shipping" size={24} color="#4A90E2" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Rutas Completadas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="assignment" size={24} color="#10B981" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Reportes Enviados</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="warning" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Incidentes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: -20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
  },
  smallInfoValue: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  phoneInput: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
    paddingVertical: 4,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  saveButton: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
})
