// rutas.js
import { getRutasDetalladas } from '../DataConnection/Gets.js'; // Importa la función para obtener rutas detalladas

// Global Variables
let map;
let selectedRoute = null;
let currentFilter = "all";
let markers = [];
let routeLine = null;
let allRoutes = [];
let filteredRoutes = [];
let loadingOverlay = null; // Reference to the loading overlay

// Initialize Map
function initializeMap() {
    console.log("Intentando inicializar el mapa...");
    const mapElement = document.getElementById("routeMap");
    if (mapElement) {
        console.log("Elemento #routeMap encontrado.");
        if (map) { // Destroy existing map if it was already initialized
            map.remove();
            console.log("Mapa existente removido.");
        }
        // Centered near Baja California, zoomed out
        map = L.map("routeMap").setView([29.5, -114.5], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        console.log("Mapa inicializado correctamente.");

        // Invalidate map size after initialization to ensure it renders properly
        map.invalidateSize();
        console.log("map.invalidateSize() llamado.");
    } else {
        console.error("Error: Elemento 'routeMap' no encontrado para inicializar el mapa.");
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
        // Parse the JSON strings for companies
        let empresas = [];
        try {
            empresas = JSON.parse(route.empresas_json);
        } catch (e) {
            console.error("Error parsing empresas_json for route", route.id_ruta, e);
        }

        const routeCard = document.createElement("div");
        routeCard.className = "route-card";
        routeCard.dataset.routeId = route.id_ruta; // Store route ID

        // Determine status class
        const statusClass = (route.estado_ruta || 'desconocido').toLowerCase().replace(' ', '-');

        let companiesHtml = "";
        if (empresas.length > 0) {
            empresas.forEach((empresaData) => {
                const empresa = empresaData.empresa;
                companiesHtml += `
                    <div class="company-item">
                        <i class="fas fa-industry"></i>
                        <span>${empresa.nombre || 'Nombre de Empresa Desconocido'}</span>
                    </div>
                `;
            });
        } else {
            companiesHtml = '<p class="text-sm text-gray-400">No hay empresas asignadas.</p>';
        }

        routeCard.innerHTML = `
            <div class="route-header">
                <h3>${route.nombre_ruta || 'Ruta sin Nombre'}</h3>
                <span class="route-status status-${statusClass}">${route.estado_ruta || 'Desconocido'}</span>
            </div>
            <div class="route-details">
                <p><i class="fas fa-info-circle"></i> ${route.descripcion_ruta || 'Sin descripción'}</p>
                <p><i class="fas fa-calendar-alt"></i> Creada: ${formatDate(route.fecha_creacion)}</p>
                <p><i class="fas fa-warehouse"></i> Planta: ${route.nombre_planta || 'N/A'}</p>
                <div class="route-companies">
                    <h4>Empresas en la ruta:</h4>
                    ${companiesHtml}
                </div>
            </div>
            <div class="route-actions">
                <button class="btn btn-small btn-view" onclick="showRouteDetails(${route.id_ruta})">Ver Detalles</button>
                <button class="btn btn-small btn-edit" onclick="editRoute(${route.id_ruta})">Editar</button>
            </div>
        `;
        routeListContent.appendChild(routeCard);
    });
}

// Add markers and draw route line on the map
function addMarkersToMap() {
    // Clear existing markers and lines
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    if (selectedRoute) {
        const routePoints = [];

        // Add plant marker from route object directly
        if (selectedRoute.latitud_planta && selectedRoute.longitud_planta) {
            const plantLat = parseFloat(selectedRoute.latitud_planta);
            const plantLng = parseFloat(selectedRoute.longitud_planta);
            // Validar si las coordenadas son números válidos antes de usarlas
            if (!isNaN(plantLat) && !isNaN(plantLng)) {
                const plantMarker = L.marker([plantLat, plantLng], { icon: L.icon({
                    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })}).addTo(map);
                plantMarker.bindPopup(`<b>${selectedRoute.nombre_planta || 'Planta'}</b>`).openPopup();
                markers.push(plantMarker);
                routePoints.push([plantLat, plantLng]);
            } else {
                console.warn(`Coordenadas de planta inválidas para ruta ${selectedRoute.id_ruta}: Lat ${selectedRoute.latitud_planta}, Lng ${selectedRoute.longitud_planta}`);
            }
        }

        // Add company markers from parsed 'coordenadas_ruta_json'
        let coordenadasRuta = [];
        try {
            coordenadasRuta = JSON.parse(selectedRoute.coordenadas_ruta_json);
        } catch (e) {
            console.error("Error parsing coordenadas_ruta_json for selected route", selectedRoute.id_ruta, e);
        }

        coordenadasRuta.forEach(coordData => {
            const punto = coordData.punto;
            if (punto && punto.latitud && punto.longitud) {
                const companyLat = parseFloat(punto.latitud);
                const companyLng = parseFloat(punto.longitud);
                // Validar si las coordenadas son números válidos
                if (!isNaN(companyLat) && !isNaN(companyLng)) {
                    const companyMarker = L.marker([companyLat, companyLng]).addTo(map);
                    companyMarker.bindPopup(`<b>${punto.nombre || 'Empresa'}</b>`).openPopup();
                    markers.push(companyMarker);
                    routePoints.push([companyLat, companyLng]);
                } else {
                    console.warn(`Coordenadas de empresa inválidas en coordenadas_ruta_json para ruta ${selectedRoute.id_ruta}: Lat ${punto.latitud}, Lng ${punto.longitud}`);
                }
            }
        });

        // Draw polyline
        if (routePoints.length > 1) {
            routeLine = L.polyline(routePoints, { color: "blue" }).addTo(map);
            map.fitBounds(routeLine.getBounds(), { padding: [50, 50] }); // Zoom to fit the route with some padding
        } else if (routePoints.length === 1) {
            map.setView(routePoints[0], 12); // If only one point, just center the map there
        }
    } else {
        // Default view if no route is selected (e.g., center on Baja California)
        map.setView([29.5, -114.5], 6);
    }
}


