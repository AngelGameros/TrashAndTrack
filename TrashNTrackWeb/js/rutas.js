// API Configuration
const API_BASE_URL = "https://api.trashtrack.com/v1" // Simulated API
const API_ENDPOINTS = {
  routes: "/routes/baja-california",
  stats: "/stats/baja-california",
  alerts: "/alerts/active",
}

// Global Variables
let map
let selectedRoute = null
let currentFilter = "all"
let markers = []
let routeLine = null
let allRoutes = []
let filteredRoutes = []

// Baja California locations data
const BAJA_CALIFORNIA_LOCATIONS = {
  // Baja California Norte
  Tijuana: [32.5149, -117.0382],
  Mexicali: [32.6519, -115.4681],
  Ensenada: [31.8667, -116.5833],
  Tecate: [32.5764, -116.6292],
  Rosarito: [32.3667, -117.0333],
  "San Felipe": [31.0167, -114.8333],

  // Baja California Sur
  "La Paz": [24.1426, -110.3128],
  "Los Cabos": [22.8905, -109.9167],
  Loreto: [26.0167, -111.35],
  Mulegé: [26.8833, -111.9833],
  "Santa Rosalía": [27.3333, -112.2667],
  "Guerrero Negro": [27.9833, -114.0667],
}

// Simulated API Functions
class RoutesAPI {
  static async fetchRoutes() {
    showLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulated route data for Baja California
    const routes = [
      {
        id: "BC001",
        name: "RUTA #BC001",
        origin: "Tijuana",
        destination: "Mexicali",
        status: "active",
        conductor: "Miguel Hernández",
        departure: "06:00 AM",
        arrival: "09:30 AM",
        cargo: "Residuos industriales",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["Tijuana"],
          destination: BAJA_CALIFORNIA_LOCATIONS["Mexicali"],
        },
        progress: 45,
        vehicle: "Camión-001",
        distance: "188 km",
      },
      {
        id: "BC002",
        name: "RUTA #BC002",
        origin: "Ensenada",
        destination: "Tecate",
        status: "delayed",
        conductor: "Ana Rodríguez",
        departure: "07:00 AM",
        arrival: "10:15 AM (+45 min)",
        cargo: "Contenedores de reciclaje",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["Ensenada"],
          destination: BAJA_CALIFORNIA_LOCATIONS["Tecate"],
        },
        progress: 30,
        vehicle: "Camión-002",
        distance: "95 km",
      },
      {
        id: "BC003",
        name: "RUTA #BC003",
        origin: "La Paz",
        destination: "Los Cabos",
        status: "completed",
        conductor: "Carlos López",
        departure: "05:30 AM",
        arrival: "08:45 AM",
        cargo: "Residuos orgánicos",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["La Paz"],
          destination: BAJA_CALIFORNIA_LOCATIONS["Los Cabos"],
        },
        progress: 100,
        vehicle: "Camión-003",
        distance: "220 km",
      },
      {
        id: "BC004",
        name: "RUTA #BC004",
        origin: "Mexicali",
        destination: "San Felipe",
        status: "scheduled",
        conductor: "Laura Martínez",
        departure: "14:00 PM",
        arrival: "16:30 PM",
        cargo: "Materiales peligrosos",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["Mexicali"],
          destination: BAJA_CALIFORNIA_LOCATIONS["San Felipe"],
        },
        progress: 0,
        vehicle: "Camión-004",
        distance: "198 km",
      },
      {
        id: "BC005",
        name: "RUTA #BC005",
        origin: "Loreto",
        destination: "Santa Rosalía",
        status: "active",
        conductor: "Roberto García",
        departure: "08:00 AM",
        arrival: "11:30 AM",
        cargo: "Residuos médicos",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["Loreto"],
          destination: BAJA_CALIFORNIA_LOCATIONS["Santa Rosalía"],
        },
        progress: 65,
        vehicle: "Camión-005",
        distance: "135 km",
      },
      {
        id: "BC006",
        name: "RUTA #BC006",
        origin: "Rosarito",
        destination: "Ensenada",
        status: "completed",
        conductor: "Patricia Morales",
        departure: "06:30 AM",
        arrival: "08:00 AM",
        cargo: "Residuos domésticos",
        coordinates: {
          origin: BAJA_CALIFORNIA_LOCATIONS["Rosarito"],
          destination: BAJA_CALIFORNIA_LOCATIONS["Ensenada"],
        },
        progress: 100,
        vehicle: "Camión-006",
        distance: "75 km",
      },
    ]

    showLoading(false)
    return routes
  }

  static async fetchStats() {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      activeRoutes: 2,
      completedToday: 2,
      delayedRoutes: 1,
      scheduledRoutes: 1,
      avgTime: "3.2h",
    }
  }

  static async fetchAlerts() {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))

    return [
      {
        id: 1,
        type: "delay",
        message: "Ruta #BC002: Retraso de 45 minutos",
        severity: "warning",
        routeId: "BC002",
      },
      {
        id: 2,
        type: "maintenance",
        message: "Camión-007: Mantenimiento programado",
        severity: "info",
        routeId: null,
      },
    ]
  }
}

