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

  containersToRender.forEach((container, index) => {
    const containerCard = document.createElement("div")
    containerCard.className = "container-svg-card"
    containerCard.innerHTML = `
        <div class="container-card" style="
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 16px;
            margin: 16px;
            text-align: center;
            transition: transform 0.2s;
        ">
            <div class="svg-clickable" data-id="${container.id}" style="cursor:pointer;">
                <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">
                    ${container.descripcion || "Sin descripción"}
                </div>
                
            <img src="../assets/contenedor.svg" alt="Contenedor" style="width:80px; height:auto; margin-bottom:12px;" />
                <div style="font-size:14px; margin-bottom:8px;">
                    <strong>ID:</strong> ${container.id || "N/A"}
                </div>
                <div style="font-size:14px; margin-bottom:8px;">
                    <strong>Fecha Registro:</strong> ${formatDate(container.fechaRegistro)}
                </div>
                <div style="font-size:14px; margin-bottom:8px;">
                    <strong>Empresa:</strong> ${container.idEmpresa ?? "N/A"}
                </div>
                <div style="font-size:14px; margin-bottom:8px;">
                    <strong>Tipo Residuo:</strong> ${container.idTipoResiduo ?? "N/A"}
                </div>
                <div style="font-size:14px;">
                    <strong>Tipo Contenedor:</strong> ${container.idTipoContenedor ?? "N/A"}
                </div>
                <div style="margin-top: 12px;">
                    <button class="btn-view" data-id="${container.id}" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        margin-right: 8px;
                        cursor: pointer;
                    ">Ver Detalles</button>
                    <button class="btn-edit" data-id="${container.id}" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Editar</button>
                </div>
            </div>
        </div>
        `
    containersGrid.appendChild(containerCard)
  })

  // Add click event for modal (using data-id for direct lookup)
  document.querySelectorAll(".svg-clickable").forEach((el) => {
    el.addEventListener("click", (e) => {
      const containerId = e.currentTarget.getAttribute("data-id")
      showViewContainerModal(containerId) // Use the existing showViewContainerModal
    })
  })

  attachButtonListeners()
  updateStatsCards(containersToRender)
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
