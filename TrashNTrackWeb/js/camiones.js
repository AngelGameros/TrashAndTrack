// camiones.js
import { getCamiones, getCamionesById } from '../DataConnection/Gets.js'; // Import the GET functions
import { getUsuarios } from '../DataConnection/Gets.js'; // Descomenta esta línea
import { postCamiones } from "../DataConnection/Post.js";
import { putCamiones } from "../DataConnection/Puts.js";


let trucks = []; // Array para almacenar los datos de los camiones, ahora poblado desde la API

// Función mock para simular la obtención de usuarios
// Elimina esta función cuando uses tu getUsuarios real
// async function getUsuarios() {
//     return new Promise(resolve => {
//         setTimeout(() => {
//             resolve({
//                 usuarios: [
//                     { "idUsuario": 1, "nombre": "Christian", "primerApellido": "Martinez", "segundoApellido": "Hernandez", "correo": "christian.martinez@gmail.com", "numeroTelefono": "6645464315", "firebaseUid": "aMhnX4DwdtQkrt6GKPEQcwnLwhe2", "tipoUsuario": "recolector" },
//                     { "idUsuario": 2, "nombre": "María", "primerApellido": "Pérez", "segundoApellido": "García", "correo": "maria.perez@gmail.com", "numeroTelefono": "6641234567", "firebaseUid": "bBhnX4DwdtQkrt6GKPEQcwnLwhe2", "tipoUsuario": "recolector" },
//                     { "idUsuario": 3, "nombre": "Juan", "primerApellido": "Gómez", "segundoApellido": "López", "correo": "juan.gomez@gmail.com", "numeroTelefono": "6647654321", "firebaseUid": "cCmnX4DwdtQkrt6GKPEQcwnLwhe2", "tipoUsuario": "recolector" }
//                 ]
//             });
//         }, 500);
//     });
// }


// Función para mostrar/ocultar mensajes de error de campo
function displayFieldError(fieldId, message, isEditModal = false) {
    const prefix = isEditModal ? 'edit' : '';
    const errorElement = document.getElementById(prefix + fieldId + 'Error');
    const inputElement = document.getElementById(prefix + fieldId);

    // Verifica si el elemento del error existe antes de manipularlo
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
    }
    
    // Verifica si el elemento del input existe antes de manipularlo
    if (inputElement) {
        if (message) {
            inputElement.classList.add('invalid');
        } else {
            inputElement.classList.remove('invalid');
        }
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
    if (capacidad === null || isNaN(capacidad) || capacidad <= 0 || capacidad > 9999) {
        return "La capacidad de carga debe ser un número positivo, máximo 9999.";
    }
    return ""; // Sin error
}

// Renderizar camiones en la cuadrícula
async function renderTrucks(filteredTrucks = null) {
    const trucksGrid = document.getElementById('trucksGrid');
    if (!trucksGrid) {
      console.error("El elemento con id 'trucksGrid' no fue encontrado.");
      return;
    }
    trucksGrid.innerHTML = ''; // Limpiar las tarjetas existentes

    if (!filteredTrucks) {
        try {
            const apiResponse = await getCamiones(); // Fetch all trucks from the API
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
                    <span class="info-label">Estado:</span>
                    <span class="info-value">${truck.estado || 'N/A'}</span>
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

// Función para poblar el select de usuarios para el modal de creación
async function populateUserSelect() {
    const userSelect = document.getElementById('usuarioTruck');
    if (!userSelect) return;

    // Limpiar opciones previas, manteniendo el placeholder
    userSelect.innerHTML = '<option value="" disabled selected>Seleccione un usuario</option>';
    try {
        const apiResponse = await getUsuarios();
        console.log("Respuesta de la API de usuarios para CREAR:", apiResponse); // Log para depuración
        const users = apiResponse?.usuarios;
        if (users && Array.isArray(users)) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.idUsuario;
                option.textContent = `${user.nombre} ${user.primerApellido} ${user.segundoApellido}`;
                userSelect.appendChild(option);
            });
        } else {
            console.error("Respuesta de la API de usuarios no es la esperada para CREAR:", apiResponse);
            // Mostrar error visual al usuario
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Error al cargar usuarios';
            errorOption.disabled = true;
            userSelect.appendChild(errorOption);
        }
    } catch (error) {
        console.error("Error al cargar usuarios para CREAR:", error);
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error al cargar usuarios';
        errorOption.disabled = true;
        userSelect.appendChild(errorOption);
    }
}

