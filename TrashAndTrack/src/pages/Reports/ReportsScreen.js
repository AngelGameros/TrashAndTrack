"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import axios from "axios"
import { auth } from "../../config/Firebase/firebaseConfig"

export default function ReportsScreen({ route }) {
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL
  const [activeTab, setActiveTab] = useState("create")

  // Empresas y selección
  const [empresas, setEmpresas] = useState([])
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)

  // Contenedores de empresa seleccionada
  const [contenedores, setContenedores] = useState([])

  // Formulario
  const [reportData, setReportData] = useState({
    reportName: "",
    descripcion: "",
    containerId: "",
    collectedAmount: "",
    containerStatus: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdReports, setCreatedReports] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loadingContenedores, setLoadingContenedores] = useState(false)

  const idUsuario = route?.params?.idUsuario || 2
  const [idCamion, setIdCamion] = useState(null)

  useEffect(() => {
    const fetchCamionAsignado = async () => {
      try {
        const uid = auth.currentUser?.uid
        if (!uid) return

        const res = await axios.get(`http://${IP_URL}:5000/api/camionasignado/${uid}`)
        if (res.data?.camion?.idCamion) {
          setIdCamion(res.data.camion.idCamion)
        } else {
          Alert.alert("Aviso", "No tienes un camión asignado.")
        }
      } catch (error) {
        console.error("Error al obtener camión asignado:", error.message)
        Alert.alert("Error", "No se pudo obtener tu camión asignado.")
      }
    }
    fetchCamionAsignado()
  }, [])

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await axios.get(`http://${IP_URL}:5000/api/empresas`)
        setEmpresas(res.data.data || [])
        if (res.data.data.length > 0) {
          setEmpresaSeleccionada(res.data.data[0].id)
        }
      } catch (e) {
        Alert.alert("Error", "No se pudieron cargar las empresas")
      }
    }
    fetchEmpresas()
  }, [])

  useEffect(() => {
    if (!empresaSeleccionada) return

    setLoadingContenedores(true)
    const fetchContenedores = async () => {
      try {
        const res = await axios.get(`http://${IP_URL}:5000/api/contenedores/empresa/${empresaSeleccionada}`)
        setContenedores(res.data.contenedores || [])
        setReportData((prev) => ({ ...prev, containerId: "" }))
      } catch (e) {
        Alert.alert("Error", "No se pudieron cargar los contenedores")
      } finally {
        setLoadingContenedores(false)
      }
    }
    fetchContenedores()
  }, [empresaSeleccionada])

  useEffect(() => {
    if (activeTab === "view") {
      fetchReports()
    }
  }, [activeTab])

  const fetchReports = async () => {
    setRefreshing(true)
    try {
      const uid = auth.currentUser.uid
      const response = await axios.get(`http://${IP_URL}:5000/api/reportes/uid/${uid}`)
      if (response.data.status === 0) {
        setCreatedReports(response.data.data)
      } else {
        Alert.alert("Error", response.data.message || "No se pudieron obtener los reportes.")
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los reportes.")
    } finally {
      setRefreshing(false)
    }
  }

  const handleInputChange = (field, value) => {
    setReportData({ ...reportData, [field]: value })
  }

  const handleSubmitReport = async () => {
    const { reportName, containerId, collectedAmount, containerStatus, descripcion } = reportData

    if (!reportName || !containerId || !collectedAmount || !containerStatus) {
      Alert.alert("Campos incompletos", "Completa todos los campos obligatorios.")
      return
    }

    if (!idCamion) {
      Alert.alert("Sin camión asignado", "No se puede enviar el reporte sin un camión asignado.")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nombre", reportName)
      formData.append("descripcion", descripcion || "")
      formData.append("idContenedor", Number.parseInt(containerId))
      formData.append("cantidadRecolectada", Number.parseFloat(collectedAmount))
      formData.append("estadoContenedor", containerStatus)
      formData.append("idUsuario", idUsuario)
      formData.append("idCamion", idCamion)

      const response = await axios.post(`http://${IP_URL}:5000/api/reportes/registrar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.status === 0) {
        Alert.alert("Éxito", "Reporte registrado correctamente.")
        setReportData({
          reportName: "",
          descripcion: "",
          containerId: "",
          collectedAmount: "",
          containerStatus: "",
        })
        setActiveTab("view")
        fetchReports()
      } else {
        Alert.alert("Error", response.data.message || "Error al registrar el reporte.")
      }
    } catch (error) {
      console.error("Error completo:", error.response?.data || error.message)
      Alert.alert("Error", error.response?.data?.message || "Hubo un error al registrar el reporte.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIconContainer}>
          <MaterialIcons name="description" size={24} color="#4A90E2" />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.nombre}</Text>
          <Text style={styles.reportDate}>{item.fecha}</Text>
        </View>
      </View>
      <View style={styles.reportDetails}>
        <View style={styles.reportDetailRow}>
          <Text style={styles.reportDetailLabel}>ID Contenedor:</Text>
          <Text style={styles.reportDetailValue}>{item.containerId}</Text>
        </View>
        <View style={styles.reportDetailRow}>
          <Text style={styles.reportDetailLabel}>Cantidad Recolectada:</Text>
          <Text style={styles.reportDetailValue}>{item.collectedAmount}</Text>
        </View>
        <View style={styles.reportDetailRow}>
          <Text style={styles.reportDetailLabel}>Estado Contenedor:</Text>
          <Text style={styles.reportDetailValue}>{item.containerStatus}</Text>
        </View>
        {item.descripcion && (
          <View style={styles.reportDetailRow}>
            <Text style={styles.reportDetailLabel}>Descripción:</Text>
            <Text style={styles.reportDetailValue}>{item.descripcion}</Text>
          </View>
        )}
      </View>
    </View>
  )

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "create" && styles.activeTabButton]}
        onPress={() => setActiveTab("create")}
      >
        <MaterialIcons name="add-task" size={20} color={activeTab === "create" ? "#FFFFFF" : "#4A90E2"} />
        <Text style={[styles.tabButtonText, activeTab === "create" && styles.activeTabButtonText]}>Nuevo Reporte</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "view" && styles.activeTabButton]}
        onPress={() => setActiveTab("view")}
      >
        <MaterialIcons name="view-list" size={20} color={activeTab === "view" ? "#FFFFFF" : "#4A90E2"} />
        <Text style={[styles.tabButtonText, activeTab === "view" && styles.activeTabButtonText]}>Ver Reportes</Text>
      </TouchableOpacity>
    </View>
  )

  const renderCreateReport = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Empresa:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={empresaSeleccionada}
            onValueChange={(itemValue) => setEmpresaSeleccionada(itemValue)}
            mode="dropdown"
            style={styles.picker}
          >
            {empresas.map((empresa) => (
              <Picker.Item key={empresa.id.toString()} label={empresa.nombre} value={empresa.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Contenedor:</Text>
        {loadingContenedores ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingText}>Cargando contenedores...</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={reportData.containerId}
              onValueChange={(val) => handleInputChange("containerId", val)}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Selecciona un contenedor" value="" />
              {contenedores.map((c) => (
                <Picker.Item
                  key={c.id.toString()}
                  label={`${c.id} - ${c.descripcion} (${c.tipoContenedor || "Sin tipo"})`}
                  value={c.id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Nombre del Reporte:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Recolección Norte"
          placeholderTextColor="#9CA3AF"
          value={reportData.reportName}
          onChangeText={(text) => handleInputChange("reportName", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Cantidad Recolectada (kg/L):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ej: 500"
          placeholderTextColor="#9CA3AF"
          value={reportData.collectedAmount}
          onChangeText={(text) => handleInputChange("collectedAmount", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Estado del Contenedor:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Vacío"
          placeholderTextColor="#9CA3AF"
          value={reportData.containerStatus}
          onChangeText={(text) => handleInputChange("containerStatus", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.formLabel}>Descripción / Observaciones:</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Detalles adicionales..."
          placeholderTextColor="#9CA3AF"
          value={reportData.descripcion}
          onChangeText={(text) => handleInputChange("descripcion", text)}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmitReport}
        disabled={isSubmitting}
      >
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.submitButtonGradient}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>ENVIAR REPORTE</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
        <MaterialIcons name="assessment" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Reportes de Recolección</Text>
        <Text style={styles.headerSubtitle}>Crea y gestiona tus reportes de trabajo</Text>
      </LinearGradient>

      <FlatList
        data={activeTab === "view" ? createdReports : []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReportItem}
        ListHeaderComponent={
          <>
            {renderTabs()}

            {activeTab === "create" && renderCreateReport()}

            {activeTab === "view" && createdReports.length === 0 && !refreshing && (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment" size={80} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>Sin Reportes</Text>
                <Text style={styles.emptyStateText}>
                  No hay reportes creados aún. Crea tu primer reporte usando la pestaña "Nuevo Reporte".
                </Text>
              </View>
            )}
          </>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchReports} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 20,
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
  formLabel: {
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    height: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  reportItem: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  reportDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  reportDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reportDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  reportDetailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  },
})
