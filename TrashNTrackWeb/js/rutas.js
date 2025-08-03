// rutas.js
import { getRutas, getPlantas, getEmpresas, getUsuarios, getUbicaciones } from "../DataConnection/Gets.js" // Importa la función para obtener rutas detalladas
import { postRutas } from "../DataConnection/Post.js"


// Global Variables
let map
let selectedRoute = null
let currentFilter = "all"
let markers = []
let routeLine = null
let allRoutes = []
let filteredRoutes = []
let loadingOverlay = null // Reference to the loading overlay
let plantasList = []
let empresasList = []
let usuariosList = []
let ubicacionesList = []
let selectedCompanies = []

// Initialize Map
function initializeMap() {
  console.log("Intentando inicializar el mapa...")
  const mapElement = document.getElementById("routeMap")
  if (mapElement) {
    console.log("Elemento #routeMap encontrado.")
    if (map) {
      // Destroy existing map if it was already initialized
      map.remove()
      console.log("Mapa existente removido.")
    }
    // Centered near Baja California, zoomed out
    map = L.map("routeMap").setView([29.5, -114.5], 6)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    console.log("Mapa inicializado correctamente.")

    // Invalidate map size after initialization to ensure it renders properly
    map.invalidateSize()
    console.log("map.invalidateSize() llamado.")
  } else {
    console.error("Error: Elemento 'routeMap' no encontrado para inicializar el mapa.")
  }
}

