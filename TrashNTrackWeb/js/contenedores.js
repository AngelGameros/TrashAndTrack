// contenedores.js - Cleaned version for your API structure
import { getContenedores } from "../DataConnection/Gets.js" // Assuming Gets.js is in a sibling directory

let containers = []

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A"
  try {
    // Your date format: "08/07/2025 12:00:00 a. m."
    // For display, we can just return it as is, or parse if needed for different formats.
    return dateString
  } catch (e) {
    console.error("Error formatting date:", dateString, e)
    return "N/A"
  }
}

// Function to update the statistics cards in the HTML
function updateStatsCards(allContainers) {
  const totalContainers = allContainers.length

  // Count by empresa
  const empresaCounts = {}
  allContainers.forEach((container) => {
    const empresa = container.idEmpresa || "Sin empresa"
    empresaCounts[empresa] = (empresaCounts[empresa] || 0) + 1
  })

  // Update HTML elements
  // Ensure these elements exist in your HTML
  const totalElement = document.querySelector(".stat-card .stat-number.total")
  if (totalElement) totalElement.textContent = totalContainers

  // Example for specific empresa counts (adjust based on your actual empresa IDs/names)
  const empresa1Element = document.querySelector(".stat-card .stat-number.empresa1")
  if (empresa1Element) empresa1Element.textContent = empresaCounts[1] || 0 // Assuming idEmpresa 1

  const empresa2Element = document.querySelector(".stat-card .stat-number.empresa2")
  if (empresa2Element) empresa2Element.textContent = empresaCounts[2] || 0 // Assuming idEmpresa 2

  // You might want to dynamically create or update more stat cards if you have many companies
}

