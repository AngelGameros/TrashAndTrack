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
let loadingOverlay = null
let plantasList = []
let empresasList = []
let usuariosList = []
let selectedCompanies = []
let routeDetails = null // Nueva variable para almacenar los detalles de la ruta

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
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Render Route Cards
function renderRouteCards() {
    const routeListContent = document.getElementById("routeListContent");
    if (!routeListContent) {
        console.error("Element with ID 'routeListContent' not found.");
        return;
    }
    routeListContent.innerHTML = ""; // Clear previous content

    if (filteredRoutes.length === 0) {
        routeListContent.innerHTML = "<p class='text-center text-gray-500'>No hay rutas disponibles con los filtros actuales.</p>";
        return;
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
        <button class="btn btn-small btn-view" onclick="showRouteDetails(${route.id})">Ver en el mapa</button>
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

  if (!routeDetails) {
    console.log("No hay detalles de ruta disponibles")
    map.setView([29.5, -114.5], 6)
    return
  }

  console.log("Procesando detalles de ruta:", routeDetails)
  const routeId = routeDetails.id_ruta || routeDetails.id || routeDetails.idRuta
  console.log("ID de la ruta que se está procesando:", routeId)
  console.log("coordenadas_inicio_json (raw):", routeDetails.coordenadas_inicio_json)
  console.log("coordenadas_ruta_json (raw):", routeDetails.coordenadas_ruta_json)

  const routePoints = []

  try {
    // 1. Agregar punto de inicio (planta)
    if (
      routeDetails.coordenadas_inicio_json &&
      routeDetails.coordenadas_inicio_json !== null &&
      routeDetails.coordenadas_inicio_json !== "null" &&
      routeDetails.coordenadas_inicio_json !== ""
    ) {
      console.log("Parseando coordenadas de inicio...")
      const coordenadasInicio = JSON.parse(routeDetails.coordenadas_inicio_json)
      console.log("Coordenadas de inicio parseadas:", coordenadasInicio)

      if (coordenadasInicio && Array.isArray(coordenadasInicio) && coordenadasInicio.length > 0) {
        const puntoInicio = coordenadasInicio[0].punto
        const plantLat = Number.parseFloat(puntoInicio.latitud)
        const plantLng = Number.parseFloat(puntoInicio.longitud)

        console.log("Coordenadas de planta:", { lat: plantLat, lng: plantLng })

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

          plantMarker.bindPopup(`<b>${puntoInicio.nombre}</b><br>Planta de origen<br>Ruta ID: ${routeId}`).openPopup()
          markers.push(plantMarker)
          routePoints.push([plantLat, plantLng])
          console.log("✓ Marcador de planta agregado:", puntoInicio.nombre)
        }
      }
    } else {
      console.warn("coordenadas_inicio_json está vacío, null o undefined")
    }

    // 2. Agregar puntos de empresas
    if (
      routeDetails.coordenadas_ruta_json &&
      routeDetails.coordenadas_ruta_json !== null &&
      routeDetails.coordenadas_ruta_json !== "null" &&
      routeDetails.coordenadas_ruta_json !== ""
    ) {
      console.log("Parseando coordenadas de ruta...")
      const coordenadasRuta = JSON.parse(routeDetails.coordenadas_ruta_json)
      console.log("Coordenadas de ruta parseadas:", coordenadasRuta)

      if (coordenadasRuta && Array.isArray(coordenadasRuta) && coordenadasRuta.length > 0) {
        // Ordenar por orden si existe
        coordenadasRuta.sort((a, b) => (a.punto.orden || 0) - (b.punto.orden || 0))

        coordenadasRuta.forEach((coordenada, index) => {
          const punto = coordenada.punto
          const companyLat = Number.parseFloat(punto.latitud)
          const companyLng = Number.parseFloat(punto.longitud)

          console.log(`Empresa ${index + 1}:`, {
            nombre: punto.nombre,
            lat: companyLat,
            lng: companyLng,
            orden: punto.orden,
          })

          if (!isNaN(companyLat) && !isNaN(companyLng)) {
            const companyMarker = L.marker([companyLat, companyLng], {
              icon: L.icon({
                iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              }),
            }).addTo(map)

            companyMarker.bindPopup(
              `<b>${punto.nombre}</b><br>Empresa destino<br>Orden: ${punto.orden || index + 1}<br>Ruta ID: ${routeId}`,
            )
            markers.push(companyMarker)
            routePoints.push([companyLat, companyLng])
            console.log("✓ Marcador de empresa agregado:", punto.nombre)
          }
        })
      }
    } else {
      console.warn("coordenadas_ruta_json está vacío, null o undefined")
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
<<<<<<< HEAD
    const routeToEdit = allRoutes.find(r => r.id_ruta === routeId);
    if (routeToEdit) {
        alert(`Editar ruta: ${routeToEdit.nombre_ruta} (ID: ${routeId})`);
        // Here you would typically open a modal or navigate to an edit page
        // and pre-fill a form with routeToEdit data.
        console.log("Ruta a editar:", routeToEdit);
    }
}
window.editRoute = editRoute; // Make it globally accessible

// Clear selected route and map display
function clearSelection() {
    selectedRoute = null;
    addMarkersToMap(); // Clears markers and line from map
    document.querySelectorAll('.route-card').forEach(card => {
        card.classList.remove('selected');
    });
=======
  const routeToEdit = allRoutes.find((r) => r.id === routeId)
  if (routeToEdit) {
    alert(`Editar ruta: ${routeToEdit.nombre} (ID: ${routeId})`)
    console.log("Ruta a editar:", routeToEdit)
  }
}
window.editRoute = editRoute

// Clear selected route and map display
function clearSelection() {
  selectedRoute = null
  routeDetails = null
  addMarkersToMapFromDetails() // Esto limpiará el mapa ya que routeDetails será null
  document.querySelectorAll(".route-card").forEach((card) => {
    card.classList.remove("selected")
  })
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078
}

// Filter routes based on search term and current filter
function filterRoutes(searchTerm = "") {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    filteredRoutes = allRoutes.filter((route) => {
        const matchesSearch =
            (route.nombre_ruta || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (route.descripcion_ruta || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (route.nombre_planta || '').toLowerCase().includes(lowerCaseSearchTerm);

        // Check companies in the route
        let empresas = [];
        try {
            empresas = JSON.parse(route.empresas_json);
        } catch (e) {
            console.error("Error parsing empresas_json for filter", route.id_ruta, e);
        }

        const matchesCompany = empresas.some(empresaData =>
            (empresaData.empresa.nombre || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (empresaData.empresa.direccion || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (empresaData.empresa.contenedores || []).some(cData =>
                (cData.contenedor.descripcion || '').toLowerCase().includes(lowerCaseSearchTerm) ||
                (cData.contenedor.tipo_residuo || '').toLowerCase().includes(lowerCaseSearchTerm)
            )
        );

        const matchesFilter =
            currentFilter === "all" ||
            (route.estado_ruta || '').toLowerCase() === currentFilter;

        return (matchesSearch || matchesCompany) && matchesFilter;
    });
    renderRouteCards();
    // No need to call addMarkersToMap here, as it's typically called when a route is *selected*.
    // If you want markers for ALL filtered routes visible by default, you would need different logic.
}
<<<<<<< HEAD
window.filterRoutes = filterRoutes; // Make it globally accessible for onkeyup in HTML


// Handle filter button clicks
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            // Update active button
            filterButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            // Update filter
            currentFilter = btn.dataset.filter;

            // Clear selection and update
            clearSelection();
            filterRoutes(document.getElementById('searchInput').value); // Re-apply search term with new filter
        });
    });
=======
window.filterRoutes = filterRoutes

// Handle filter button clicks
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      currentFilter = btn.dataset.filter
      clearSelection()
      const searchInput = document.querySelector(".search-input")
      filterRoutes(searchInput ? searchInput.value : "")
    })
  })
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078
}