// Helper to format date
function formatDate(isoString) {
  if (!isoString) return "N/A"
  const date = new Date(isoString)
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Render Route Cards
function renderRouteCards() {
  const routeListContent = document.getElementById("routeListContent")
  if (!routeListContent) {
    console.error("Element with ID 'routeListContent' not found.")
    return
  }
  routeListContent.innerHTML = ""

  if (filteredRoutes.length === 0) {
    routeListContent.innerHTML =
      "<p class='text-center text-gray-500'>No hay rutas disponibles con los filtros actuales.</p>"
    return
  }

  filteredRoutes.forEach((route) => {
    const routeCard = document.createElement("div")
    routeCard.className = "route-card"
    routeCard.dataset.routeId = route.id

    // Get user name
    const usuario =
      usuariosList && usuariosList.find ? usuariosList.find((u) => u.idUsuario === route.idUsuarioAsignado) : null
    const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.primerApellido}` : "Usuario no encontrado"

    const statusClass = (route.estado || "desconocido").toLowerCase().replace(" ", "-")

    routeCard.innerHTML = `
      <div class="route-header">
        <h3>${route.nombre || "Ruta sin Nombre"}</h3>
        <span class="route-status status-${statusClass}">${route.estado || "Desconocido"}</span>
      </div>
      <div class="route-details">
        <p><i class="fas fa-info-circle"></i> ${route.descripcion || "Sin descripción"}</p>
        <p><i class="fas fa-calendar-alt"></i> Creada: ${formatDate(route.fechaCreacion)}</p>
        <p><i class="fas fa-user"></i> Asignado a: ${nombreUsuario}</p>
        <p><i class="fas fa-chart-line"></i> Progreso: ${route.progresoRuta || 0}%</p>
      </div>
      <div class="route-actions">
        <button class="btn btn-small btn-view" onclick="showRouteDetails(${route.id})">Ver Detalles</button>
        <button class="btn btn-small btn-edit" onclick="editRoute(${route.id})">Editar</button>
      </div>
    `
    routeListContent.appendChild(routeCard)
  })
}

// Add markers and draw route line on the map
function addMarkersToMap() {
  // Clear existing markers and lines
  markers.forEach((marker) => map.removeLayer(marker))
  markers = []
  if (routeLine) {
    map.removeLayer(routeLine)
    routeLine = null
  }

  if (selectedRoute) {
    const routePoints = []

    // Find plant location
    const planta = plantasList.find((p) => p.id === selectedRoute.idPlanta)
    if (planta) {
      const plantaUbicacion = ubicacionesList.find((u) => u.idUbicacion === planta.idUbicacion)
      if (plantaUbicacion) {
        const plantLat = Number.parseFloat(plantaUbicacion.latitud)
        const plantLng = Number.parseFloat(plantaUbicacion.longitud)

        if (!isNaN(plantLat) && !isNaN(plantLng)) {
          const plantMarker = L.marker([plantLat, plantLng], {
            icon: L.icon({
              iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          }).addTo(map)
          plantMarker.bindPopup(`<b>${planta.nombre}</b><br>Planta de origen`).openPopup()
          markers.push(plantMarker)
          routePoints.push([plantLat, plantLng])
        }
      }
    }

    // Find company locations (if we store company IDs in the route)
    if (selectedRoute.empresasIds && Array.isArray(selectedRoute.empresasIds)) {
      selectedRoute.empresasIds.forEach((empresaId) => {
        const empresa = empresasList.find((e) => e.id === empresaId)
        if (empresa) {
          const empresaUbicacion = ubicacionesList.find((u) => u.idUbicacion === empresa.idUbicacion)
          if (empresaUbicacion) {
            const companyLat = Number.parseFloat(empresaUbicacion.latitud)
            const companyLng = Number.parseFloat(empresaUbicacion.longitud)

            if (!isNaN(companyLat) && !isNaN(companyLng)) {
              const companyMarker = L.marker([companyLat, companyLng]).addTo(map)
              companyMarker.bindPopup(`<b>${empresa.nombre}</b><br>Empresa destino`)
              markers.push(companyMarker)
              routePoints.push([companyLat, companyLng])
            }
          }
        }
      })
    }

    // Draw polyline
    if (routePoints.length > 1) {
      routeLine = L.polyline(routePoints, { color: "blue" }).addTo(map)
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
    } else if (routePoints.length === 1) {
      map.setView(routePoints[0], 12)
    }
  } else {
    map.setView([29.5, -114.5], 6)
  }
}

// Show route details (select a route and update map)
function showRouteDetails(routeId) {
  selectedRoute = allRoutes.find((route) => route.id === routeId)
  if (selectedRoute) {
    console.log("Ruta Seleccionada:", selectedRoute)
    addMarkersToMap() // Update map for the selected route
    // Highlight the selected card
    document.querySelectorAll(".route-card").forEach((card) => {
      card.classList.remove("selected")
    })
    document.querySelector(`.route-card[data-route-id="${routeId}"]`).classList.add("selected")
    
  
  }
}


// Edit route (placeholder function)
function editRoute(routeId) {
  const routeToEdit = allRoutes.find((r) => r.id === routeId)
  if (routeToEdit) {
    alert(`Editar ruta: ${routeToEdit.nombre} (ID: ${routeId})`)
    // Here you would typically open a modal or navigate to an edit page
    // and pre-fill a form with routeToEdit data.
    console.log("Ruta a editar:", routeToEdit)
  }
}
window.editRoute = editRoute // Make it globally accessible

// Clear selected route and map display
function clearSelection() {
  selectedRoute = null
  addMarkersToMap() // Clears markers and line from map
  document.querySelectorAll(".route-card").forEach((card) => {
    card.classList.remove("selected")
  })
}

// Filter routes based on search term and current filter
function filterRoutes(searchTerm = "") {
  const lowerCaseSearchTerm = searchTerm.toLowerCase()

  filteredRoutes = allRoutes.filter((route) => {
    const matchesSearch =
      (route.nombre || "").toLowerCase().includes(lowerCaseSearchTerm) ||
      (route.descripcion || "").toLowerCase().includes(lowerCaseSearchTerm)

    const matchesFilter = currentFilter === "all" || (route.estado || "").toLowerCase() === currentFilter

    return matchesSearch && matchesFilter
  })
  renderRouteCards()
}
window.filterRoutes = filterRoutes // Make it globally accessible for onkeyup in HTML

// Handle filter button clicks
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
      const searchInput = document.querySelector(".search-input")
      filterRoutes(searchInput ? searchInput.value : "") // Re-apply search term with new filter
    })
  })
}

// NUEVA FUNCIÓN: Calcular y actualizar estadísticas basadas en las rutas
function updateStatsBasedOnRoutes(routes) {
  let active = 0
  let completed = 0
  let delayed = 0
  let scheduled = 0

  routes.forEach((route) => {
    const status = (route.estado || "").toLowerCase()
    if (status === "activa") {
      active++
    } else if (status === "completada") {
      completed++
    } else if (status === "retrasada") {
      delayed++
    } else if (status === "pendiente") {
      scheduled++
    }
  })

  document.getElementById("activeRoutes").textContent = active
  document.getElementById("completedToday").textContent = completed
  document.getElementById("delayedRoutes").textContent = delayed
  document.getElementById("scheduledRoutes").textContent = scheduled
  document.getElementById("avgTime").textContent = "N/A"
}

// API Integration Functions
async function loadData() {
  showLoadingOverlay()
  try {
    console.log("Starting to load routes data...")

    // Load users and locations FIRST
    await loadUsersAndLocations()

    const apiResponse = await getRutas()
    console.log("API Response:", apiResponse)

    if (apiResponse && apiResponse.status === 0 && Array.isArray(apiResponse.data)) {
      allRoutes = apiResponse.data
      console.log("Routes loaded:", allRoutes.length)

      filterRoutes()
      updateStatsBasedOnRoutes(allRoutes)
      console.log("Data loaded successfully")
    } else {
      console.error("Invalid API response:", apiResponse)
      allRoutes = []
      filteredRoutes = []
      document.getElementById("routeListContent").innerHTML =
        "<p class='text-center text-red-500'>No se pudieron cargar las rutas. Intente de nuevo más tarde.</p>"
    }
  } catch (error) {
    console.error("Error loading routes:", error)
    allRoutes = []
    filteredRoutes = []
    document.getElementById("routeListContent").innerHTML =
      "<p class='text-center text-red-500'>Error de red al cargar rutas. Verifique su conexión o intente de nuevo.</p>"
  } finally {
    hideLoadingOverlay()
  }
}

async function loadUsersAndLocations() {
  try {
    const [usuariosResponse, ubicacionesResponse] = await Promise.all([getUsuarios(), getUbicaciones()])

    if (usuariosResponse && usuariosResponse.status === 0) {
      usuariosList = usuariosResponse.data
    }

    if (ubicacionesResponse && ubicacionesResponse.status === 0) {
      ubicacionesList = ubicacionesResponse.data
    }
  } catch (error) {
    console.error("Error loading users and locations:", error)
  }
}

async function refreshData() {
  await loadData()
  // Al recargar, si había una ruta seleccionada, la volvemos a seleccionar para que se muestre en el mapa.
  if (selectedRoute) {
    const updatedRoute = allRoutes.find((r) => r.id === selectedRoute.id)
    if (updatedRoute) {
      showRouteDetails(updatedRoute.id) // Vuelve a mostrar detalles y marcadores de la ruta
    } else {
      clearSelection() // Si la ruta ya no existe, limpia la selección
    }
  }
}

// General Modal Functions (assuming you have these in a shared script or similar)
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
  } else {
    console.error(`Modal con ID '${modalId}' no encontrado.`)
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"
  } else {
    console.error(`Modal con ID '${modalId}' no encontrado.`)
  }
}
window.closeModal = closeModal // Make it global for onclick in HTML

// Loading Overlay Functions
function showLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden")
    // Asegúrate de que el overlay sea visible
    loadingOverlay.style.opacity = "1"
    loadingOverlay.style.pointerEvents = "auto"
  }
}

function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden")
    // Permite que el CSS de transición haga su trabajo para el fade
    // Después de un pequeño retraso, quita pointer-events
    setTimeout(() => {
      if (loadingOverlay.classList.contains("hidden")) {
        loadingOverlay.style.pointerEvents = "none"
      }
    }, 300) // Coincide con la duración de la transición CSS
  }
}

// ========== MODAL SYSTEM FOR NEW ROUTE ==========
// Create modal for new route
const createRouteModal = document.createElement("div")
createRouteModal.id = "createRouteModal"
createRouteModal.className = "route-modal"
createRouteModal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h2><i class="fas fa-route"></i> Crear Nueva Ruta</h2>
      <span class="close-button-create">&times;</span>
    </div>
    <div class="modal-body">
      <form id="createRouteForm">
        <div class="form-group">
          <label for="routeName">Nombre de la Ruta *</label>
          <input type="text" id="routeName" name="routeName" required placeholder="Ej: Ruta Norte A-B">
          <span class="error-message" id="routeNameError"></span>
        </div>

        <div class="form-group">
          <label for="routeDescription">Descripción</label>
          <textarea id="routeDescription" name="routeDescription" rows="3" placeholder="Descripción de la ruta"></textarea>
          <span class="error-message" id="routeDescriptionError"></span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="plantSelect">Planta (Punto de Inicio) *</label>
            <select id="plantSelect" name="plantSelect" required>
              <option value="">Seleccione una planta...</option>
            </select>
            <span class="error-message" id="plantSelectError"></span>
          </div>

          <div class="form-group">
            <label for="userSelect">Usuario Asignado *</label>
            <select id="userSelect" name="userSelect" required>
              <option value="">Seleccione un usuario...</option>
            </select>
            <span class="error-message" id="userSelectError"></span>
          </div>
        </div>

        <div class="form-group">
          <label for="companiesSelect">Empresas en la Ruta *</label>
          <div class="multi-select-container">
            <div class="companies-selector">
              <select id="companiesSelect" name="companiesSelect" size="6">
                <option value="">Cargando empresas...</option>
              </select>
              <button type="button" id="addCompanyBtn" class="add-company-btn">
                <i class="fas fa-plus"></i> Agregar Empresa
              </button>
            </div>
            <div class="selected-companies">
              <h4>Empresas Seleccionadas:</h4>
              <div id="selectedCompaniesList">
                <p class="no-companies">No hay empresas seleccionadas</p>
              </div>
            </div>
          </div>
          <span class="error-message" id="companiesSelectError"></span>
        </div>

        <div class="form-group">
          <label for="routeStatus">Estado de la Ruta</label>
          <select id="routeStatus" name="routeStatus">
            <option value="Pendiente">Pendiente</option>
            <option value="Activa">Activa</option>
            <option value="Completada">Completada</option>
            <option value="Retrasada">Retrasada</option>
          </select>
        </div>

        <div class="form-buttons">
          <button type="button" id="cancelarRutaBtn">Cancelar</button>
          <button type="submit" id="crearRutaBtn">Crear Ruta</button>
        </div>
      </form>
      
      <!-- Mensajes de estado -->
      <div id="routeLoadingMessage" class="message-container" style="display: none;">
        <p><i class="fas fa-spinner fa-spin"></i> <span id="routeLoadingText">Procesando...</span></p>
      </div>
      
      <div id="routeSuccessMessage" class="message-container" style="display: none;">
        <p><i class="fas fa-check-circle"></i> <span id="routeSuccessText">¡Operación exitosa!</span></p>
      </div>
      
      <div id="routeErrorMessage" class="message-container" style="display: none;">
        <p><i class="fas fa-exclamation-triangle"></i> <span id="routeErrorText"></span></p>
      </div>
    </div>
  </div>
`
document.body.appendChild(createRouteModal)

// Modal functions
function openNewRouteModal() {
  loadPlantsAndCompanies()
  clearRouteMessages()
  resetRouteForm()
  createRouteModal.style.display = "block"
  document.body.style.overflow = "hidden"
}

function closeNewRouteModal() {
  createRouteModal.style.display = "none"
  document.body.style.overflow = "auto"
  resetRouteForm()
  clearRouteMessages()
}

function resetRouteForm() {
  document.getElementById("createRouteForm").reset()
  selectedCompanies = []
  updateSelectedCompaniesList()
}

function clearRouteMessages() {
  document.getElementById("routeLoadingMessage").style.display = "none"
  document.getElementById("routeSuccessMessage").style.display = "none"
  document.getElementById("routeErrorMessage").style.display = "none"

  // Clear validation errors
  document.getElementById("routeNameError").textContent = ""
  document.getElementById("routeDescriptionError").textContent = ""
  document.getElementById("plantSelectError").textContent = ""
  document.getElementById("companiesSelectError").textContent = ""
  document.getElementById("userSelectError").textContent = ""
}

// Load plants and companies data
async function loadPlantsAndCompanies() {
  try {
    // Wait a bit for modal to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100))

    const plantSelect = document.getElementById("plantSelect")
    const companiesSelect = document.getElementById("companiesSelect")
    const userSelect = document.getElementById("userSelect")

    if (!plantSelect || !companiesSelect || !userSelect) {
      console.error("Modal elements not found")
      return
    }

    plantSelect.innerHTML = '<option value="">Cargando plantas...</option>'
    companiesSelect.innerHTML = '<option value="">Cargando empresas...</option>'
    userSelect.innerHTML = '<option value="">Cargando usuarios...</option>'

    try {
      // Load all data
      const [plantasResponse, empresasResponse, usuariosResponse, ubicacionesResponse] = await Promise.all([
        getPlantas(),
        getEmpresas(),
        getUsuarios(),
        getUbicaciones(),
      ])

      console.log("Plantas response:", plantasResponse)
      console.log("Empresas response:", empresasResponse)
      console.log("Usuarios response:", usuariosResponse)

      // Load plants
      if (plantasResponse && plantasResponse.status === 0 && Array.isArray(plantasResponse.data)) {
        plantasList = plantasResponse.data
        populatePlantsSelect()
      } else {
        plantSelect.innerHTML = '<option value="">Error cargando plantas</option>'
        console.error("Error en respuesta de plantas:", plantasResponse)
      }

      // Load companies
      if (empresasResponse && empresasResponse.status === 0 && Array.isArray(empresasResponse.data)) {
        empresasList = empresasResponse.data
        populateCompaniesSelect()
      } else {
        companiesSelect.innerHTML = '<option value="">Error cargando empresas</option>'
        console.error("Error en respuesta de empresas:", empresasResponse)
      }

      // Load users
      if (usuariosResponse && usuariosResponse.status === 0 && Array.isArray(usuariosResponse.data)) {
        usuariosList = usuariosResponse.data
        populateUsersSelect()
      } else {
        userSelect.innerHTML = '<option value="">Error cargando usuarios</option>'
        console.error("Error en respuesta de usuarios:", usuariosResponse)
      }

      // Load locations
      if (ubicacionesResponse && ubicacionesResponse.status === 0 && Array.isArray(ubicacionesResponse.data)) {
        ubicacionesList = ubicacionesResponse.data
      }
    } catch (apiError) {
      console.error("Error in API calls:", apiError)
      plantSelect.innerHTML = '<option value="">Error de conexión</option>'
      companiesSelect.innerHTML = '<option value="">Error de conexión</option>'
      userSelect.innerHTML = '<option value="">Error de conexión</option>'
    }
  } catch (error) {
    console.error("Error loading data:", error)
  }
}

function populatePlantsSelect() {
  const plantSelect = document.getElementById("plantSelect")
  plantSelect.innerHTML = '<option value="">Seleccione una planta...</option>'

  plantasList.forEach((planta) => {
    const option = document.createElement("option")
    option.value = planta.id
    option.textContent = planta.nombre
    plantSelect.appendChild(option)
  })
}

function populateCompaniesSelect() {
  const companiesSelect = document.getElementById("companiesSelect")
  companiesSelect.innerHTML = '<option value="">Seleccione una empresa...</option>'

  if (empresasList.length === 0) {
    companiesSelect.innerHTML = '<option value="">No hay empresas disponibles</option>'
    return
  }

  empresasList.forEach((empresa) => {
    const option = document.createElement("option")
    option.value = empresa.id
    option.textContent = empresa.nombre
    companiesSelect.appendChild(option)
  })
}

function populateUsersSelect() {
  const userSelect = document.getElementById("userSelect")
  userSelect.innerHTML = '<option value="">Seleccione un usuario...</option>'

  usuariosList.forEach((usuario) => {
    const option = document.createElement("option")
    option.value = usuario.idUsuario
    option.textContent = `${usuario.nombre} ${usuario.primerApellido} (${usuario.tipoUsuario})`
    userSelect.appendChild(option)
  })
}

function addSelectedCompany() {
  const companiesSelect = document.getElementById("companiesSelect")
  const selectedOption = companiesSelect.options[companiesSelect.selectedIndex]

  if (!selectedOption || !selectedOption.value) {
    return
  }

  const companyId = Number.parseInt(selectedOption.value)
  const companyName = selectedOption.textContent

  // Check if company is already selected
  if (selectedCompanies.find((c) => c.id === companyId)) {
    return
  }

  selectedCompanies.push({ id: companyId, nombre: companyName })
  updateSelectedCompaniesList()

  // Reset select
  companiesSelect.selectedIndex = -1
}

function removeSelectedCompany(companyId) {
  selectedCompanies = selectedCompanies.filter((c) => c.id !== companyId)
  updateSelectedCompaniesList()
}

function updateSelectedCompaniesList() {
  const container = document.getElementById("selectedCompaniesList")

  if (selectedCompanies.length === 0) {
    container.innerHTML = '<p class="no-companies">No hay empresas seleccionadas</p>'
    return
  }

  container.innerHTML = selectedCompanies
    .map(
      (company) => `
    <div class="selected-company-item">
      <span><i class="fas fa-industry"></i> ${company.nombre}</span>
      <button type="button" class="remove-company" onclick="removeSelectedCompany(${company.id})">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `,
    )
    .join("")
}

// Form validation
function validateRouteForm(formData) {
  let isValid = true

  // Validate route name
  if (!formData.routeName.trim()) {
    document.getElementById("routeNameError").textContent = "El nombre de la ruta es requerido"
    isValid = false
  } else {
    document.getElementById("routeNameError").textContent = ""
  }

  // Validate plant selection
  if (!formData.plantSelect) {
    document.getElementById("plantSelectError").textContent = "Debe seleccionar una planta"
    isValid = false
  } else {
    document.getElementById("plantSelectError").textContent = ""
  }

  // Validate companies selection
  if (selectedCompanies.length === 0) {
    document.getElementById("companiesSelectError").textContent = "Debe seleccionar al menos una empresa"
    isValid = false
  } else {
    document.getElementById("companiesSelectError").textContent = ""
  }

  // Validate user selection
  if (!formData.userSelect) {
    document.getElementById("userSelectError").textContent = "Debe seleccionar un usuario"
    isValid = false
  } else {
    document.getElementById("userSelectError").textContent = ""
  }

  return isValid
}

// Form submission
async function handleRouteFormSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const routeData = {
    routeName: formData.get("routeName").trim(),
    routeDescription: formData.get("routeDescription").trim(),
    plantSelect: formData.get("plantSelect"),
    companiesSelect: formData.get("companiesSelect"),
    userSelect: formData.get("userSelect"),
    routeStatus: formData.get("routeStatus"),
  }

  if (!validateRouteForm(routeData)) {
    return
  }

  clearRouteMessages()
  document.getElementById("routeLoadingMessage").style.display = "block"
  document.getElementById("routeLoadingText").textContent = "Creando ruta..."

  try {
    const apiData = {
      nombre: routeData.routeName,
      fechaCreacion: new Date().toISOString().split("T")[0],
      descripcion: routeData.routeDescription || "",
      estado: routeData.routeStatus,
      idUsuarioAsignado: Number.parseInt(routeData.userSelect),
      progresoRuta: 0,
    }

    const result = await postRutas(apiData)

    document.getElementById("routeLoadingMessage").style.display = "none"

    if (result && result.status === 0) {
      document.getElementById("routeSuccessMessage").style.display = "block"
      document.getElementById("routeSuccessText").textContent = "¡Ruta creada exitosamente!"

      await loadData()

      setTimeout(() => {
        closeNewRouteModal()
      }, 2000)
    } else {
      document.getElementById("routeErrorMessage").style.display = "block"
      document.getElementById("routeErrorText").textContent = result.message || "Error desconocido al crear la ruta"
    }
  } catch (error) {
    document.getElementById("routeLoadingMessage").style.display = "none"
    document.getElementById("routeErrorMessage").style.display = "block"
    document.getElementById("routeErrorText").textContent = error.message || "Error al conectar con el servidor"
    console.error("Error creating route:", error)
  }
}

// Event listeners for modal
createRouteModal.querySelector(".close-button-create").addEventListener("click", closeNewRouteModal)
document.getElementById("cancelarRutaBtn").addEventListener("click", closeNewRouteModal)
document.getElementById("createRouteForm").addEventListener("submit", handleRouteFormSubmit)
document.getElementById("addCompanyBtn").addEventListener("click", addSelectedCompany)

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === createRouteModal) {
    closeNewRouteModal()
  }
})

