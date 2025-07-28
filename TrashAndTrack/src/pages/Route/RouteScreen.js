"use client"
import { useState, useEffect, useCallback, useRef } from "react" // Importa useRef
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Linking,
  RefreshControl,
} from "react-native"
import { WebView } from "react-native-webview"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import axios from "axios"
import { auth } from "../../config/Firebase/firebaseConfig"

const { width, height } = Dimensions.get("window")
const OPENROUTE_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY

const RouteScreen = () => {
  const [routesData, setRoutesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [currentProgress, setCurrentProgress] = useState(0)
  const [mapHtml, setMapHtml] = useState("")
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const webViewRef = useRef(null) // Ref para el WebView
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const fetchUserId = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error("No hay usuario autenticado")
        throw new Error("No hay usuario autenticado")
      }
      console.log("Firebase UID:", currentUser.uid)
      const response = await fetch(
        `http://${IP_URL}:5000/api/usuarios/firebase/${currentUser.uid}`
      )
      if (!response.ok) {
        console.error("Error en respuesta:", response.status)
        throw new Error("Error al obtener datos del usuario")
      }
      const result = await response.json()
      console.log("Respuesta completa:", result)
      if (!result?.usuario) {
        console.error("Respuesta no contiene usuario:", result)
        throw new Error("La respuesta no contiene datos de usuario")
      }
      const userId = result.usuario.idUsuario
      console.log("ID de usuario obtenido:", userId)
      return userId
    } catch (error) {
      console.error("Error completo en fetchUserId:", error)
      throw error
    }
  }

  const fetchRoutesData = useCallback(async () => {
    try {
      setLoading(true)
      setRefreshing(true) // Inicia el indicador de refresco
      const userId = await fetchUserId()
      const response = await axios.get(
        `http://${IP_URL}:5000/api/rutas/detalladas/${userId}`
      )
      if (response.data.status === 0) {
        const activeRoutes = response.data.data.filter(
          (route) =>
            route.estado_ruta === "INICIADA" ||
            route.estado_ruta === "EN_PROCESO"
        )
        setRoutesData(activeRoutes)
        if (activeRoutes.length > 0) {
          setSelectedRoute(activeRoutes[0])
          processRouteData(activeRoutes[0])
        } else {
          setSelectedRoute(null)
          setRouteCoordinates([])
          setCurrentProgress(0)
          setMapHtml("")
        }
      } else {
        // Si el estado no es 0, pero no hubo un error de red,
        // asumimos que no hay rutas activas y limpiamos los datos.
        setRoutesData([])
        setSelectedRoute(null)
        setRouteCoordinates([])
        setCurrentProgress(0)
        setMapHtml("")
      }
    } catch (error) {
      // Suprimimos el console.error para escenarios esperados de "no rutas".
      // Esto asegura que la UI muestre "No tienes rutas..." sin un error visible.
      console.log("Info: No se encontraron rutas activas o ocurrió un problema durante la carga.", error);
      setRoutesData([]) // Asegura que routesData esté vacío para activar el mensaje
      setSelectedRoute(null)
      setRouteCoordinates([])
      setCurrentProgress(0)
      setMapHtml("")
    } finally {
      setLoading(false)
      setRefreshing(false) // Detiene el indicador de refresco
    }
  }, [])

  const processRouteData = (route) => {
    const coordinates = []
    const inicioCoords = JSON.parse(route.coordenadas_inicio_json)
    if (inicioCoords.length > 0) {
      coordinates.push({
        latitude: inicioCoords[0].punto.latitud,
        longitude: inicioCoords[0].punto.longitud,
        name: route.nombre_planta,
        type: "planta",
        orden: -1,
      })
    }
    const rutaCoords = JSON.parse(route.coordenadas_ruta_json)
    const empresas = JSON.parse(route.empresas_json)
    rutaCoords
      .sort((a, b) => a.punto.orden - b.punto.orden)
      .forEach((punto, index) => {
        const empresa = empresas.find((e) => e.empresa.orden === punto.punto.orden)
        coordinates.push({
          latitude: punto.punto.latitud,
          longitude: punto.punto.longitud,
          name: punto.punto.nombre,
          type: "empresa",
          orden: punto.punto.orden,
          empresa: empresa?.empresa,
        })
      })
    setRouteCoordinates(coordinates)
    setCurrentProgress(route.progreso_ruta)
    generateMapHtml(coordinates, route)
  }

  const generateMapHtml = (coordinates, routeData) => {
    const markers = coordinates
      .map((coord, index) => {
        const color =
          coord.type === "planta"
            ? "#4CAF50"
            : coord.orden < routeData.progreso_ruta
            ? "#2196F3"
            : coord.orden === routeData.progreso_ruta
            ? "#0097A7"
            : "#FF9800"
        const icon = coord.type === "planta" ? "🏭" : `${coord.orden + 1}`
        return `
          L.marker([${coord.latitude}, ${coord.longitude}])
            .addTo(map)
            .bindPopup(\`
              <div style="text-align: center;">
                <h3>${coord.name}</h3>
                <p>${
                  coord.type === "planta"
                    ? "Punto de inicio"
                    : `Parada #${coord.orden + 1}`
                }</p>
                <button onclick="window.ReactNativeWebView.postMessage('marker_${index}')"
                    style="background: #0097A7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                  Ver detalles
                </button>
              </div>
            \`)
            .setIcon(L.divIcon({
              html: '<div style="background: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${icon}</div>',
              className: 'custom-marker',
              iconSize: [30, 30]
            }));
        `
      })
      .join("")

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ruta de Recolección</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .custom-marker { border: none !important; background: transparent !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${coordinates[0]?.latitude || 32.534001}, ${
      coordinates[0]?.longitude || -117.038011
    }], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        ${markers}
        // Function to recenter map to fit all markers
        function recenterMap() {
          if (${coordinates.length} > 0) {
            const markerGroup = new L.featureGroup([
              ${coordinates.map((c) => `L.marker([${c.latitude}, ${c.longitude}])`).join(",")}
            ]);
            map.fitBounds(markerGroup.getBounds(), { padding: [20, 20] });
          }
        }
        // Initial fit bounds
        recenterMap();
        // Listen for messages from React Native
        document.addEventListener('message', function(e) {
          const message = e.data;
          if (message === 'recenterMap') {
            recenterMap();
          } else {
            // Pass through other messages to React Native
            window.ReactNativeWebView.postMessage(message);
          }
        });
      </script>
    </body>
    </html>
    `
    setMapHtml(html)
  }

  useEffect(() => {
    fetchRoutesData()
  }, [fetchRoutesData])

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data
    if (message.startsWith("marker_")) {
      const index = Number.parseInt(message.split("_")[1])
      const point = routeCoordinates[index]
      if (point) {
        setSelectedPoint(point)
        setModalVisible(true)
      }
    }
  }

  const handleRecenterMap = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage('recenterMap');
    }
  };

  const openExternalNavigation = (destination, waypoints = []) => {
    if (!destination) return

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`
    if (waypoints.length > 0) {
      const waypointsStr = waypoints.map((wp) => `${wp.latitude},${wp.longitude}`).join("|")
      url += `&waypoints=${waypointsStr}`
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url)
        } else {
          Alert.alert("Error", "No se puede abrir Google Maps")
        }
      })
      .catch((err) => console.error("Error opening navigation app:", err))
  }

  const handleRegisterProgress = async () => {
    if (!selectedRoute || !selectedPoint || selectedPoint.type !== "empresa") {
      return
    }

    const empresasInRoute = JSON.parse(selectedRoute.empresas_json || "[]")
    const totalEmpresas = empresasInRoute.length
    const newProgress = selectedPoint.orden + 1

    let newEstado = selectedRoute.estado_ruta
    if (newProgress === 1 && selectedRoute.estado_ruta === "INICIADA") {
      newEstado = "EN_PROCESO"
    } else if (newProgress === totalEmpresas) {
      newEstado = "FINALIZADA"
    }

    try {
      setLoading(true)
      const response = await axios.put(
        `http://${IP_URL}:5000/api/rutas/update-progress`,
        {
          idRuta: selectedRoute.id_ruta,
          progresoRuta: newProgress,
          estado: newEstado,
        }
      )

      if (response.data.status === 0) {
        Alert.alert("Éxito", response.data.message || "Progreso registrado correctamente.")
        const updatedSelectedRoute = {
          ...selectedRoute,
          progreso_ruta: newProgress,
          estado_ruta: newEstado,
        }
        setSelectedRoute(updatedSelectedRoute)
        setRoutesData((prevRoutes) => {
          if (newEstado === "FINALIZADA") {
            return prevRoutes.filter((r) => r.id_ruta !== updatedSelectedRoute.id_ruta)
          } else {
            return prevRoutes.map((r) =>
              r.id_ruta === updatedSelectedRoute.id_ruta ? updatedSelectedRoute : r
            )
          }
        })
        processRouteData(updatedSelectedRoute)
        setModalVisible(false)
      } else {
        Alert.alert("Error", response.data.message || "No se pudo registrar el progreso.")
      }
    } catch (error) {
      console.error("Error registering progress:", error)
      Alert.alert("Error", "Ocurrió un error al registrar el progreso. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const renderRouteInfo = () => {
    if (!selectedRoute) return null

    const empresas = JSON.parse(selectedRoute.empresas_json || "[]")
    const totalEmpresas = empresas.length
    const completedEmpresas = selectedRoute.progreso_ruta
    const progressPercentage =
      totalEmpresas === 0 ? 0 : Math.round((completedEmpresas / totalEmpresas) * 100)

    return (
      <View style={styles.routeInfoContainer}>
        {routesData.length > 1 && (
          <View style={styles.routeSelector}>
            <Text style={styles.routeSelectorTitle}>Rutas activas:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {routesData.map((route, index) => (
                <TouchableOpacity
                  key={route.id_ruta}
                  style={[
                    styles.routeOption,
                    selectedRoute.id_ruta === route.id_ruta && styles.selectedRouteOption,
                  ]}
                  onPress={() => {
                    setSelectedRoute(route)
                    processRouteData(route)
                  }}
                >
                  <Text
                    style={[
                      styles.routeOptionText,
                      selectedRoute.id_ruta === route.id_ruta && styles.selectedRouteOptionText,
                    ]}
                  >
                    {route.nombre_ruta}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.routeHeader}>
          <View style={styles.routeTitle}>
            <Text style={styles.routeName}>{selectedRoute.nombre_ruta}</Text>
            <Text style={styles.routeDescription}>{selectedRoute.descripcion_ruta}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    selectedRoute.estado_ruta === "PENDIENTE"
                      ? "#FF9800"
                      : selectedRoute.estado_ruta === "INICIADA"
                      ? "#0097A7"
                      : selectedRoute.estado_ruta === "EN_PROCESO"
                      ? "#2196F3"
                      : "#4CAF50",
                },
              ]}
            >
              <Text style={styles.statusText}>{selectedRoute.estado_ruta}</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progreso: {completedEmpresas}/{totalEmpresas} empresas
            </Text>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="location-on" size={16} color="#0097A7" />
            <Text style={styles.statText}>{totalEmpresas} paradas</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="map" size={16} color="#0097A7" />
            <Text style={styles.statText}>OpenStreetMap</Text>
          </View>
        </View>
      </View>
    )
  }

  const getContainerColor = (tipoResiduo) => {
    switch (tipoResiduo?.toLowerCase()) {
      case "orgánico":
        return "#4CAF50"
      case "plástico":
        return "#2196F3"
      case "químico":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  const renderModal = () => {
    if (!selectedPoint) return null

    const isEmpresa = selectedPoint.type === "empresa"
    const isNextPointToRegister = isEmpresa && selectedPoint.orden === currentProgress
    const isPointAlreadyRegistered = isEmpresa && selectedPoint.orden < currentProgress
    const isRouteCompleted = selectedRoute?.estado_ruta === "FINALIZADA"

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#9E9E9E" />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalHeader}>
                <FontAwesome5
                  name={isEmpresa ? "building" : "industry"}
                  size={30}
                  color={isEmpresa ? "#2196F3" : "#4CAF50"}
                />
                <Text style={styles.modalTitle}>{selectedPoint.name}</Text>
                {isEmpresa && <Text style={styles.modalSubtitle}>Parada #{selectedPoint.orden + 1}</Text>}
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color="#0097A7" />
                  <Text style={styles.detailText}>
                    {isEmpresa ? selectedPoint.empresa?.direccion : selectedRoute.direccion_planta}
                  </Text>
                </View>
                {isEmpresa && selectedPoint.empresa?.rfc && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="business" size={20} color="#0097A7" />
                    <Text style={styles.detailText}>RFC: {selectedPoint.empresa.rfc}</Text>
                  </View>
                )}
              </View>

              {isEmpresa && selectedPoint.empresa?.contenedores && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeader}>
                    Contenedores ({selectedPoint.empresa.contenedores.length})
                  </Text>
                  {selectedPoint.empresa.contenedores.map((cont, index) => (
                    <View key={index} style={styles.containerCard}>
                      <View style={styles.containerHeader}>
                        <FontAwesome5
                          name="trash"
                          size={16}
                          color={getContainerColor(cont.contenedor.tipo_residuo)}
                        />
                        <Text style={styles.containerType}>{cont.contenedor.tipo_contenedor}</Text>
                      </View>
                      <Text style={styles.containerDescription}>{cont.contenedor.descripcion}</Text>
                      <View style={styles.containerDetails}>
                        <Text style={styles.containerDetail}>Tipo: {cont.contenedor.tipo_residuo}</Text>
                        <Text style={styles.containerDetail}>
                          Capacidad: {cont.contenedor.capacidad_maxima} L
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.navigateToPointButton}
                onPress={() => {
                  const destination = {
                    latitude: selectedPoint.latitude,
                    longitude: selectedPoint.longitude,
                  }
                  setModalVisible(false)
                  setTimeout(() => {
                    openExternalNavigation(destination)
                  }, 500)
                }}
              >
                <MaterialIcons name="navigation" size={20} color="white" />
                <Text style={styles.navigateToPointButtonText}>Navegar aquí</Text>
              </TouchableOpacity>

              {isEmpresa && (
                <TouchableOpacity
                  style={[
                    styles.registerProgressButton,
                    isNextPointToRegister && !isRouteCompleted
                      ? styles.registerProgressButtonActive
                      : styles.registerProgressButtonDisabled,
                  ]}
                  onPress={handleRegisterProgress}
                  disabled={!isNextPointToRegister || isRouteCompleted}
                >
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.registerProgressButtonText}>
                    {isRouteCompleted
                      ? "Ruta Completada"
                      : isPointAlreadyRegistered
                      ? "Progreso Registrado"
                      : "Registrar Progreso"}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text style={styles.loadingText}>Cargando rutas...</Text>
        <Text style={styles.loadingSubtext}>Preparando mapa con OpenStreetMap</Text>
      </View>
    )
  }

  if (routesData.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#F44336" />
        <Text style={styles.errorText}>No tienes rutas INICIADAS o EN PROCESO actualmente</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRoutesData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0097A7" />
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchRoutesData} tintColor="#0097A7" />
        }
      >
        {/* Contenedor de la información de la ruta */}
        {renderRouteInfo()}

        {/* Contenedor del mapa que ocupa el espacio restante */}
        <View style={styles.mapContainer}>
          {mapHtml ? (
            <WebView
              ref={webViewRef} // Asigna la ref al WebView
              source={{ html: mapHtml }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#0097A7" />
                  <Text style={styles.webviewLoadingText}>Cargando mapa...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#0097A7" />
              <Text style={styles.webviewLoadingText}>Generando mapa...</Text>
            </View>
          )}
          {/* Botón de reubicación del mapa */}
          <TouchableOpacity style={styles.recenterButton} onPress={handleRecenterMap}>
            <MaterialIcons name="my-location" size={24} color="#0097A7" />
          </TouchableOpacity>
        </View>

        {/* Contenedor de los botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, styles.singleActionButton]} // Estilo para botón único
            onPress={() => {
              const nextDestination = routeCoordinates[currentProgress + 1] || routeCoordinates[1]
              if (nextDestination) {
                const waypoints = routeCoordinates
                  .filter((coord) => coord.type === "empresa" && coord.orden > currentProgress)
                  .map((coord) => ({
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                  }))
                openExternalNavigation(nextDestination, waypoints)
              }
            }}
          >
            <MaterialIcons name="navigation" size={24} color="white" />
            <Text style={styles.actionButtonText}>Navegación Optimizada</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa toda la pantalla
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#0097A7",
    fontWeight: "500",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#7F8C8D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#F44336",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  routeSelector: {
    marginBottom: 16,
  },
  routeSelectorTitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  routeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ECF0F1",
    marginRight: 8,
  },
  selectedRouteOption: {
    backgroundColor: "#0097A7",
  },
  routeOptionText: {
    color: "#34495E",
    fontWeight: "500",
  },
  selectedRouteOptionText: {
    color: "white",
  },
  routeInfoContainer: {
    backgroundColor: "white",
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  routeTitle: {
    flex: 1,
  },
  routeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#34495E",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 16,
    color: "#0097A7",
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#ECF0F1",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0097A7",
    borderRadius: 3,
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ECF0F1",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#34495E",
    fontWeight: "500",
  },
  mainScrollView: {
    flex: 1, // Permite que el ScrollView ocupe todo el espacio disponible
  },
  scrollViewContent: {
    flexGrow: 1, // Crucial: permite que los hijos del ScrollView con flex: 1 se expandan
  },
  mapContainer: {
    flex: 1, // Este contenedor ahora ocupa todo el espacio restante dentro del ScrollView
    position: 'relative', // Necesario para posicionar el botón flotante
  },
  webview: {
    flex: 1, // El WebView ocupa todo el espacio de su padre (mapContainer)
    width: "100%",
  },
  webviewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#0097A7",
    fontWeight: "500",
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10, // Asegura que esté por encima del mapa
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flex: 1, // Ocupa todo el ancho disponible
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7F8C8D",
    paddingVertical: 16, // Aumenta el padding vertical para hacerlo más grande
    borderRadius: 8,
    marginHorizontal: 0, // Elimina el margen horizontal
  },
  primaryButton: {
    backgroundColor: "#0097A7",
  },
  singleActionButton: {
    // Estilos específicos si solo hay un botón, ya cubiertos por actionButton flex:1
  },
  actionButtonText: {
    color: "white",
    fontSize: 16, // Aumenta el tamaño de la fuente
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#34495E",
    marginLeft: 12,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF0F1",
    paddingBottom: 8,
  },
  containerCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0097A7",
  },
  containerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  containerType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 8,
  },
  containerDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  containerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerDetail: {
    fontSize: 12,
    color: "#95A5A6",
    fontWeight: "500",
  },
  navigateToPointButton: {
    backgroundColor: "#26A69A",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    flexDirection: "row",
    elevation: 2,
  },
  navigateToPointButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  registerProgressButton: {
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    flexDirection: "row",
    elevation: 2,
  },
  registerProgressButtonActive: {
    backgroundColor: "#4CAF50",
  },
  registerProgressButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  registerProgressButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default RouteScreen