// contenedores.js
import { getContenedores } from '../DataConnection/Gets.js'; // Importa las funciones GET

let containers = []; // Array para almacenar los datos de los contenedores

// Helper function to format date
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return 'N/A';
    }
}

// Function to calculate fill level percentage based on weight
function calculateFillLevel(currentWeight_kg, maxWeight_kg) {
    if (currentWeight_kg === undefined || currentWeight_kg === null ||
        maxWeight_kg === undefined || maxWeight_kg === null ||
        maxWeight_kg <= 0) { // maxWeight_kg must be positive to avoid division by zero
        return 'N/A';
    }
    
    const fill = (currentWeight_kg / maxWeight_kg) * 100;
    
    // Aseguramos que el porcentaje esté entre 0 y 100.
    return Math.max(0, Math.min(100, fill.toFixed(0))) + '%';
}

// Function to get status class for styling (used for header status)
function getStatusClass(fillLevel) {
    if (fillLevel === 'N/A') return 'offline'; // Or a dedicated 'unknown' class
    const level = parseInt(fillLevel);
    if (isNaN(level)) return 'offline'; // Handle cases where fillLevel is not a number

    if (level >= 76) return 'full';
    if (level >= 26) return 'medium';
    return 'empty';
}


// Function to update the statistics cards in the HTML
function updateStatsCards(allContainers) {
    let emptyCount = 0;
    let mediumCount = 0;
    let fullCount = 0;
    let offlineCount = 0;
    let totalFillLevel = 0;
    let validContainersForAverage = 0;

    allContainers.forEach(container => {
        const currentWeight = container.values && container.values.weight_kg !== undefined && container.values.weight_kg !== null ? container.values.weight_kg : null;
        const maxWeight = container.maxWeight_kg !== undefined && container.maxWeight_kg !== null ? container.maxWeight_kg : null;
        
        const fillLevelRaw = calculateFillLevel(currentWeight, maxWeight);
        const fillLevelNumeric = parseInt(fillLevelRaw);

        if (isNaN(fillLevelNumeric)) {
            offlineCount++;
        } else {
            totalFillLevel += fillLevelNumeric;
            validContainersForAverage++;

            if (fillLevelNumeric >= 76) {
                fullCount++;
            } else if (fillLevelNumeric >= 26) {
                mediumCount++;
            } else {
                emptyCount++;
            }
        }
    });

    const averageFillLevel = validContainersForAverage > 0 ? (totalFillLevel / validContainersForAverage).toFixed(0) : 'N/A';

    // Update HTML elements
    document.querySelector('.stat-card .stat-number.empty').textContent = emptyCount;
    document.querySelector('.stat-card .stat-number.medium').textContent = mediumCount;
    document.querySelector('.stat-card .stat-number.full').textContent = fullCount;
    document.querySelector('.stat-card .stat-number.offline').textContent = offlineCount;
    document.querySelector('.stat-card:last-child .stat-number').textContent = `${averageFillLevel}%`; // Last card is average
}


