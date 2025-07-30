"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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
import { LinearGradient } from "expo-linear-gradient"
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
  const webViewRef = useRef(null)
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const fetchUserId = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error("No hay usuario autenticado")
        throw new Error("No hay usuario autenticado")
      }
      console.log("Firebase UID:", currentUser.uid)
      const response = await fetch(`http://${IP_URL}:5000/api/usuarios/firebase/${currentUser.uid}`)
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
      setRefreshing(true)
      const userId = await fetchUserId()
      const response = await axios.get(`http://${IP_URL}:5000/api/rutas/detalladas/${userId}`)
      if (response.data.status === 0) {
        const activeRoutes = response.data.data.filter(
          (route) => route.estado_ruta === "INICIADA" || route.estado_ruta === "EN_PROCESO",
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
        setRoutesData([])
        setSelectedRoute(null)
        setRouteCoordinates([])
        setCurrentProgress(0)
        setMapHtml("")
      }
    } catch (error) {
      console.log("Info: No se encontraron rutas activas o ocurrió un problema durante la carga.", error)
      setRoutesData([])
      setSelectedRoute(null)
      setRouteCoordinates([])
      setCurrentProgress(0)
      setMapHtml("")
    } finally {
      setLoading(false)
      setRefreshing(false)
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
            ? "#10B981"
            : coord.orden < routeData.progreso_ruta
              ? "#4A90E2"
              : coord.orden === routeData.progreso_ruta
                ? "#F59E0B"
                : "#EF4444"
        const icon = coord.type === "planta" ? "🏭" : `${coord.orden + 1}`
        return `
          L.marker([${coord.latitude}, ${coord.longitude}])
            .addTo(map)
            .bindPopup(\`
              <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 16px;">${coord.name}</h3>
                <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">${
                  coord.type === "planta" ? "Punto de inicio" : `Parada #${coord.orden + 1}`
                }</p>
                <button onclick="window.ReactNativeWebView.postMessage('marker_${index}')"
                    style="background: #4A90E2; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
                  Ver detalles
                </button>
              </div>
            \`)
            .setIcon(L.divIcon({
              html: '<div style="background: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${icon}</div>',
              className: 'custom-marker',
              iconSize: [32, 32]
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
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
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
        
        function recenterMap() {
          if (${coordinates.length} > 0) {
            const markerGroup = new L.featureGroup([
              ${coordinates.map((c) => `L.marker([${c.latitude}, ${c.longitude}])`).join(",")}
            ]);
            map.fitBounds(markerGroup.getBounds(), { padding: [20, 20] });
          }
        }
        
        recenterMap();
        
        document.addEventListener('message', function(e) {
          const message = e.data;
          if (message === 'recenterMap') {
            recenterMap();
          } else {
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
      webViewRef.current.postMessage("recenterMap")
    }
  }

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
      const response = await axios.put(`http://${IP_URL}:5000/api/rutas/update-progress`, {
        idRuta: selectedRoute.id_ruta,
        progresoRuta: newProgress,
        estado: newEstado,
      })

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
            return prevRoutes.map((r) => (r.id_ruta === updatedSelectedRoute.id_ruta ? updatedSelectedRoute : r))
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
    const progressPercentage = totalEmpresas === 0 ? 0 : Math.round((completedEmpresas / totalEmpresas) * 100)

    return (
      <View style={styles.routeInfoContainer}>
        <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.routeInfoGradient}>
          {routesData.length > 1 && (
            <View style={styles.routeSelector}>
              <Text style={styles.routeSelectorTitle}>Rutas activas:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {routesData.map((route, index) => (
                  <TouchableOpacity
                    key={route.id_ruta}
                    style={[styles.routeOption, selectedRoute.id_ruta === route.id_ruta && styles.selectedRouteOption]}
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
                        ? "#FEF3C7"
                        : selectedRoute.estado_ruta === "INICIADA"
                          ? "#DBEAFE"
                          : selectedRoute.estado_ruta === "EN_PROCESO"
                            ? "#FEE2E2"
                            : "#D1FAE5",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        selectedRoute.estado_ruta === "PENDIENTE"
                          ? "#F59E0B"
                          : selectedRoute.estado_ruta === "INICIADA"
                            ? "#4A90E2"
                            : selectedRoute.estado_ruta === "EN_PROCESO"
                              ? "#EF4444"
                              : "#10B981",
                    },
                  ]}
                >
                  {selectedRoute.estado_ruta}
                </Text>
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
              <MaterialIcons name="location-on" size={16} color="#4A90E2" />
              <Text style={styles.statText}>{totalEmpresas} paradas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="map" size={16} color="#4A90E2" />
              <Text style={styles.statText}>OpenStreetMap</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    )
  }

  const getContainerColor = (tipoResiduo) => {
    switch (tipoResiduo?.toLowerCase()) {
      case "orgánico":
        return "#10B981"
      case "plástico":
        return "#4A90E2"
      case "químico":
        return "#EF4444"
      default:
        return "#6B7280"
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
                <View style={[styles.modalIconContainer, { backgroundColor: isEmpresa ? "#4A90E2" : "#10B981" }]}>
                  <FontAwesome5 name={isEmpresa ? "building" : "industry"} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>{selectedPoint.name}</Text>
                {isEmpresa && <Text style={styles.modalSubtitle}>Parada #{selectedPoint.orden + 1}</Text>}
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color="#4A90E2" />
                  <Text style={styles.detailText}>
                    {isEmpresa ? selectedPoint.empresa?.direccion : selectedRoute.direccion_planta}
                  </Text>
                </View>
                {isEmpresa && selectedPoint.empresa?.rfc && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="business" size={20} color="#4A90E2" />
                    <Text style={styles.detailText}>RFC: {selectedPoint.empresa.rfc}</Text>
                  </View>
                )}
              </View>

              {isEmpresa && selectedPoint.empresa?.contenedores && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeader}>Contenedores ({selectedPoint.empresa.contenedores.length})</Text>
                  {selectedPoint.empresa.contenedores.map((cont, index) => (
                    <View key={index} style={styles.containerCard}>
                      <View style={styles.containerHeader}>
                        <FontAwesome5 name="trash" size={16} color={getContainerColor(cont.contenedor.tipo_residuo)} />
                        <Text style={styles.containerType}>{cont.contenedor.tipo_contenedor}</Text>
                      </View>
                      <Text style={styles.containerDescription}>{cont.contenedor.descripcion}</Text>
                      <View style={styles.containerDetails}>
                        <Text style={styles.containerDetail}>Tipo: {cont.contenedor.tipo_residuo}</Text>
                        <Text style={styles.containerDetail}>Capacidad: {cont.contenedor.capacidad_maxima} L</Text>
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
                <LinearGradient colors={["#10B981", "#059669"]} style={styles.buttonGradient}>
                  <MaterialIcons name="navigation" size={20} color="white" />
                  <Text style={styles.buttonText}>Navegar aquí</Text>
                </LinearGradient>
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
                  <LinearGradient
                    colors={
                      isNextPointToRegister && !isRouteCompleted ? ["#4A90E2", "#357ABD"] : ["#9CA3AF", "#6B7280"]
                    }
                    style={styles.buttonGradient}
                  >
                    <MaterialIcons name="check-circle" size={20} color="white" />
                    <Text style={styles.buttonText}>
                      {isRouteCompleted
                        ? "Ruta Completada"
                        : isPointAlreadyRegistered
                          ? "Progreso Registrado"
                          : "Registrar Progreso"}
                    </Text>
                  </LinearGradient>
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
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContent}>
          <MaterialIcons name="map" size={80} color="#FFFFFF" />
          <Text style={styles.loadingTitle}>Cargando rutas...</Text>
          <Text style={styles.loadingSubtext}>Preparando mapa con OpenStreetMap</Text>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingSpinner} />
        </View>
      </View>
    )
  }

  if (routesData.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.errorGradient}>
          <Text style={styles.errorTitle}>Sin Rutas Activas</Text>
        </LinearGradient>
        <View style={styles.errorContent}>
          <MaterialIcons name="route" size={100} color="#E5E7EB" />
          <Text style={styles.errorText}>No tienes rutas INICIADAS o EN PROCESO actualmente</Text>
          <Text style={styles.errorSubtext}>
            Las rutas aparecerán aquí cuando sean asignadas y activadas por tu supervisor.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRoutesData}>
            <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.retryButtonGradient}>
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Actualizar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRoutesData} tintColor="#4A90E2" />}
        showsVerticalScrollIndicator={false}
      >
        {renderRouteInfo()}

        <View style={styles.mapContainer}>
          {mapHtml ? (
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#4A90E2" />
                  <Text style={styles.webviewLoadingText}>Cargando mapa...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.webviewLoadingText}>Generando mapa...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.recenterButton} onPress={handleRecenterMap}>
            <MaterialIcons name="my-location" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.navigationButton}
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
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.navigationButtonGradient}>
              <MaterialIcons name="navigation" size={24} color="white" />
              <Text style={styles.navigationButtonText}>Navegación Optimizada</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderModal()}
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
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 30,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  errorGradient: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  errorSubtext: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  routeInfoContainer: {
    borderRadius: 20,
    overflow: "hidden",
    margin: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  routeInfoGradient: {
    padding: 20,
  },
  routeSelector: {
    marginBottom: 20,
  },
  routeSelectorTitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "600",
  },
  routeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  selectedRouteOption: {
    backgroundColor: "#4A90E2",
  },
  routeOptionText: {
    color: "#374151",
    fontWeight: "600",
  },
  selectedRouteOptionText: {
    color: "#FFFFFF",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  routeTitle: {
    flex: 1,
  },
  routeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: "#6B7280",
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
    fontSize: 12,
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  progressPercentage: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A90E2",
    borderRadius: 4,
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  mainScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webview: {
    flex: 1,
    width: "100%",
  },
  webviewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "600",
  },
  recenterButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  navigationButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  navigationButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  navigationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "85%",
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
    marginBottom: 24,
    paddingTop: 10,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  containerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  containerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  containerType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 8,
  },
  containerDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  containerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerDetail: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  navigateToPointButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerProgressButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerProgressButtonActive: {},
  registerProgressButtonDisabled: {},
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default RouteScreen