async function renderContainers(filteredContainers = null) {
  const containersGrid = document.getElementById("containersGrid")
  if (!containersGrid) {
    console.error("Element with ID 'containersGrid' not found.")
    return
  }
  containersGrid.innerHTML = ""

  if (!filteredContainers) {
    try {
      const apiResponse = await getContenedores()
      // Correctly extract data from the 'data' property
      if (apiResponse && Array.isArray(apiResponse.data)) {
        containers = apiResponse.data
      } else {
        console.error("API response is invalid or 'data' property is missing/not an array:", apiResponse)
        containers = []
      }
    } catch (error) {
      console.error("Error al cargar contenedores desde la API:", error)
      containersGrid.innerHTML =
        '<p class="text-red-500 text-center col-span-full">Error al cargar contenedores. Intente de nuevo más tarde.</p>'
      return
    }
  }

  const containersToRender = filteredContainers || containers

  if (!containersToRender || containersToRender.length === 0) {
    containersGrid.innerHTML =
      '<p class="text-gray-500 text-center col-span-full">No hay contenedores registrados que coincidan con la búsqueda.</p>'
    updateStatsCards(containers) // Update stats even if no filtered containers
    return
  }

    containersToRender.forEach(container => {
        // Calcular el nivel de llenado real y sus clases para la barra y la cabecera
        const currentWeight = container.values && container.values.weight_kg !== undefined && container.values.weight_kg !== null ? container.values.weight_kg : null;
        const maxWeight = container.maxWeight_kg !== undefined && container.maxWeight_kg !== null ? container.maxWeight_kg : null;

        const fillLevelRaw = calculateFillLevel(currentWeight, maxWeight);
        const fillLevelNumeric = parseInt(fillLevelRaw); // Para el width de la barra

        let statusClassHeader = 'status-offline'; // Clase por defecto para el span de status en la cabecera
        let fillProgressClass = 'offline'; // Clase por defecto para la barra de progreso y la tarjeta principal

        if (!isNaN(fillLevelNumeric)) {
            if (fillLevelNumeric >= 76) {
                statusClassHeader = 'status-full';
                fillProgressClass = 'full';
            } else if (fillLevelNumeric >= 26) {
                statusClassHeader = 'status-medium';
                fillProgressClass = 'medium';
            } else {
                statusClassHeader = 'status-empty';
                fillProgressClass = 'empty';
            }
        }
        
        // Obtener valores reales de las métricas si existen
        const temperature = container.values && container.values.temperature_C !== undefined && container.values.temperature_C !== null ? `${container.values.temperature_C.toFixed(1)}°C` : 'N/A';
        // Usamos el status general del contenedor como "Estado" o puedes tener un campo específico para "Estado sensor"
        const sensorStatus = container.status || 'N/A'; 

        const containerCard = document.createElement('div');
        // La clase de la tarjeta principal ahora usa fillProgressClass para su estilo general
        containerCard.className = `container-card ${fillProgressClass}`;
        containerCard.innerHTML = `
            <div class="container-header">
                <span class="container-id">${container.deviceID || 'N/A'}</span>
                <span class="container-status ${statusClassHeader}">${statusClassHeader.replace('status-', '')}</span>
            </div>
            <div class="container-info">
                <strong>Tipo:</strong> ${container.type || 'N/A'}<br>
                <strong>Descripción:</strong> ${container.name || 'N/A'}<br>
                <strong>Fecha Última Actualización:</strong> ${formatDate(container.lastUpdated) || 'N/A'}
                <br><strong>Peso Actual:</strong> ${currentWeight !== null ? `${currentWeight.toFixed(2)} kg` : 'N/A'}
                <br><strong>Peso Máximo:</strong> ${maxWeight !== null ? `${maxWeight.toFixed(2)} kg` : 'N/A'}
            </div>
            <div class="fill-level">
                <div class="fill-bar">
                    <div class="fill-progress ${fillProgressClass}" style="width: ${isNaN(fillLevelNumeric) ? 0 : fillLevelNumeric}%"></div>
                </div>
                <div class="fill-text">${fillLevelRaw} lleno</div>
            </div>
            <div style="font-size:12px; margin-top:6px;">Nivel: ${fillLevelRaw}</div>
        </div>
    </div>
`;

    containersGrid.appendChild(containerCard);
});

document.querySelectorAll('.svg-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
        const index = e.currentTarget.getAttribute('data-index');
        const c = containersToRender[index];

        const currentWeight = c.values?.weight_kg ?? null;
        const maxWeight = c.maxWeight_kg ?? null;
        const temperature = c.values?.temperature_C ?? null;
        const fillLevel = calculateFillLevel(currentWeight, maxWeight);

        document.getElementById('modalNombre').textContent = c.name || 'N/A';
        document.getElementById('modalTipo').textContent = c.type || 'N/A';
        
        document.getElementById('modalPeso').textContent = currentWeight !== null ? `${currentWeight.toFixed(2)} kg` : 'N/A';
        document.getElementById('modalMaximo').textContent = maxWeight !== null ? `${maxWeight.toFixed(2)} kg` : 'N/A';
        document.getElementById('modalTemperatura').textContent = temperature !== null ? `${temperature.toFixed(1)} °C` : 'N/A';
        document.getElementById('modalPorcentaje').textContent = fillLevel;

        document.getElementById('modalContenedor').classList.remove('hidden');
    });
});



    attachButtonListeners();
    // Call updateStatsCards AFTER containers array has been populated/filtered
    updateStatsCards(filteredContainers || containers);
}

// Attach event listeners to buttons
function attachButtonListeners() {
  document.querySelectorAll(".btn-view").forEach((button) => {
    button.onclick = (event) => {
      const containerId = event.target.dataset.id
      showViewContainerModal(containerId)
    }
  })

  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.onclick = (event) => {
      const containerId = event.target.dataset.id
      showEditContainerModal(containerId)
    }
  })
}

// Show Container Details Modal
function showViewContainerModal(containerId) {
  const container = containers.find((c) => c.id == containerId)

  if (!container) {
    console.error("Contenedor no encontrado:", containerId)
    return
  }

  const detailsDiv = document.getElementById("viewContainerDetails")
  if (!detailsDiv) {
    console.error("Element with ID 'viewContainerDetails' not found.")
    return
  }
  detailsDiv.innerHTML = `
        <div class="modal-info-row">
            <span class="modal-info-label">ID:</span>
            <span class="modal-info-value">${container.id || "N/A"}</span>
        </div>
        <div class="modal-info-row">
            <span class="modal-info-label">Descripción:</span>
            <span class="modal-info-value">${container.descripcion || "N/A"}</span>
        </div>
        <div class="modal-info-row">
            <span class="modal-info-label">Fecha Registro:</span>
            <span class="modal-info-value">${formatDate(container.fechaRegistro)}</span>
        </div>
        <div class="modal-info-row">
            <span class="modal-info-label">ID Empresa:</span>
            <span class="modal-info-value">${container.idEmpresa ?? "N/A"}</span>
        </div>
        <div class="modal-info-row">
            <span class="modal-info-label">ID Tipo Residuo:</span>
            <span class="modal-info-value">${container.idTipoResiduo ?? "N/A"}</span>
        </div>
        <div class="modal-info-row">
            <span class="modal-info-label">ID Tipo Contenedor:</span>
            <span class="modal-info-value">${container.idTipoContenedor ?? "N/A"}</span>
        </div>
    `
  const viewModal = document.getElementById("viewContainerModal")
  if (viewModal) viewModal.classList.remove("hidden")
}