// Update stats based on routes
function updateStatsBasedOnRoutes(routes) {
    let active = 0;
    let completed = 0;
    let delayed = 0;
    let scheduled = 0;
    
    // Asumo que 'hoy' se refiere al día actual para 'completedToday'
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    routes.forEach(route => {
        const status = (route.estado_ruta || '').toLowerCase();
        if (status === 'activa') {
            active++;
        } else if (status === 'completada') {
            completed++;
            // Lógica para 'completadas hoy' - necesitarías un campo de fecha de finalización
            // if (route.fecha_finalizacion && route.fecha_finalizacion.startsWith(today)) {
            //     completedToday++;
            // }
        } else if (status === 'retrasada') {
            delayed++;
        } else if (status === 'pendiente') {
            scheduled++;
        }
    });

    // Actualiza los elementos HTML
    document.getElementById("activeRoutes").textContent = active;
    document.getElementById("completedToday").textContent = completed; // Podría ser '0' si no hay lógica de fecha de finalización
    document.getElementById("delayedRoutes").textContent = delayed;
    document.getElementById("scheduledRoutes").textContent = scheduled;
    document.getElementById("avgTime").textContent = "N/A"; // Calcular si tienes los datos de tiempo de ruta
}

// API Integration Functions
async function loadData() {
    showLoadingOverlay(); // Show loading overlay before fetching data
    try {
        const apiResponse = await getRutasDetalladas(); // Assuming this is your actual API call
        console.log("Respuesta de la API para rutas:", apiResponse);

<<<<<<< HEAD
        if (apiResponse && apiResponse.status === 0 && Array.isArray(apiResponse.data)) {
            allRoutes = apiResponse.data;
            filterRoutes(); // Initial rendering with all data
=======
    await loadUsersOnly() // Solo cargar usuarios, ya no necesitamos ubicaciones
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078

            // Calcula estadísticas a partir de 'allRoutes'
            updateStatsBasedOnRoutes(allRoutes);
            
            // Renderiza alertas (si tienes un array de alertas separado en la respuesta o calculas desde rutas)
            // Por ahora, un placeholder
            // renderAlerts([]); // Pasa tu array real de alertas aquí
            
            console.log("Datos cargados y renderizados.");
        } else {
            console.error("Formato de respuesta de la API inesperado o error:", apiResponse);
            allRoutes = [];
            filteredRoutes = [];
            document.getElementById("routeListContent").innerHTML = "<p class='text-center text-red-500'>No se pudieron cargar las rutas. Intente de nuevo más tarde.</p>";
        }
    } catch (error) {
        console.error("Error al cargar rutas desde la API:", error);
        allRoutes = [];
        filteredRoutes = [];
        document.getElementById("routeListContent").innerHTML = "<p class='text-center text-red-500'>Error de red al cargar rutas. Verifique su conexión o intente de nuevo.</p>";
    } finally {
        hideLoadingOverlay(); // Hide loading overlay after data is loaded or error occurs
    }
<<<<<<< HEAD
}