// Función para poblar el select de usuarios para el modal de edición
async function populateEditUserSelect(selectedUserId) {
    const userSelect = document.getElementById('editUsuario');
    if (!userSelect) return;

    // Limpiar opciones previas, manteniendo el placeholder
    userSelect.innerHTML = '<option value="" disabled selected>Seleccione un usuario</option>';
    try {
        const apiResponse = await getUsuarios();
        console.log("Respuesta de la API de usuarios para EDICIÓN:", apiResponse); // Log para depuración
        const users = apiResponse?.usuarios;
        if (users && Array.isArray(users)) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.idUsuario;
                option.textContent = `${user.nombre} ${user.primerApellido} ${user.segundoApellido}`;
                if (user.idUsuario === selectedUserId) {
                    option.selected = true;
                }
                userSelect.appendChild(option);
            });
        } else {
            console.error("Respuesta de la API de usuarios no es la esperada para EDICIÓN:", apiResponse);
            // Mostrar error visual al usuario
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Error al cargar usuarios';
            errorOption.disabled = true;
            userSelect.appendChild(errorOption);
        }
    } catch (error) {
        console.error("Error al cargar usuarios para EDICIÓN:", error);
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error al cargar usuarios';
        errorOption.disabled = true;
        userSelect.appendChild(errorOption);
    }
}


// Variables y lógica para el modal de creación
const newTruckBtn = document.getElementById('newTruckBtn');
const createTruckModal = document.getElementById('createTruckModal');
const createTruckForm = document.getElementById('createTruckForm');
const closeCreateModal = document.getElementById('closeCreateModal');
const closeViewModal = document.getElementById('closeViewModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');


function closeModal(modalId = 'createTruckModal') {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.classList.add('hidden');
        if (modalId === 'createTruckModal') {
            createTruckForm.reset(); // Limpiar el formulario de creación
        }
    }
}
window.closeModal = closeModal;

// Oyente de evento para abrir el modal de creación
if(newTruckBtn) {
    newTruckBtn.addEventListener('click', () => {
        populateUserSelect(); // Llama a la función para cargar usuarios
        createTruckModal.classList.remove('hidden');
    });
}


if(closeCreateModal) {
    closeCreateModal.addEventListener('click', () => closeModal('createTruckModal'));
}

if(cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', () => closeModal('createTruckModal'));
}

