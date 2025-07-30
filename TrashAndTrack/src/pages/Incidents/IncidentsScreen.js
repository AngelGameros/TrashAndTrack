"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  StatusBar,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from "expo-image-picker"
import { auth } from "../../config/Firebase/firebaseConfig"

const formatDateTime = (dateObj) => {
  if (!dateObj) return ""
  return new Date(dateObj).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Tijuana",
  })
}

const IncidentsScreen = () => {
  const [incidentName, setIncidentName] = useState("")
  const [incidentDescription, setIncidentDescription] = useState("")
  const [incidentImage, setIncidentImage] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const uid = auth.currentUser?.uid

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`http://${IP_URL}:5000/api/incidentesporusuario/${uid}`)
      const data = await res.json()

      if (data.status === 0 && Array.isArray(data.data)) {
        const formatted = data.data.map((incidente) => ({
          id: incidente.id,
          userId: incidente.idUsuario,
          name: incidente.nombre,
          description: incidente.descripcion,
          date: parseDateString(incidente.fechaIncidente),
          imageUri: incidente.photoUrl,
        }))

        setIncidents(formatted)
      } else {
        setIncidents([])
        Alert.alert("Sin datos", data.message || "No hay incidentes.")
      }
    } catch (error) {
      setIncidents([])
      Alert.alert("Error", "No se pudo conectar al servidor de incidentes.")
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchIncidents()
    setRefreshing(false)
  }

  const parseDateString = (dateString) => {
    if (!dateString) return new Date()
    return new Date(dateString)
  }

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permiso Requerido", "Necesitas acceso a la cámara.")
      return false
    }
    return true
  }

  const takePhoto = async () => {
    if (!(await requestCameraPermission())) return
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })
    if (!result.canceled && result.assets.length > 0) setIncidentImage(result.assets[0])
  }

  const uploadToCloudinary = async () => {
    const form = new FormData()
    const ts = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)
    const fileName = `${ts}_${auth.currentUser.uid}.jpg`
    form.append("file", {
      uri: incidentImage.uri,
      name: fileName,
      type: "image/jpeg",
    })
    form.append("upload_preset", "incidentes_app")
    form.append("cloud_name", "dlkonkhzu")

    const res = await fetch("https://api.cloudinary.com/v1_1/dlkonkhzu/image/upload", {
      method: "POST",
      body: form,
    })
    const json = await res.json()
    return json.secure_url
  }

  const handleSaveIncident = async () => {
    if (!incidentName || !incidentDescription || !incidentImage) {
      Alert.alert("Faltan datos", "Completa todos los campos y toma una foto.")
      return
    }

    try {
      const imageUrl = await uploadToCloudinary()
      const nowUtc = new Date().toISOString()

      const form = new FormData()
      form.append("nombre", incidentName)
      form.append("descripcion", incidentDescription)
      form.append("fechaIncidente", nowUtc)
      form.append("firebaseUid", uid)
      form.append("foto", imageUrl)

      const res = await fetch(`http://${IP_URL}:5000/api/incidentesporusuario`, {
        method: "POST",
        body: form,
      })

      const data = await res.json()

      if (data.status === 0) {
        Alert.alert("Éxito", "Incidente registrado correctamente.")
        setIncidentName("")
        setIncidentDescription("")
        setIncidentImage(null)
        setShowForm(false)
        fetchIncidents()
      } else {
        Alert.alert("Error", data.message || "No se pudo registrar.")
      }
    } catch (err) {
      Alert.alert("Error", "Error al guardar incidente: " + err.message)
    }
  }

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident)
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
        <MaterialIcons name="report-problem" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Gestión de Incidentes</Text>
        <Text style={styles.headerSubtitle}>Reporta y gestiona incidentes de recolección</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Buttons */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, !showForm && styles.activeTabButton]}
            onPress={() => setShowForm(false)}
          >
            <MaterialIcons name="list" size={20} color={!showForm ? "#FFFFFF" : "#4A90E2"} />
            <Text style={[styles.tabButtonText, !showForm && styles.activeTabButtonText]}>Ver Incidentes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, showForm && styles.activeTabButton]}
            onPress={() => setShowForm(true)}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={showForm ? "#FFFFFF" : "#4A90E2"} />
            <Text style={[styles.tabButtonText, showForm && styles.activeTabButtonText]}>Nuevo Incidente</Text>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <View style={styles.formContainer}>
            {/* Form Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre del Incidente</Text>
              <TextInput
                placeholder="Ej: Derrame de aceite"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={incidentName}
                onChangeText={setIncidentName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción Detallada</Text>
              <TextInput
                placeholder="Describe el incidente con el mayor detalle posible..."
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={incidentDescription}
                onChangeText={setIncidentDescription}
              />
            </View>

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.inputLabel}>Evidencia Fotográfica</Text>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Tomar Foto</Text>
              </TouchableOpacity>

              {incidentImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: incidentImage.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setIncidentImage(null)}>
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSaveIncident}>
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.submitButtonGradient}>
                <MaterialIcons name="save" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Guardar Incidente</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {incidents.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment-late" size={80} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>Sin Incidentes Reportados</Text>
                <Text style={styles.emptyStateText}>
                  Aún no has reportado ningún incidente. Usa el botón "Nuevo Incidente" para comenzar.
                </Text>
              </View>
            ) : (
              incidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id.toString()}
                  style={styles.incidentCard}
                  onPress={() => handleViewIncident(incident)}
                >
                  <View style={styles.incidentCardHeader}>
                    <View style={styles.incidentIconContainer}>
                      <MaterialIcons name="warning" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.incidentCardInfo}>
                      <Text style={styles.incidentCardTitle}>{incident.name}</Text>
                      <Text style={styles.incidentCardDate}>{formatDateTime(incident.date)}</Text>
                    </View>
                    {incident.imageUri && (
                      <View style={styles.imageIndicator}>
                        <MaterialIcons name="image" size={20} color="#4A90E2" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.incidentCardDescription} numberOfLines={2}>
                    {incident.description}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>

            {selectedIncident && (
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <MaterialIcons name="report-problem" size={32} color="#F59E0B" />
                  </View>
                  <Text style={styles.modalTitle}>{selectedIncident.name}</Text>
                  <Text style={styles.modalDate}>{formatDateTime(selectedIncident.date)}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Descripción del Incidente</Text>
                  <Text style={styles.modalDescription}>{selectedIncident.description}</Text>
                </View>

                {selectedIncident.imageUri && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Evidencia Fotográfica</Text>
                    <Image source={{ uri: selectedIncident.imageUri }} style={styles.modalImage} />
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#4A90E2",
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  activeTabButtonText: {
    color: "#FFFFFF",
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  photoSection: {
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  incidentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  incidentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  incidentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  incidentCardInfo: {
    flex: 1,
  },
  incidentCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  incidentCardDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  imageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  incidentCardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalCloseButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
})

export default IncidentsScreen