async function refreshData() {
  await loadData();
  // Al recargar, si había una ruta seleccionada, la volvemos a seleccionar para que se muestre en el mapa.
  if (selectedRoute) {
    const updatedRoute = allRoutes.find((r) => r.id_ruta === selectedRoute.id_ruta);
    if (updatedRoute) {
      showRouteDetails(updatedRoute.id_ruta); // Vuelve a mostrar detalles y marcadores de la ruta
    } else {
      clearSelection(); // Si la ruta ya no existe, limpia la selección
=======
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

async function loadUsersOnly() {
  try {
    const usuariosResponse = await getUsuarios()
    if (usuariosResponse && usuariosResponse.status === 0) {
      // Cambiar esta línea para usar la estructura correcta
      usuariosList = usuariosResponse.usuarios || usuariosResponse.data
      console.log("Usuarios cargados:", usuariosResponse)
      console.log("Lista de usuarios final:", usuariosList)
    }
  } catch (error) {
    console.error("Error loading users:", error)
  }
}

async function refreshData() {
  await loadData()
  if (selectedRoute && routeDetails) {
    const updatedRoute = allRoutes.find((r) => r.id === selectedRoute.id)
    if (updatedRoute) {
      showRouteDetails(updatedRoute.id)
    } else {
      clearSelection()
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078
    }
  }
}

<<<<<<< HEAD

// General Modal Functions (assuming you have these in a shared script or similar)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error(`Modal con ID '${modalId}' no encontrado.`);
    }
}

=======
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error(`Modal con ID '${modalId}' no encontrado.`);
    }
}
<<<<<<< HEAD
window.closeModal = closeModal; // Make it global for onclick in HTML

