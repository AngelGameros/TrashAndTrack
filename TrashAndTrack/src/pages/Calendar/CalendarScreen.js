"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
} from "react-native"
import { Calendar, LocaleConfig } from "react-native-calendars"
import { useNavigation } from "@react-navigation/native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import axios from "axios"

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  dayNamesShort: ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"],
  today: "Hoy",
}
LocaleConfig.defaultLocale = "es"

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [collectionData, setCollectionData] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const userId = 2

  const fetchItinerarios = async () => {
    try {
      const res = await axios.get(`http://${IP_URL}:5000/api/itinerarios/usuario/${userId}`)
      const data = res.data.data

      const grouped = {}

      data.forEach((it) => {
        if (it.estado.toLowerCase() === "cancelado") return

        const fecha = it.fechaProgramada
        if (!grouped[fecha]) grouped[fecha] = []

        grouped[fecha].push({
          id: it.id,
          title: it.nombreRuta,
          time: "Sin hora",
          location: it.descripcionRuta,
          status: it.estado.toLowerCase(),
          details: {
            peso: calcularPeso(it.empresas),
            tipoResiduo: extraerTiposResiduo(it.empresas),
            notas: `Incluye ${contarEmpresas(it.empresas)} empresa(s)`,
          },
        })
      })

      setCollectionData(grouped)
    } catch (error) {
      console.error("Error al obtener itinerarios:", error)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchItinerarios().finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    fetchItinerarios()
  }, [])

  const calcularPeso = (empresasJSON) => {
    try {
      const empresas = JSON.parse(empresasJSON)
      const total = empresas.reduce((sum, e) => sum + (e.peso_estimado || 0), 0)
      return `${total} kg estimados`
    } catch {
      return "Peso no disponible"
    }
  }

  const extraerTiposResiduo = (empresasJSON) => {
    try {
      const empresas = JSON.parse(empresasJSON)
      const tipos = new Set()
      empresas.forEach((emp) => emp.tipos_residuos.forEach((r) => tipos.add(r.nombre_tipo_residuo)))
      return Array.from(tipos).join(", ")
    } catch {
      return "Tipo no disponible"
    }
  }

  const contarEmpresas = (empresasJSON) => {
    try {
      return JSON.parse(empresasJSON).length
    } catch {
      return 0
    }
  }

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString)
  }

  const handleCollectionPress = (collection) => {
    setSelectedCollection(collection)
    setModalVisible(true)
  }

  const iniciarRuta = async (idItinerario) => {
    try {
      await axios.put(`http://${IP_URL}:5000/api/itinerarios/${idItinerario}/estado`, '"INICIADO"', {
        headers: { "Content-Type": "application/json" },
      })

      Alert.alert("Ruta iniciada", "Redirigiendo a tu ruta asignada...")
      setModalVisible(false)
      fetchItinerarios()

      navigation.navigate("Ruta")
    } catch (err) {
      console.error("Error al iniciar ruta:", err)
      Alert.alert("Error", "No se pudo actualizar el estado.")
    }
  }

  const markedDates = {}
  Object.keys(collectionData).forEach((date) => {
    const statuses = collectionData[date].map((c) => c.status)
    let dotColor = "#4A90E2"
    if (statuses.every((s) => s === "completado")) dotColor = "#10B981"

    markedDates[date] = { marked: true, dotColor, selected: date === selectedDate }
  })

  if (markedDates[selectedDate]) {
    markedDates[selectedDate].selectedColor = "#4A90E2"
  } else {
    markedDates[selectedDate] = { selected: true, selectedColor: "#4A90E2" }
  }

  const renderCollections = () => {
    const collections = collectionData[selectedDate]

    if (!collections || collections.length === 0) {
      return (
        <View style={styles.noCollections}>
          <View style={styles.noCollectionsIcon}>
            <MaterialIcons name="event-available" size={48} color="#4A90E2" />
          </View>
          <Text style={styles.noCollectionsTitle}>¡Día libre!</Text>
          <Text style={styles.noCollectionsText}>No hay recolecciones programadas para hoy.</Text>
        </View>
      )
    }

    return (
      <>
        {collections.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            style={[
              styles.collectionCard,
              collection.status === "completado" ? styles.completedCard : styles.assignedCard,
            ]}
            onPress={() => handleCollectionPress(collection)}
          >
            <View style={styles.collectionHeader}>
              <View style={styles.collectionTimeContainer}>
                <MaterialIcons name="schedule" size={16} color="#6B7280" />
                <Text style={styles.collectionTime}>{collection.time}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  collection.status === "completado" ? styles.completedBadge : styles.assignedBadge,
                ]}
              >
                <MaterialIcons
                  name={collection.status === "completado" ? "check-circle" : "schedule"}
                  size={12}
                  color={collection.status === "completado" ? "#10B981" : "#4A90E2"}
                />
                <Text
                  style={[
                    styles.statusText,
                    collection.status === "completado" ? { color: "#10B981" } : { color: "#4A90E2" },
                  ]}
                >
                  {collection.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={16} color="#6B7280" />
              <Text style={styles.collectionLocation}>{collection.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
        <Text style={styles.headerTitle}>Mi Calendario</Text>
        <Text style={styles.headerSubtitle}>Gestiona tus recolecciones programadas</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: "#FFFFFF",
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: "#6B7280",
              selectedDayBackgroundColor: "#4A90E2",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#4A90E2",
              dayTextColor: "#1F2937",
              textDisabledColor: "#D1D5DB",
              arrowColor: "#4A90E2",
              monthTextColor: "#1F2937",
              textMonthFontWeight: "bold",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textMonthFontSize: 18,
              textDayFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4A90E2" }]} />
            <Text style={styles.legendText}>Programado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.legendText}>Completado</Text>
          </View>
        </View>

        {/* Selected Date Section */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.sectionTitle}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>

          {renderCollections()}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <MaterialIcons name="event" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.modalTitle}>{selectedCollection?.title}</Text>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={20} color="#4A90E2" />
                  <Text style={styles.detailText}>{selectedCollection?.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color="#4A90E2" />
                  <Text style={styles.detailText}>{selectedCollection?.location}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Detalles de la Carga</Text>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Peso:</Text>
                  <Text style={styles.detailValue}>{selectedCollection?.details.peso}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tipo de residuo:</Text>
                  <Text style={styles.detailValue}>{selectedCollection?.details.tipoResiduo}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Notas:</Text>
                  <Text style={styles.detailValue}>{selectedCollection?.details.notas}</Text>
                </View>
              </View>

              {selectedCollection?.status === "pendiente" && (
                <TouchableOpacity style={styles.startButton} onPress={() => iniciarRuta(selectedCollection.id)}>
                  <LinearGradient colors={["#10B981", "#059669"]} style={styles.startButtonGradient}>
                    <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>INICIAR RUTA</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
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
    marginBottom: 8,
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
  calendarContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  calendar: {
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedDateContainer: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  noCollections: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noCollectionsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noCollectionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  noCollectionsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  collectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  completedCard: {
    borderLeftColor: "#10B981",
    borderLeftWidth: 4,
  },
  assignedCard: {
    borderLeftColor: "#4A90E2",
    borderLeftWidth: 4,
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  collectionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  collectionTime: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
  },
  assignedBadge: {
    backgroundColor: "#DBEAFE",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  collectionLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
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
    maxHeight: "85%",
  },
  closeButton: {
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  startButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default CalendarScreen