// Show Edit Container Modal
function showEditContainerModal(containerId) {
  const container = containers.find((c) => c.id == containerId)

  if (!container) {
    console.error("Contenedor no encontrado para editar:", containerId)
    return
  }

  // Ensure these elements exist in your HTML
  const editContainerId = document.getElementById("editContainerId")
  const editDescripcion = document.getElementById("editDescripcion")
  const editFechaRegistro = document.getElementById("editFechaRegistro")
  const editIdEmpresa = document.getElementById("editIdEmpresa")
  const editIdTipoResiduo = document.getElementById("editIdTipoResiduo")
  const editIdTipoContenedor = document.getElementById("editIdTipoContenedor")

  if (editContainerId) editContainerId.value = container.id || ""
  if (editDescripcion) editDescripcion.value = container.descripcion || ""
  if (editFechaRegistro) editFechaRegistro.value = container.fechaRegistro || ""
  if (editIdEmpresa) editIdEmpresa.value = container.idEmpresa || ""
  if (editIdTipoResiduo) editIdTipoResiduo.value = container.idTipoResiduo || ""
  if (editIdTipoContenedor) editIdTipoContenedor.value = container.idTipoContenedor || ""

  const editModal = document.getElementById("editContainerModal")
  if (editModal) editModal.classList.remove("hidden")
}

// Handle Edit Container Form Submission
document.getElementById("editContainerForm")?.addEventListener("submit", async (event) => {
  event.preventDefault()

  const updatedData = {
    id: document.getElementById("editContainerId")?.value,
    descripcion: document.getElementById("editDescripcion")?.value,
    fechaRegistro: document.getElementById("editFechaRegistro")?.value,
    idEmpresa: Number.parseInt(document.getElementById("editIdEmpresa")?.value || "0"),
    idTipoResiduo: Number.parseInt(document.getElementById("editIdTipoResiduo")?.value || "0"),
    idTipoContenedor: Number.parseInt(document.getElementById("editIdTipoContenedor")?.value || "0"),
  }

  console.log("Datos para actualizar:", updatedData)

  // Here you would make your API call to update the container
  // Example: await updateContenedor(updatedData); // You need to implement updateContenedor in Gets.js or similar

  closeModal("editContainerModal")
  renderContainers() // Re-render to reflect changes
})

// Function to close any modal
function closeModal(modalId) {
  const modalElement = document.getElementById(modalId)
  if (modalElement) {
    modalElement.classList.add("hidden")
  }
}
window.closeModal = closeModal

// Handle Search
async function handleContainerSearch() {
  const searchTerm = document.getElementById("searchInput")?.value.toLowerCase().trim()

  if (searchTerm === "") {
    renderContainers() // Show all containers if search is empty
    return
  }

  const filteredContainers = containers.filter((container) => {
    return (
      (container.id && container.id.toString().toLowerCase().includes(searchTerm)) ||
      (container.descripcion && container.descripcion.toLowerCase().includes(searchTerm)) ||
      (container.idEmpresa && container.idEmpresa.toString().includes(searchTerm)) ||
      (container.idTipoResiduo && container.idTipoResiduo.toString().includes(searchTerm)) ||
      (container.idTipoContenedor && container.idTipoContenedor.toString().includes(searchTerm))
    )
  })
  renderContainers(filteredContainers)
}
window.handleContainerSearch = handleContainerSearch

// New Container Button
document.getElementById("newContainerBtn")?.addEventListener("click", () => {
  alert("Funcionalidad para 'Nuevo Contenedor' no implementada.")
})

// Load containers when window loads
window.onload = () => {
  renderContainers()
}