// Render containers in the grid
async function renderContainers(filteredContainers = null) {
    const containersGrid = document.getElementById('containersGrid');
    containersGrid.innerHTML = ''; // Limpiar las tarjetas existentes

    if (!filteredContainers) {
        try {
            const apiResponse = await getContenedores(); // Fetch all containers from the API
            console.log("API Response for all containers:", apiResponse); // Debugging: Check the structure here

            // FIX: If apiResponse is directly an array, assign it.
            // Check if the response itself is an array.
            if (Array.isArray(apiResponse)) {
                containers = apiResponse;
            } else if (apiResponse && Array.isArray(apiResponse.contenedores)) {
                // This is a fallback for if it sometimes returns an object wrapper (like camiones)
                containers = apiResponse.contenedores;
            } else {
                console.error("API response for containers is not an array directly or under 'contenedores':", apiResponse);
                containers = []; // Ensure containers array is empty if response is bad
            }
        } catch (error) {
            console.error("Error al cargar contenedores desde la API:", error);
            containersGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Error al cargar contenedores. Intente de nuevo más tarde.</p>';
            return;
        }
    }

    const containersToRender = filteredContainers || containers;

    if (!containersToRender || containersToRender.length === 0) {
        containersGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay contenedores registrados que coincidan con la búsqueda.</p>';
        // Update stats cards even if no filtered containers
        updateStatsCards(containers); // Use the full list of containers for stats
        return;
    }

    containersToRender.forEach((container, index) => {
    const currentWeight = container.values?.weight_kg ?? null;
    const maxWeight = container.maxWeight_kg ?? null;
    const temperature = container.values?.temperature_C ?? null;

    const fillLevelRaw = calculateFillLevel(currentWeight, maxWeight);
    const fillLevelNumeric = parseInt(fillLevelRaw);

    const containerCard = document.createElement('div');
    containerCard.className = 'container-svg-card';
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
        <div class="svg-clickable" data-index="${index}" style="cursor:pointer;">
            <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">
                ${container.name || 'Sin nombre'}
            </div>
            <img src="../assets/contenedor.svg" alt="Contenedor" style="width:80px; height:auto; margin-bottom:12px;" />
            <div style="font-size:14px; margin-bottom:8px;">
                <strong>${temperature !== null ? temperature.toFixed(1) + "°C" : "N/A"}</strong>
            </div>

            <div style="width:80%; margin:10px auto; background:#eee; border-radius:4px; height:10px; overflow:hidden;">
                <div style="width:${fillLevelRaw}; height:100%; background-color:${
                    fillLevelNumeric >= 80 ? '#e74c3c' : fillLevelNumeric >= 50 ? '#f39c12' : '#2ecc71'
                }; transition: width 0.3s;"></div>
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

// Attach event listeners to "Ver Detalles" and "Editar" buttons
function attachButtonListeners() {
    document.querySelectorAll('.btn-view').forEach(button => {
        button.onclick = (event) => {
            const containerId = event.target.dataset.id;
            showViewContainerModal(containerId);
        };
    });

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.onclick = (event) => {
            const containerId = event.target.dataset.id;
            showEditContainerModal(containerId);
        };
    });
}

// Show Container Details Modal
async function showViewContainerModal(containerId) {
    // console.log("contenedores.js: Attempting to show details for containerId:", containerId); // Debugging
    let container = null;
    try {
        const apiResponse = await getContenedorById(containerId); // Fetch container details by ID from API
        // console.log("contenedores.js: Received raw API response for view modal:", apiResponse); // Debugging

        // Check if apiResponse is directly the container object (for getById)
        if (apiResponse && typeof apiResponse === 'object' && apiResponse.id === containerId) {
            container = apiResponse;
        } else if (apiResponse && apiResponse.contenedores && typeof apiResponse.contenedores === 'object' && apiResponse.contenedores.id === containerId) {
            // Fallback for if it's wrapped in 'contenedores' property
            container = apiResponse.contenedores;
        } else {
             console.error("API response for single container by ID is not as expected:", apiResponse);
        }
    } catch (error) {
        console.error("Error al obtener detalles del contenedor:", error);
    }

    // console.log("contenedores.js: Extracted container object for view modal:", container); // Debugging

    if (!container) {
        console.error("Contenedor no encontrado o datos no recibidos:", containerId);
        // Optionally display a user-friendly error message in the modal or on the page
        return;
    }

    // Recalcular fillLevel para el modal usando el peso
    const currentWeightModal = container.values && container.values.weight_kg !== undefined && container.values.weight_kg !== null ? container.values.weight_kg : null;
    const maxWeightModal = container.maxWeight_kg !== undefined && container.maxWeight_kg !== null ? container.maxWeight_kg : null;
    const fillLevelModal = calculateFillLevel(currentWeightModal, maxWeightModal);

    const lastUpdated = formatDate(container.lastUpdated);
    const isOpen = container.values && container.values.is_open ? 'Sí' : 'No';

    const detailsDiv = document.getElementById('viewContainerDetails');
    detailsDiv.innerHTML = `
        <div class="modal-info-row"><span class="modal-info-label">ID Contenedor:</span><span class="modal-info-value">${container.id || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Device ID:</span><span class="modal-info-value">${container.deviceID || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Client ID:</span><span class="modal-info-value">${container.clientID || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Nombre:</span><span class="modal-info-value">${container.name || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Estado:</span><span class="modal-info-value">${container.status || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Tipo:</span><span class="modal-info-value">${container.type || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Peso Máximo:</span><span class="modal-info-value">${maxWeightModal !== null ? `${maxWeightModal} kg` : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Última Actualización:</span><span class="modal-info-value">${lastUpdated}</span></div>
        <hr class="modal-divider">
        <div class="modal-info-row"><span class="modal-info-label">Temp. (°C):</span><span class="modal-info-value">${container.values && container.values.temperature_C !== undefined && container.values.temperature_C !== null ? container.values.temperature_C.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Humedad (%RH):</span><span class="modal-info-value">${container.values && container.values.humidity_RH !== undefined && container.values.humidity_RH !== null ? container.values.humidity_RH.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Calidad Aire (ppm):</span><span class="modal-info-value">${container.values && container.values.air_quality_ppm !== undefined && container.values.air_quality_ppm !== null ? container.values.air_quality_ppm.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Gas (ppm):</span><span class="modal-info-value">${container.values && container.values.gas_ppm !== undefined && container.values.gas_ppm !== null ? container.values.gas_ppm.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Distancia (cm):</span><span class="modal-info-value">${container.values && container.values.distance_cm !== undefined && container.values.distance_cm !== null ? container.values.distance_cm.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Peso Recolectado (kg):</span><span class="modal-info-value">${currentWeightModal !== null ? currentWeightModal.toFixed(2) : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Abierto:</span><span class="modal-info-value">${isOpen}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Veces Abierto:</span><span class="modal-info-value">${container.values && container.values.open_count !== undefined && container.values.open_count !== null ? container.values.open_count : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Nivel de Llenado:</span><span class="modal-info-value">${fillLevelModal}</span></div>
    `;
    document.getElementById('viewContainerModal').classList.remove('hidden');
}