// Make functions global for onclick handlers
window.showRouteDetails = showRouteDetails // Needs to be global for onclick in renderRouteCards
window.editRoute = editRoute // Already global, keeping for consistency
window.filterRoutes = filterRoutes // Already global
window.clearSelection = clearSelection // Already global
window.refreshData = refreshData // Using refreshData to handle re-selection after load
window.removeSelectedCompany = removeSelectedCompany

// Declare handleNewRouteSubmit function
function handleNewRouteSubmit(e) {
  console.error("handleNewRouteSubmit function is not implemented.")
  e.preventDefault()
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Get reference to the loading overlay early
  loadingOverlay = document.getElementById("loadingOverlay")

  initializeMap() // Initialize map on page load
  loadData() // Load data from API

  // Setup filter buttons
  setupFilterButtons()

  // Set up the "Nueva Ruta" button
  const newRouteBtn = document.getElementById("newContainerBtn")
  if (newRouteBtn) {
    newRouteBtn.addEventListener("click", openNewRouteModal)
  } else {
    console.warn('Elemento "newContainerBtn" (Nueva Ruta) no encontrado.')
  }

  // Set up new route form submission
  const newRouteForm = document.getElementById("newRouteForm")
  if (newRouteForm) {
    newRouteForm.addEventListener("submit", handleNewRouteSubmit)
  }
})
