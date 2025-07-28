// camiones.js
import { getCamiones, getCamionesById } from '../DataConnection/Gets.js'; // Import the GET functions

let trucks = []; // Array para almacenar los datos de los camiones, ahora poblado desde la API

// Función para mostrar/ocultar mensajes de error de campo
function displayFieldError(fieldId, message, isEditModal = false) {
    const prefix = isEditModal ? 'edit' : '';
    const errorElement = document.getElementById(prefix + fieldId + 'Error');
    const inputElement = document.getElementById(prefix + fieldId);
    if (message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('invalid');
    } else {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        inputElement.classList.remove('invalid');
    }
}

// Función de validación para el año
function validateAnio(anio) {
    const currentYear = new Date().getFullYear();
    if (anio === null || isNaN(anio) || anio < 1900 || anio > (currentYear)) {
        return "El año debe ser un número válido entre 1900 y " + (currentYear) + ".";
    }
    return ""; // Sin error
}

// Función de validación para la capacidad de carga
function validateCapacidadCarga(capacidad) {
    if (capacidad === null || isNaN(capacidad) || capacidad <= 0 || capacidad > 9999) { // Límite de 200
        return "La capacidad de carga debe ser un número positivo, máximo 9999.";
    }
    return ""; // Sin error
}

// Renderizar camiones en la cuadrícula
async function renderTrucks(filteredTrucks = null) {
    const trucksGrid = document.getElementById('trucksGrid');
    trucksGrid.innerHTML = ''; // Limpiar las tarjetas existentes

    if (!filteredTrucks) {
        try {
            const apiResponse = await getCamiones(); // Fetch all trucks from the API
            // console.log("API Response for all trucks:", apiResponse); // Debugging: See what getCamiones returns

            // FIX: Access the 'camiones' array from the apiResponse
            if (apiResponse && Array.isArray(apiResponse.camiones)) {
                trucks = apiResponse.camiones;
            } else {
                console.error("API response for camiones is not as expected (not an array under 'camiones'):", apiResponse);
                trucks = []; // Ensure trucks array is empty if response is bad
            }
        } catch (error) {
            console.error("Error al cargar camiones desde la API:", error);
            trucksGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Error al cargar camiones. Intente de nuevo más tarde.</p>';
            return;
        }
    }

    const trucksToRender = filteredTrucks || trucks;

    if (!trucksToRender || trucksToRender.length === 0) {
        trucksGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay camiones registrados que coincidan con la búsqueda.</p>';
        return;
    }

    trucksToRender.forEach(truck => {
        const truckCard = document.createElement('div');
        truckCard.className = 'truck-card';
        truckCard.innerHTML = `
            <div class="truck-header">
                <span class="truck-id">${truck.placa || 'N/A'}</span>
            </div>
            <div class="truck-info">
                <div class="info-row">
                    <span class="info-label">Marca:</span>
                    <span class="info-value">${truck.marca || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Modelo:</span>
                    <span class="info-value">${truck.modelo || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Año:</span>
                    <span class="info-value">${truck.anio || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Capacidad de Carga:</span>
                    <span class="info-value">${truck.capacidadCarga !== undefined && truck.capacidadCarga !== null ? `${truck.capacidadCarga}` : 'N/A'}</span>
                </div>
            </div>
            <div class="truck-actions">
                <button class="btn-small btn-view" data-id="${truck.idCamion}">Ver Detalles</button>
                <button class="btn-small btn-edit" data-id="${truck.idCamion}">Editar</button>
            </div>
        `;
        trucksGrid.appendChild(truckCard);
    });

    // Adjuntar oyentes de eventos a los nuevos botones
    attachButtonListeners();
}

// Adjuntar oyentes de eventos a los botones "Ver Detalles" y "Editar"
function attachButtonListeners() {
    document.querySelectorAll('.btn-view').forEach(button => {
        button.onclick = (event) => {
            const truckId = event.target.dataset.id;
            showViewTruckModal(truckId);
        };
    });

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.onclick = (event) => {
            const truckId = event.target.dataset.id;
            showEditTruckModal(truckId);
        };
    });
}

// Mostrar Modal de Detalles del Camión
async function showViewTruckModal(truckId) {
    // console.log("camiones.js: Attempting to show details for truckId:", truckId); // Debugging: What ID is passed?
    const apiResponse = await getCamionesById(truckId); // Fetch truck details by ID from API
    // console.log("camiones.js: Received raw API response for view modal:", apiResponse); // Debugging: What raw data did getCamionesById return?

    // FIX: Access the actual truck object from apiResponse.camiones
    const truck = apiResponse && apiResponse.camiones ? apiResponse.camiones : null;

    // console.log("camiones.js: Extracted truck object for view modal:", truck); // Debugging: What is the extracted truck object?

    if (!truck) {
        console.error("Camión no encontrado o datos no recibidos:", truckId);
        // Optionally display a user-friendly error message in the modal or on the page
        return;
    }

    const detailsDiv = document.getElementById('viewTruckDetails');
    detailsDiv.innerHTML = `
        <div class="modal-info-row"><span class="modal-info-label">ID Camión:</span><span class="modal-info-value">${truck.idCamion || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Placa:</span><span class="modal-info-value">${truck.placa || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Marca:</span><span class="modal-info-value">${truck.marca || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Modelo:</span><span class="modal-info-value">${truck.modelo || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Año:</span><span class="modal-info-value">${truck.anio || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Capacidad de Carga:</span><span class="modal-info-value">${truck.capacidadCarga !== undefined && truck.capacidadCarga !== null ? `${truck.capacidadCarga}` : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">ID Usuario:</span><span class="modal-info-value">${truck.idUsuario || 'N/A'}</span></div>
    `;
    document.getElementById('viewTruckModal').classList.remove('hidden');
}