// Show Edit Container Modal
async function showEditContainerModal(containerId) {
    // console.log("contenedores.js: Attempting to show edit modal for containerId:", containerId); // Debugging
    let container = null;
    try {
        const apiResponse = await getContenedorById(containerId);
        // console.log("contenedores.js: Received raw API response for edit modal:", apiResponse); // Debugging

        // Check if apiResponse is directly the container object (for getById)
        if (apiResponse && typeof apiResponse === 'object' && apiResponse.id === containerId) {
            container = apiResponse;
        } else if (apiResponse && apiResponse.contenedores && typeof apiResponse.contenedores === 'object' && apiResponse.contenedores.id === containerId) {
            // Fallback for if it's wrapped in 'contenedores' property
            container = apiResponse.contenedores;
        } else {
             console.error("API response for single container by ID is not as expected:", apiResponse);
        }
    } catch (error) {
        console.error("Error al obtener datos para edición del contenedor:", error);
    }

    // console.log("contenedores.js: Extracted container object for edit modal:", container); // Debugging

    if (!container) {
        console.error("Contenedor no encontrado para editar:", containerId);
        return;
    }

    document.getElementById('editContainerId').value = container.id || '';
    document.getElementById('editDescripcion').value = container.name || ''; // Assuming 'name' maps to 'Descripcion' for editing
    
    // Format lastUpdated for date input
    const lastUpdatedDate = container.lastUpdated ? new Date(container.lastUpdated).toISOString().split('T')[0] : '';
    document.getElementById('editFechaRegistro').value = lastUpdatedDate;

    // Populate dynamic select options for 'TipoResiduo' and 'TipoContenedor'
    // Ensure these options align with what your API expects for 'type'
    populateSelectOptions('editTipoResiduo', ['Type I', 'Type II', 'Type III', 'Químico', 'Biológico', 'Radiactivo', 'Industrial'], container.type);
    populateSelectOptions('editTipoContenedor', ['Type I', 'Type II', 'Type III'], container.type); // Example, adjust as per your actual container types

    // Clear previous errors
    displayFieldError('Descripcion', '', true);
    displayFieldError('FechaRegistro', '', true);
    displayFieldError('TipoResiduo', '', true);
    displayFieldError('TipoContenedor', '', true);

    document.getElementById('editContainerModal').classList.remove('hidden');
}

// Helper to populate select options (if not already hardcoded in HTML)
function populateSelectOptions(selectId, optionsArray, selectedValue = '') {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.warn(`Select element with ID '${selectId}' not found.`);
        return;
    }
    selectElement.innerHTML = '<option value="">Seleccione...</option>'; // Default option
    optionsArray.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        if (option === selectedValue) {
            optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
    });
}


// Function to display/hide field error messages
function displayFieldError(fieldId, message, isEditModal = false) {
    const prefix = isEditModal ? 'edit' : '';
    const errorElement = document.getElementById(prefix + fieldId + 'Error');
    const inputElement = document.getElementById(prefix + fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
    }
    if (inputElement) { // Check if inputElement exists before manipulating classes
        if (message) {
            inputElement.classList.add('invalid');
        } else {
            inputElement.classList.remove('invalid');
        }
    }
}