// Loading Overlay Functions
function showLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove("hidden");
        // Asegúrate de que el overlay sea visible
        loadingOverlay.style.opacity = '1';
        loadingOverlay.style.pointerEvents = 'auto';
    }
}

function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
        // Permite que el CSS de transición haga su trabajo para el fade
        // Después de un pequeño retraso, quita pointer-events
        setTimeout(() => {
            if (loadingOverlay.classList.contains("hidden")) {
                loadingOverlay.style.pointerEvents = 'none';
            }
        }, 300); // Coincide con la duración de la transición CSS
    }
=======
window.closeModal = closeModal

// Loading Overlay Functions
function showLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden")
    loadingOverlay.style.opacity = "1"
    loadingOverlay.style.pointerEvents = "auto"
  }
}

function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden")
    setTimeout(() => {
      if (loadingOverlay.classList.contains("hidden")) {
        loadingOverlay.style.pointerEvents = "none"
      }
    }, 300)
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
          </select>
        </div>

        <div class="form-buttons">
          <button type="button" id="cancelarRutaBtn">Cancelar</button>
          <button type="submit" id="crearRutaBtn">Crear Ruta</button>
        </div>
      </form>
      
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

  document.getElementById("routeNameError").textContent = ""
  document.getElementById("routeDescriptionError").textContent = ""
  document.getElementById("plantSelectError").textContent = ""
  document.getElementById("companiesSelectError").textContent = ""
  document.getElementById("userSelectError").textContent = ""
}