// Cerrar el modal haciendo clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target === createTruckModal) {
        closeModal('createTruckModal');
    }
});
if(createTruckForm) {
    createTruckForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Limpiar errores previos
        displayFieldError('placaTruck', '');
        displayFieldError('marcaTruck', '');
        displayFieldError('modeloTruck', '');
        displayFieldError('anioTruck', '');
        displayFieldError('capacidadCargaTruck', '');
        displayFieldError('usuarioTruck', '');
        displayFieldError('estadoTruck', '');
        
        // Obtener valores del formulario
        const placa = document.getElementById('placaTruck').value.trim();
        const marca = document.getElementById('marcaTruck').value.trim();
        const modelo = document.getElementById('modeloTruck').value.trim();
        const anio = parseInt(document.getElementById('anioTruck').value);
        const capacidadCarga = parseFloat(document.getElementById('capacidadCargaTruck').value);
        const idUsuario = document.getElementById('usuarioTruck').value;
        const estado = document.getElementById('estadoTruck').value;

        let isValid = true;
        if (!placa) {
            displayFieldError('placaTruck', 'La placa es obligatoria.');
            isValid = false;
        }
        if (!marca) {
            displayFieldError('marcaTruck', 'La marca es obligatoria.');
            isValid = false;
        }
        if (!modelo) {
            displayFieldError('modeloTruck', 'El modelo es obligatorio.');
            isValid = false;
        }
        const anioError = validateAnio(anio);
        if (anioError) {
            displayFieldError('anioTruck', anioError);
            isValid = false;
        }
        const capacidadCargaError = validateCapacidadCarga(capacidadCarga);
        if (capacidadCargaError) {
            displayFieldError('capacidadCargaTruck', capacidadCargaError);
            isValid = false;
        }
        if (!idUsuario) {
            displayFieldError('usuarioTruck', 'Debe seleccionar un usuario.');
            isValid = false;
        }
        if (estado === "") {
            displayFieldError('estadoTruck', 'El estado es obligatorio.');
            isValid = false;
        }
        
        if (!isValid) return;

        const newTruckData = {
            placa,
            marca,
            modelo,
            anio,
            capacidadCarga,
            idUsuario: Number(idUsuario),
            estado
        };

        console.log("Datos del nuevo camión:", newTruckData);

        try {
            await postCamiones(newTruckData); // Descomenta esta línea
            // alert("Camión creado correctamente."); // Reemplazado por un mensaje personalizado para evitar alert()
            console.log("Camión creado correctamente."); // Muestra un mensaje en consola para simulación
            closeModal('createTruckModal');
            renderTrucks(); // Llama a la función para recargar la lista de camiones
        } catch (error) {
            console.error("Error al crear camión:", error);
            // alert("Hubo un error al crear el camión. Intente más tarde."); // Reemplazado
            console.log("Hubo un error al crear el camión. Intente más tarde.");
        }
    });
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
            // Aquí se llama a la función para mostrar el modal de edición
            showEditTruckModal(truckId);
        };
    });
}

// Mostrar Modal de Detalles del Camión
async function showViewTruckModal(truckId) {
    const apiResponse = await getCamionesById(truckId);
    const truck = apiResponse && apiResponse.camiones ? apiResponse.camiones : null;

    if (!truck) {
        console.error("Camión no encontrado o datos no recibidos:", truckId);
        return;
    }

    const detailsDiv = document.getElementById('viewTruckDetails');
    if (!detailsDiv) {
      console.error("El elemento con id 'viewTruckDetails' no fue encontrado.");
      return;
    }

    detailsDiv.innerHTML = `
        <div class="modal-info-row"><span class="modal-info-label">ID Camión:</span><span class="modal-info-value">${truck.idCamion || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Placa:</span><span class="modal-info-value">${truck.placa || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Marca:</span><span class="modal-info-value">${truck.marca || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Modelo:</span><span class="modal-info-value">${truck.modelo || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Año:</span><span class="modal-info-value">${truck.anio || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Estado:</span><span class="modal-info-value">${truck.estado || 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">Capacidad de Carga:</span><span class="modal-info-value">${truck.capacidadCarga !== undefined && truck.capacidadCarga !== null ? `${truck.capacidadCarga}` : 'N/A'}</span></div>
        <div class="modal-info-row"><span class="modal-info-label">ID Usuario:</span><span class="modal-info-value">${truck.idUsuario || 'N/A'}</span></div>
    `;
    document.getElementById('viewTruckModal').classList.remove('hidden');
}