// Utility Functions
function getStatusColor(status) {
  const colors = {
    active: "#06b6d4",
    completed: "#10b981",
    delayed: "#ef4444",
    scheduled: "#f59e0b",
  }
  return colors[status] || "#6b7280"
}

function getStatusText(status) {
  const texts = {
    active: "En Progreso",
    completed: "Completada",
    delayed: "Retrasada",
    scheduled: "Programada",
  }
  return texts[status] || "Desconocido"
}

function getStatusIcon(status) {
  const icons = {
    active: "🚛",
    completed: "✅",
    delayed: "⚠️",
    scheduled: "📅",
  }
  return icons[status] || "📍"
}

function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay")
  if (show) {
    overlay.classList.remove("hidden")
  } else {
    overlay.classList.add("hidden")
  }
}

// Map Functions
function initMap() {
  // Center map on Baja California
  map = window.L.map("map").setView([29.0, -114.0], 6)

  // Add OpenStreetMap tiles
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map)

  // Set map bounds to Baja California
  const bajaBounds = [
    [22.8, -117.5], // Southwest
    [32.7, -109.0], // Northeast
  ]
  map.setMaxBounds(bajaBounds)
  map.fitBounds(bajaBounds)
}

function addMarkersToMap() {
  // Clear existing markers
  markers.forEach((marker) => map.removeLayer(marker))
  markers = []

  filteredRoutes.forEach((route) => {
    const color = getStatusColor(route.status)

    // Create custom icon
    const createCustomIcon = (isDestination = false) => {
      return window.L.divIcon({
        className: "custom-marker",
        html: `<div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
    }

    // Add origin marker
    const originMarker = window.L.marker(route.coordinates.origin, {
      icon: createCustomIcon(),
    }).addTo(map)

    originMarker.bindPopup(`
            <div style="text-align: center;">
                <strong>${route.origin}</strong><br>
                <small>Origen - ${route.name}</small><br>
                <small>Conductor: ${route.conductor}</small><br>
                <small>Vehículo: ${route.vehicle}</small>
            </div>
        `)

    markers.push(originMarker)

    // Add destination marker
    const destMarker = window.L.marker(route.coordinates.destination, {
      icon: createCustomIcon(true),
    }).addTo(map)

    destMarker.bindPopup(`
            <div style="text-align: center;">
                <strong>${route.destination}</strong><br>
                <small>Destino - ${route.name}</small><br>
                <small>Estado: ${getStatusText(route.status)}</small><br>
                <small>Distancia: ${route.distance}</small>
            </div>
        `)

    markers.push(destMarker)
  })
}

function showRouteOnMap(route) {
  // Remove existing route line
  if (routeLine) {
    map.removeLayer(routeLine)
  }

  const color = getStatusColor(route.status)

  // Create route line
  routeLine = window.L.polyline([route.coordinates.origin, route.coordinates.destination], {
    color: color,
    weight: 4,
    opacity: 0.8,
    dashArray: route.status === "scheduled" ? "10, 10" : null,
  }).addTo(map)

  // Fit map to show the route
  const group = new window.L.featureGroup([routeLine])
  map.fitBounds(group.getBounds().pad(0.1))

  // Add truck icon for active routes
  if (route.status === "active") {
    const midLat = (route.coordinates.origin[0] + route.coordinates.destination[0]) / 2
    const midLng = (route.coordinates.origin[1] + route.coordinates.destination[1]) / 2

    const truckIcon = window.L.divIcon({
      html: '<div style="font-size: 24px;">🚛</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      className: "truck-marker",
    })

    const truckMarker = window.L.marker([midLat, midLng], {
      icon: truckIcon,
    }).addTo(map)

    markers.push(truckMarker)
  }
}

function clearRouteFromMap() {
  if (routeLine) {
    map.removeLayer(routeLine)
    routeLine = null
  }

  // Remove truck markers
  markers = markers.filter((marker) => {
    if (marker.options.icon && marker.options.icon.options.className === "truck-marker") {
      map.removeLayer(marker)
      return false
    }
    return true
  })

  // Reset map view to Baja California
  const bajaBounds = [
    [22.8, -117.5],
    [32.7, -109.0],
  ]
  map.fitBounds(bajaBounds)
}

// UI Functions
function renderRouteCards() {
  const container = document.getElementById("routeListContent")
  container.innerHTML = ""

  if (filteredRoutes.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No se encontraron rutas</p>'
    return
  }

  filteredRoutes.forEach((route) => {
    const card = document.createElement("div")
    card.className = `route-card ${selectedRoute?.id === route.id ? "selected" : ""}`
    card.onclick = () => selectRoute(route)

    card.innerHTML = `
            <div class="route-card-header">
                <h3 class="route-card-title">${route.name}</h3>
                <span class="status-badge status-${route.status}">${getStatusText(route.status)}</span>
            </div>
            <div class="route-card-details">
                <p><strong>${route.origin} → ${route.destination}</strong></p>
                <p>Conductor: ${route.conductor}</p>
                <p>Vehículo: ${route.vehicle}</p>
                <p>Salida: ${route.departure} | ETA: ${route.arrival}</p>
                <p>Carga: ${route.cargo}</p>
                <p>Distancia: ${route.distance}</p>
            </div>
            <div class="progress-bar">
                <div class="progress-fill progress-${route.status}" style="width: ${route.progress}%"></div>
            </div>
        `

    container.appendChild(card)
  })
}

function updateStats(stats) {
  document.getElementById("activeRoutes").textContent = stats.activeRoutes
  document.getElementById("completedToday").textContent = stats.completedToday
  document.getElementById("delayedRoutes").textContent = stats.delayedRoutes
  document.getElementById("scheduledRoutes").textContent = stats.scheduledRoutes
  document.getElementById("avgTime").textContent = stats.avgTime
}

function renderAlerts(alerts) {
  const container = document.getElementById("alertsSection")

  if (alerts.length === 0) {
    container.innerHTML = ""
    return
  }

  container.innerHTML = `
        <div class="alerts-title">
            <div class="alert-dot"></div>
            <span>Alertas Activas</span>
        </div>
        ${alerts
          .map(
            (alert) => `
            <div class="alert-item">
                <div class="alert-item-dot ${alert.severity === "warning" ? "alert-red" : "alert-orange"}"></div>
                <span>${alert.message}</span>
            </div>
        `,
          )
          .join("")}
    `
}

function selectRoute(route) {
  selectedRoute = route
  renderRouteCards()
  showRouteOnMap(route)
  showRouteInfo(route)
}

function clearSelection() {
  selectedRoute = null
  renderRouteCards()
  clearRouteFromMap()
  hideRouteInfo()
  addMarkersToMap()
}

function showRouteInfo(route) {
  const infoPanel = document.getElementById("routeInfo")
  const title = document.getElementById("routeInfoTitle")
  const details = document.getElementById("routeInfoDetails")

  title.innerHTML = `${getStatusIcon(route.status)} ${route.name}`
  details.innerHTML = `
        <p><strong>Ruta:</strong> ${route.origin} → ${route.destination}</p>
        <p><strong>Conductor:</strong> ${route.conductor}</p>
        <p><strong>Vehículo:</strong> ${route.vehicle}</p>
        <p><strong>Salida:</strong> ${route.departure}</p>
        <p><strong>Llegada:</strong> ${route.arrival}</p>
        <p><strong>Carga:</strong> ${route.cargo}</p>
        <p><strong>Distancia:</strong> ${route.distance}</p>
        <p><strong>Progreso:</strong> ${route.progress}%</p>
    `

  infoPanel.classList.add("show")
}

function hideRouteInfo() {
  document.getElementById("routeInfo").classList.remove("show")
}

function filterRoutes(searchTerm = "") {
  let routes = allRoutes

  // Apply status filter
  if (currentFilter !== "all") {
    routes = routes.filter((route) => route.status === currentFilter)
  }

  // Apply search filter
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    routes = routes.filter(
      (route) =>
        route.name.toLowerCase().includes(term) ||
        route.conductor.toLowerCase().includes(term) ||
        route.origin.toLowerCase().includes(term) ||
        route.destination.toLowerCase().includes(term) ||
        route.cargo.toLowerCase().includes(term),
    )
  }

  filteredRoutes = routes
  renderRouteCards()
  addMarkersToMap()
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active button
      filterButtons.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      // Update filter
      currentFilter = btn.dataset.filter

      // Clear selection and update
      clearSelection()
      filterRoutes()
    })
  })
}

// API Integration Functions
async function loadData() {
  try {
    // Load routes
    allRoutes = await RoutesAPI.fetchRoutes()
    filteredRoutes = [...allRoutes]

    // Load stats
    const stats = await RoutesAPI.fetchStats()
    updateStats(stats)

    // Load alerts
    const alerts = await RoutesAPI.fetchAlerts()
    renderAlerts(alerts)

    // Render UI
    renderRouteCards()
    addMarkersToMap()
  } catch (error) {
    console.error("Error loading data:", error)
    alert("Error al cargar los datos. Por favor, intente nuevamente.")
  }
}

async function refreshData() {
  await loadData()
  if (selectedRoute) {
    // Re-select the current route if it still exists
    const updatedRoute = allRoutes.find((r) => r.id === selectedRoute.id)
    if (updatedRoute) {
      selectRoute(updatedRoute)
    } else {
      clearSelection()
    }
  }
}

// Modal Functions (placeholder)
function openNewRouteModal() {
  alert("Funcionalidad de nueva ruta en desarrollo")
}

// Initialize Application
function init() {
  initMap()
  setupFilterButtons()
  loadData()
}

// Start the application
document.addEventListener("DOMContentLoaded", init)