// Mostrar Modal de Edición de Camión
async function showEditTruckModal(truckId) {
    // console.log("camiones.js: Attempting to show edit modal for truckId:", truckId); // Debugging
    const apiResponse = await getCamionesById(truckId);
    // console.log("camiones.js: Received raw API response for edit modal:", apiResponse); // Debugging

    // FIX: Access the actual truck object from apiResponse.camiones
    const truck = apiResponse && apiResponse.camiones ? apiResponse.camiones : null;

    // console.log("camiones.js: Extracted truck object for edit modal:", truck); // Debugging

    if (!truck) {
        console.error("Camión no encontrado para editar:", truckId);
        return;
    }

    document.getElementById('editTruckId').value = truck.idCamion || ''; // Use idCamion from API
    document.getElementById('editPlaca').value = truck.placa || ''; //
    document.getElementById('editMarca').value = truck.marca || ''; //
    document.getElementById('editModelo').value = truck.modelo || ''; //
    document.getElementById('editAnio').value = truck.anio || ''; //
    document.getElementById('editCapacidadCarga').value = truck.capacidadCarga || ''; // Use capacidadCarga

    // Limpiar errores previos al abrir el modal de edición
    displayFieldError('Placa', '', true);
    displayFieldError('Marca', '', true);
    displayFieldError('Modelo', '', true);
    displayFieldError('Anio', '', true);
    displayFieldError('CapacidadCarga', '', true);

    document.getElementById('editTruckModal').classList.remove('hidden');
}

// Función para cerrar cualquier modal
function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.classList.add('hidden');
    }
}
window.closeModal = closeModal;


// Manejar el envío del formulario de Edición de Camión
document.getElementById('editTruckForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const truckId = document.getElementById('editTruckId').value;
    
    // Limpiar mensajes de error previos del modal de edición
    displayFieldError('Placa', '', true);
    displayFieldError('Marca', '', true);
    displayFieldError('Modelo', '', true);
    displayFieldError('Anio', '', true);
    displayFieldError('CapacidadCarga', '', true);

    const editPlaca = document.getElementById('editPlaca').value;
    const editMarca = document.getElementById('editMarca').value;
    const editModelo = document.getElementById('editModelo').value;
    const editAnio = parseInt(document.getElementById('editAnio').value);
    const editCapacidadCarga = parseFloat(document.getElementById('editCapacidadCarga').value);

    let isValid = true;

    // Validaciones para el modal de edición
    if (!editPlaca) {
        displayFieldError('Placa', 'La placa es obligatoria.', true);
        isValid = false;
    }

    const anioError = validateAnio(editAnio);
    if (anioError) {
        displayFieldError('Anio', anioError, true);
        isValid = false;
    }

    const capacidadCargaError = validateCapacidadCarga(editCapacidadCarga);
    if (capacidadCargaError) {
        displayFieldError('CapacidadCarga', capacidadCargaError, true);
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    const updatedData = {
        idCamion: parseInt(truckId), // Ensure ID is parsed as integer if API expects it
        placa: editPlaca,
        marca: editMarca,
        modelo: editModelo,
        anio: editAnio,
        capacidadCarga: editCapacidadCarga, // Use capacidadCarga for API
    };

    console.log("Simulando actualización de camión:", updatedData);
    
    // Here you would typically make an API call to update the truck (PUT/PATCH request)
    // For example:
    // try {
    //     await updateCamion(updatedData); // You'd need to implement updateCamion in Gets.js or a separate file for PUT/PATCH
    //     console.log("Camión actualizado exitosamente en la API!");
    //     closeModal('editTruckModal');
    //     renderTrucks(); // Re-render to show changes
    // } catch (error) {
    //     console.error("Error al actualizar camión en la API:", error);
    //     // Display a general error message to the user
    // }

    closeModal('editTruckModal');
    renderTrucks(); // Re-render to reflect changes (though not persistent without API update)
});

// Función para manejar la búsqueda (ahora llamada en tiempo real)
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const allTrucksResponse = await getCamiones(); // Fetch all trucks from the API
    let allTrucks = [];

    // FIX: Access the 'camiones' array from the apiResponse
    if (allTrucksResponse && Array.isArray(allTrucksResponse.camiones)) {
        allTrucks = allTrucksResponse.camiones;
    } else {
        console.error("API response for search is not as expected (not an array under 'camiones'):", allTrucksResponse);
        allTrucks = [];
    }
    
    if (searchTerm === "") {
        renderTrucks(allTrucks);
        return;
    }

    const filteredTrucks = allTrucks.filter(truck => {
        // Se busca en ID, placa, marca, modelo.
        return (
            (truck.idCamion && truck.idCamion.toString().toLowerCase().includes(searchTerm)) || // Use idCamion
            (truck.placa && truck.placa.toLowerCase().includes(searchTerm)) || //
            (truck.marca && truck.marca.toLowerCase().includes(searchTerm)) || //
            (truck.modelo && truck.modelo.toLowerCase().includes(searchTerm)) //
        );
    });
    renderTrucks(filteredTrucks);
}
// Hacer la función handleSearch globalmente accesible para oninput
window.handleSearch = handleSearch;


// Redirigir a la página de Nuevo Camión
document.getElementById('newTruckBtn').addEventListener('click', () => {
    window.location.href = 'registrarCamion.html';
});

// Cargar y renderizar camiones cuando la ventana se carga
window.onload = () => {
    renderTrucks();
};