// Load plants and companies data
async function loadPlantsAndCompanies() {
  try {
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
      const [plantasResponse, empresasResponse, usuariosResponse] = await Promise.all([
        getPlantas(),
        getEmpresas(),
        getUsuarios(),
      ])

      console.log("Plantas response:", plantasResponse)
      console.log("Empresas response:", empresasResponse)
      console.log("Usuarios response:", usuariosResponse)

      if (plantasResponse && plantasResponse.status === 0 && Array.isArray(plantasResponse.data)) {
        plantasList = plantasResponse.data
        populatePlantsSelect()
      } else {
        plantSelect.innerHTML = '<option value="">Error cargando plantas</option>'
        console.error("Error en respuesta de plantas:", plantasResponse)
      }

      if (empresasResponse && empresasResponse.status === 0 && Array.isArray(empresasResponse.data)) {
        empresasList = empresasResponse.data
        populateCompaniesSelect()
      } else {
        companiesSelect.innerHTML = '<option value="">Error cargando empresas</option>'
        console.error("Error en respuesta de empresas:", empresasResponse)
      }

      if (usuariosResponse && usuariosResponse.status === 0 && Array.isArray(usuariosResponse.usuarios)) {
        usuariosList = usuariosResponse.usuarios
        populateUsersSelect()
      } else {
        userSelect.innerHTML = '<option value="">Error cargando usuarios</option>'
        console.error("Error en respuesta de usuarios:", usuariosResponse)
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
  userSelect.innerHTML = '<option value="">Selecciona un recolector</option>'
  usuariosList
    .filter((usuario) => usuario.tipoUsuario.toLowerCase() === "recolector")
    .forEach((usuario) => {
      const option = document.createElement("option")
      option.value = usuario.idUsuario
      option.textContent = `${usuario.nombre} ${usuario.primerApellido} ${usuario.segundoApellido}`
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

  if (selectedCompanies.find((c) => c.id === companyId)) {
    return
  }

  selectedCompanies.push({ id: companyId, nombre: companyName })
  updateSelectedCompaniesList()
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

  if (!formData.routeName.trim()) {
    document.getElementById("routeNameError").textContent = "El nombre de la ruta es requerido"
    isValid = false
  } else {
    document.getElementById("routeNameError").textContent = ""
  }

  if (!formData.plantSelect) {
    document.getElementById("plantSelectError").textContent = "Debe seleccionar una planta"
    isValid = false
  } else {
    document.getElementById("plantSelectError").textContent = ""
  }

  if (selectedCompanies.length === 0) {
    document.getElementById("companiesSelectError").textContent = "Debe seleccionar al menos una empresa"
    isValid = false
  } else {
    document.getElementById("companiesSelectError").textContent = ""
  }

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
    const nuevaRuta = {
      nombreRuta: routeData.routeName,
      fechaCreacion: new Date().toISOString(),
      descripcion: routeData.routeDescription || "",
      estado: routeData.routeStatus,
      idUsuarioAsignado: Number(routeData.userSelect),
      progresoRuta: 0,
    }

    const result = await postRutas(nuevaRuta)

    if (!result || result.status !== 0) {
      throw new Error(result.message || "No se pudo obtener el ID de la ruta creada")
    }

    const idRuta = result.data?.id

    if (!idRuta) {
      throw new Error("No se pudo obtener el ID de la ruta creada")
    }

    const plantaData = {
      idRuta: Number(idRuta),
      idPlanta: Number(routeData.plantSelect),
    }

    console.log("Planta a asociar:", plantaData)
    await postRutasPlantas(plantaData)

    console.log("Empresas seleccionadas global:", selectedCompanies)

    if (selectedCompanies.length === 0) {
      throw new Error("No se seleccionó ninguna empresa para la ruta")
    }

    for (let i = 0; i < selectedCompanies.length; i++) {
      const empresaData = {
        idRuta: Number(idRuta),
        idEmpresa: Number(selectedCompanies[i].id),
        orden: i + 1,
      }
      console.log("Enviando empresa:", empresaData)
      await postRutasEmpresas(empresaData)
    }

    document.getElementById("routeLoadingMessage").style.display = "none"
    document.getElementById("routeSuccessMessage").style.display = "block"
    document.getElementById("routeSuccessText").textContent = "¡Ruta creada exitosamente!"

    await loadData()

    setTimeout(() => {
      closeNewRouteModal()
    }, 2000)
  } catch (error) {
    document.getElementById("routeLoadingMessage").style.display = "none"
    document.getElementById("routeErrorMessage").style.display = "block"
    document.getElementById("routeErrorText").textContent = error.message || "Error al conectar con el servidor"
    console.error("Error al crear ruta:", error)
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
window.showRouteDetails = showRouteDetails
window.editRoute = editRoute
window.filterRoutes = filterRoutes
window.clearSelection = clearSelection
window.refreshData = refreshData
window.removeSelectedCompany = removeSelectedCompany

// Declare handleNewRouteSubmit function
function handleNewRouteSubmit(e) {
  console.error("handleNewRouteSubmit function is not implemented.")
  e.preventDefault()
>>>>>>> 7ea1dac2de1c380509226221bb798537a82a6078
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
<<<<<<< HEAD
    // Get reference to the loading overlay early
    loadingOverlay = document.getElementById("loadingOverlay");

   

    initializeMap(); // Initialize map on page load
    loadData(); // Load data from API

    // Setup filter buttons
    setupFilterButtons();

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