// Show route details (select a route and update map)
function showRouteDetails(routeId) {
    selectedRoute = allRoutes.find((route) => route.id_ruta === routeId);
    if (selectedRoute) {
        console.log("Ruta Seleccionada:", selectedRoute);
        addMarkersToMap(); // Update map for the selected route
        // Highlight the selected card
        document.querySelectorAll('.route-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`.route-card[data-route-id="${routeId}"]`).classList.add('selected');

        // Populate and open the details modal
        populateViewRouteModal(selectedRoute);
        // Assuming 'viewRouteModal' exists in your HTML
        openModal('viewRouteModal');

    }
}

// Populate View Route Modal
function populateViewRouteModal(route) {
    document.getElementById('viewRouteName').textContent = route.nombre_ruta || 'N/A';
    document.getElementById('viewRouteDescription').textContent = route.descripcion_ruta || 'N/A';
    document.getElementById('viewRoutePlant').textContent = route.nombre_planta || 'N/A';
    document.getElementById('viewRouteStatus').textContent = route.estado_ruta || 'N/A';
    document.getElementById('viewRouteStatus').className = `status-badge ${(route.estado_ruta || 'desconocido').toLowerCase().replace(' ', '-')}-badge`;
    document.getElementById('viewRouteCreationDate').textContent = formatDate(route.fecha_creacion);

    const containersList = document.getElementById('viewRouteCompaniesAndContainers');
    if (!containersList) {
        console.error("Elemento 'viewRouteCompaniesAndContainers' no encontrado.");
        return;
    }
    containersList.innerHTML = ''; // Clear previous content

    let empresas = [];
    try {
        empresas = JSON.parse(route.empresas_json);
    } catch (e) {
        console.error("Error parsing empresas_json for view modal", route.id_ruta, e);
    }

    if (empresas.length > 0) {
        empresas.forEach(empresaData => {
            const empresa = empresaData.empresa;
            const companyDiv = document.createElement('div');
            companyDiv.className = 'company-detail-item';
            companyDiv.innerHTML = `
                <h4>Empresa: ${empresa.nombre || 'N/A'}</h4>
                <p>Dirección: ${empresa.direccion || 'N/A'}</p>
                <h5>Contenedores:</h5>
                <ul class="container-list">
                    ${(empresa.contenedores && empresa.contenedores.length > 0) ?
                        empresa.contenedores.map(cData => {
                            const contenedor = cData.contenedor;
                            return `<li>- ${contenedor.descripcion || 'N/A'} (Tipo: ${contenedor.tipo_contenedor || 'N/A'}, Capacidad: ${contenedor.capacidad_maxima || 'N/A'}kg)</li>`;
                        }).join('')
                        : '<li>No hay contenedores para esta empresa.</li>'}
                </ul>
            `;
            containersList.appendChild(companyDiv);
        });
    } else {
        containersList.innerHTML = '<li>No hay empresas ni contenedores asignados a esta ruta.</li>';
    }
}


// Edit route (placeholder function)
function editRoute(routeId) {
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
}

// NUEVA FUNCIÓN: Calcular y actualizar estadísticas basadas en las rutas
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

        if (apiResponse && apiResponse.status === 0 && Array.isArray(apiResponse.data)) {
            allRoutes = apiResponse.data;
            filterRoutes(); // Initial rendering with all data

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
    }
  }
}


// General Modal Functions (assuming you have these in a shared script or similar)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error(`Modal con ID '${modalId}' no encontrado.`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error(`Modal con ID '${modalId}' no encontrado.`);
    }
}
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
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Get reference to the loading overlay early
    loadingOverlay = document.getElementById("loadingOverlay");

   

    initializeMap(); // Initialize map on page load
    loadData(); // Load data from API

    // Setup filter buttons
    setupFilterButtons();

    // Set up the "Nueva Ruta" button
    const newRouteBtn = document.getElementById('newContainerBtn'); 
    if (newRouteBtn) {
        newRouteBtn.addEventListener('click', () => {
            alert('Funcionalidad para "Nueva Ruta" no implementada todavía.');
        });
    } else {
        console.warn("Elemento 'newContainerBtn' (Nueva Ruta) no encontrado.");
    }
});

// Expose functions to global scope if used in HTML attributes (though 'addEventListener' is preferred)
window.showRouteDetails = showRouteDetails; // Needs to be global for onclick in renderRouteCards
window.editRoute = editRoute; // Already global, keeping for consistency
window.filterRoutes = filterRoutes; // Already global
window.clearSelection = clearSelection; // Already global
window.refreshData = refreshData; // Using refreshData to handle re-selection after load