// Handle Edit Container Form Submission
document.getElementById('editContainerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const containerId = document.getElementById('editContainerId').value;
    
    // Clear previous error messages
    displayFieldError('Descripcion', '', true);
    displayFieldError('FechaRegistro', '', true);
    displayFieldError('TipoResiduo', '', true);
    displayFieldError('TipoContenedor', '', true);

    const editDescripcion = document.getElementById('editDescripcion').value;
    const editFechaRegistro = document.getElementById('editFechaRegistro').value; // Keep as string for now, will convert before sending to API
    const editTipoResiduo = document.getElementById('editTipoResiduo').value;
    const editTipoContenedor = document.getElementById('editTipoContenedor').value;

    let isValid = true;

    if (!editDescripcion) {
        displayFieldError('Descripcion', 'La descripción es obligatoria.', true);
        isValid = false;
    }
    if (!editFechaRegistro) {
        displayFieldError('FechaRegistro', 'La fecha de registro es obligatoria.', true);
        isValid = false;
    }
    if (!editTipoResiduo) {
        displayFieldError('TipoResiduo', 'El tipo de residuo es obligatorio.', true);
        isValid = false;
    }
    if (!editTipoContenedor) {
        displayFieldError('TipoContenedor', 'El tipo de contenedor es obligatorio.', true);
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Prepare updated data - assuming `name` and `type` are the main fields for update
    // You might need to fetch the full existing container data first if your API requires all fields
    // or has specific update endpoints.
    const updatedData = {
        id: containerId,
        name: editDescripcion,
        type: editTipoContenedor, // Use TipoContenedor as the main 'type' for update
        lastUpdated: new Date(editFechaRegistro).toISOString() // Convert date string to ISO for API
        // Add other fields from the form if your API supports updating them
    };
    
    console.log("Simulando envío de actualización a la API:", updatedData);

    // *** PLACE YOUR ACTUAL API CALL HERE TO UPDATE THE CONTAINER ***
    // Example (you'll need to implement updateContenedor in Gets.js or a dedicated API file for PUT/PATCH):
    // try {
    //     // const response = await updateContenedor(updatedData); // Assuming updateContenedor handles PUT/PATCH
    //     // if (response && response.ok) { // Check for successful API response (response.ok is true for 2xx status codes)
    //     //     console.log("Contenedor actualizado exitosamente en la API!");
    //     // } else {
    //     //     const errorBody = await response.text();
    //     //     console.error("Error al actualizar contenedor en la API:", response.status, errorBody);
    //     //     alert("Error al actualizar contenedor. Por favor, intente de nuevo.");
    //     // }
    // } catch (error) {
    //     console.error("Error en la llamada a la API de actualización:", error);
    //     alert("Error de conexión al intentar actualizar contenedor.");
    // }

    closeModal('editContainerModal');
    // After an update, it's good practice to re-render from API to reflect actual changes
    renderContainers(); 
});

// Function to close any modal
function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.classList.add('hidden');
    }
}
window.closeModal = closeModal; // Make global for HTML onclick


// Handle Search (real-time)
async function handleContainerSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    let allContainers = [];
    try {
        const apiResponse = await getContenedores(); // Re-fetch all containers for search
        if (Array.isArray(apiResponse)) {
            allContainers = apiResponse;
        } else if (apiResponse && Array.isArray(apiResponse.contenedores)) {
            allContainers = apiResponse.contenedores;
        } else {
            console.error("API response for search is not as expected:", apiResponse);
        }
    } catch (error) {
        console.error("Error al obtener contenedores para la búsqueda:", error);
        allContainers = containers; // Fallback to currently loaded 'containers' if API fails for search
    }

    if (searchTerm === "") {
        renderContainers(allContainers); // Show all containers if search is empty
        return;
    }

    const filteredContainers = allContainers.filter(container => {
        return (
            (container.id && container.id.toLowerCase().includes(searchTerm)) ||
            (container.deviceID && container.deviceID.toLowerCase().includes(searchTerm)) ||
            (container.name && container.name.toLowerCase().includes(searchTerm)) ||
            (container.type && container.type.toLowerCase().includes(searchTerm)) ||
            (container.status && container.status.toLowerCase().includes(searchTerm))
        );
    });
    renderContainers(filteredContainers);
}
window.handleContainerSearch = handleContainerSearch;


// Redirect to New Container Page (if you have one)
document.getElementById('newContainerBtn').addEventListener('click', () => {
    // window.location.href = 'registrarContenedor.html'; // Example for a registration page
    alert("Funcionalidad para 'Nuevo Contenedor' no implementada en este ejemplo.");
});


// Load and render containers when the window loads
window.onload = () => {
    renderContainers(); // Render containers loaded from the API
};