// Mostrar Modal de Edición de Camión
async function showEditTruckModal(truckId) {
    const apiResponse = await getCamionesById(truckId);
    const truck = apiResponse && apiResponse.camiones ? apiResponse.camiones : null;

    if (!truck) {
        console.error("Camión no encontrado para editar:", truckId);
        return;
    }

    // console.log para depuración
    console.log("Datos del camión para edición:", truck);

    document.getElementById('editTruckId').value = truck.idCamion || '';
    document.getElementById('editPlaca').value = truck.placa || '';
    document.getElementById('editMarca').value = truck.marca || '';
    document.getElementById('editModelo').value = truck.modelo || '';
    document.getElementById('editAnio').value = truck.anio || '';
    document.getElementById('editEstado').value = truck.estado || '';
    document.getElementById('editCapacidadCarga').value = truck.capacidadCarga || '';

    // Llenar y seleccionar el usuario correcto en el select
    await populateEditUserSelect(truck.idUsuario);

    // Limpiar errores previos al abrir el modal de edición
    displayFieldError('Placa', '', true);
    displayFieldError('Marca', '', true);
    displayFieldError('Modelo', '', true);
    displayFieldError('Anio', '', true);
    displayFieldError('Estado', '', true);
    displayFieldError('CapacidadCarga', '', true);
    displayFieldError('Usuario', '', true); // Nuevo campo de usuario en el modal de edición

    document.getElementById('editTruckModal').classList.remove('hidden');
}

// Manejar el envío del formulario de Edición de Camión
document.getElementById('editTruckForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const truckId = document.getElementById('editTruckId').value;

    // Limpiar errores
    displayFieldError('Placa', '', true);
    displayFieldError('Marca', '', true);
    displayFieldError('Modelo', '', true);
    displayFieldError('Anio', '', true);
    displayFieldError('Estado', '', true);
    displayFieldError('CapacidadCarga', '', true);
    displayFieldError('Usuario', '', true);

    const editPlaca = document.getElementById('editPlaca').value.trim();
    const editMarca = document.getElementById('editMarca').value.trim();
    const editModelo = document.getElementById('editModelo').value.trim();
    const editAnio = parseInt(document.getElementById('editAnio').value);
    const editEstado = document.getElementById('editEstado').value;
    const editCapacidadCarga = parseFloat(document.getElementById('editCapacidadCarga').value);
    const editIdUsuario = document.getElementById('editUsuario').value; // Nuevo campo de usuario

    let isValid = true;

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
    if (!editIdUsuario) {
        displayFieldError('Usuario', 'Debe seleccionar un usuario.', true);
        isValid = false;
    }

    if (!isValid) return;

    const updatedData = {
        idCamion: Number(truckId),
        placa: editPlaca,
        marca: editMarca,
        modelo: editModelo,
        anio: editAnio,
        capacidadCarga: editCapacidadCarga,
        idUsuario: Number(editIdUsuario), // Asegurarse de que el ID sea un número
        estado: editEstado
    };


    if(closeViewModal) {
    closeViewModal.addEventListener('click', () => closeModal('viewTruckModal'));
    }
    if(closeEditModal) {
    closeEditModal.addEventListener('click', () => closeModal('editTruckModal'));
}
    try {
        await putCamiones(truckId, updatedData);
        console.log("Camión actualizado correctamente.");
        closeModal('editTruckModal');
        renderTrucks(); // Recargar para mostrar cambios
    } catch (error) {
        console.error("Error al actualizar camión:", error);
        // alert("Hubo un error al actualizar el camión. Intente más tarde."); // Reemplazado
        console.log("Hubo un error al actualizar el camión. Intente más tarde.");
    }
});


// Función para manejar la búsqueda (ahora llamada en tiempo real)
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const allTrucksResponse = await getCamiones(); // Fetch all trucks from the API
    let allTrucks = [];

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
        return (
            (truck.idCamion && truck.idCamion.toString().toLowerCase().includes(searchTerm)) ||
            (truck.placa && truck.placa.toLowerCase().includes(searchTerm)) ||
            (truck.marca && truck.marca.toLowerCase().includes(searchTerm)) ||
            (truck.modelo && truck.modelo.toLowerCase().includes(searchTerm))
        );
    });
    renderTrucks(filteredTrucks);
}
window.handleSearch = handleSearch;


// Cargar y renderizar camiones cuando la ventana se carga
window.onload = () => {
    renderTrucks();
};
