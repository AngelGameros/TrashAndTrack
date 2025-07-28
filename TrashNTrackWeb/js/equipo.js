// equipo.js
import { getUsuarios } from '../DataConnection/Gets.js'; // Importa las funciones GET
import { postUsuarios } from '../DataConnection/Post.js'; // Importa postUsuarios y putUsuario desde Post.js

let users = []; // Array para almacenar los datos de los usuarios

// Función auxiliar para mostrar mensajes de éxito/error (asumiendo un elemento #messageContainer)
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer'); // Asegúrate de tener este elemento en tu HTML
    if (!messageContainer) {
        console.warn('No se encontró el elemento #messageContainer para mostrar mensajes.');
        alert(message); // Fallback a alert si no existe el contenedor
        return;
    }
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return 'N/A';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumber;
}

// Función para mostrar/ocultar mensajes de error de campo
function displayFieldError(fieldId, message, isEditModal = false, isAddModal = false) {
    let prefix = '';
    if (isEditModal) prefix = 'edit';
    if (isAddModal) prefix = 'new';

    const errorElement = document.getElementById(prefix + fieldId + 'Error');
    const inputElement = document.getElementById(prefix + fieldId);

    if (errorElement && inputElement) {
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
}

// Validación de campos comunes
function validateNombre(nombre, isEdit = false, isAdd = false) {
    if (!nombre || nombre.trim() === '') {
        displayFieldError('Nombre', 'El nombre es obligatorio.', isEdit, isAdd);
        return false;
    }
    displayFieldError('Nombre', '', isEdit, isAdd);
    return true;
}

function validatePrimerApell(apellido, isEdit = false, isAdd = false) {
    if (!apellido || apellido.trim() === '') {
        displayFieldError('PrimerApell', 'El primer apellido es obligatorio.', isEdit, isAdd);
        return false;
    }
    displayFieldError('PrimerApell', '', isEdit, isAdd);
    return true;
}

function validateCorreo(correo, isEdit = false, isAdd = false) {
    if (!correo || correo.trim() === '') {
        displayFieldError('Correo', 'El correo es obligatorio.', isEdit, isAdd);
        return false;
    }
    // Simple regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        displayFieldError('Correo', 'Formato de correo inválido.', isEdit, isAdd);
        return false;
    }
    displayFieldError('Correo', '', isEdit, isAdd);
    return true;
}

function validateNumeroTelefono(telefono, isEdit = false, isAdd = false) {
    if (!telefono || telefono.trim() === '') {
        displayFieldError('NumeroTelefono', 'El número de teléfono es obligatorio.', isEdit, isAdd);
        return false;
    }
    // Basic validation for 10 digits (adjust as needed for specific formats)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(telefono)) {
        displayFieldError('NumeroTelefono', 'El teléfono debe tener 10 dígitos.', isEdit, isAdd);
        return false;
    }
    displayFieldError('NumeroTelefono', '', isEdit, isAdd);
    return true;
}

function validateTipoUsuario(tipo, isEdit = false, isAdd = false) {
    if (!tipo || tipo.trim() === '') {
        displayFieldError('TipoUsuario', 'El tipo de usuario es obligatorio.', isEdit, isAdd);
        return false;
    }
    displayFieldError('TipoUsuario', '', isEdit, isAdd);
    return true;
}

function validateFirebaseUid(uid, isEdit = false, isAdd = false) {
    if (!uid || uid.trim() === '') {
        displayFieldError('FirebaseUid', 'El Firebase UID es obligatorio.', isEdit, isAdd);
        return false;
    }
    displayFieldError('FirebaseUid', '', isEdit, isAdd);
    return true;
}

// Render users in the grid
async function renderUsers(filteredUsers = null) {
    const userGrid = document.getElementById('userGrid');
    userGrid.innerHTML = ''; // Limpiar las tarjetas existentes

    if (!filteredUsers) {
        try {
            const apiResponse = await getUsuarios(); // Fetch all users from the API using Gets.js
            console.log("API Response for users:", apiResponse);

            if (apiResponse && apiResponse.usuarios && Array.isArray(apiResponse.usuarios)) {
                users = apiResponse.usuarios;
            } else if (apiResponse && Array.isArray(apiResponse)) { // In case the API returns an array directly
                users = apiResponse;
            }
            else {
                console.error("API response for users is not an array directly or under 'usuarios':", apiResponse);
                users = [];
            }
        } catch (error) {
            console.error("Error al cargar usuarios desde la API:", error);
            userGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Error al cargar usuarios. Intente de nuevo más tarde.</p>';
            return;
        }
    }

    const usersToRender = filteredUsers || users;

    if (!usersToRender || usersToRender.length === 0) {
        userGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay usuarios registrados que coincidan con la búsqueda.</p>';
        return;
    }

    usersToRender.forEach(user => {
        // Asegúrate de usar los nombres de propiedad correctos del objeto user (primerApell, secundoApell)
        const fullName = `${user.nombre || ''} ${user.primerApell || ''} ${user.secundoApell || ''}`.trim();
        const email = user.correo || 'N/A';
        const phone = formatPhoneNumber(user.numero_telefono);
        const userType = user.tipo_usuario || 'N/A';

        const userCard = document.createElement('div');
        userCard.className = `team-card`;
        userCard.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-info">
                <h3>${fullName}</h3>
                <p class="user-role">${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                <p class="user-contact"><i class="fas fa-envelope"></i> ${email}</p>
                <p class="user-contact"><i class="fas fa-phone"></i> ${phone}</p>
            </div>
            <div class="user-actions action-buttons">
                <button class="btn-small btn-view" data-id="${user.id_Usuario}">Ver Detalles</button>
                <button class="btn-small btn-edit" data-id="${user.id_Usuario}">Editar</button>
            </div>
        `;
        userGrid.appendChild(userCard);
    });

    attachButtonListeners();
}

// Attach event listeners to "Ver Detalles" and "Editar" buttons
function attachButtonListeners() {
    document.querySelectorAll('.btn-view').forEach(button => {
        button.onclick = (event) => {
            const userId = event.target.dataset.id;
            showViewUserModal(userId);
        };
    });

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.onclick = (event) => {
            const userId = event.target.dataset.id;
            showEditUserModal(userId);
        };
    });
}

// Show "View User" Modal
async function showViewUserModal(userId) {
    const user = users.find(u => u.id_Usuario == userId);
    if (!user) {
        console.error("Usuario no encontrado:", userId);
        return;
    }

    document.getElementById('viewUserId').textContent = user.id_Usuario;
    const fullName = `${user.nombre || ''} ${user.primerApell || ''} ${user.secundoApell || ''}`.trim();
    document.getElementById('viewUserNameFull').textContent = fullName;
    document.getElementById('viewUserName').textContent = fullName;
    document.getElementById('viewUserEmail').textContent = user.correo || 'N/A';
    document.getElementById('viewUserPhone').textContent = formatPhoneNumber(user.numero_telefono);
    document.getElementById('viewUserType').textContent = user.tipo_usuario ? (user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)) : 'N/A';
    document.getElementById('viewUserFirebaseUid').textContent = user.firebase_uid || 'N/A';

    openModal('viewUserModal');
}

// Show "Edit User" Modal
async function showEditUserModal(userId) {
    const user = users.find(u => u.id_Usuario == userId);
    if (!user) {
        console.error("Usuario no encontrado para editar:", userId);
        return;
    }

    document.getElementById('editUserId').value = user.id_Usuario;
    document.getElementById('editNombre').value = user.nombre || '';
    document.getElementById('editPrimerApell').value = user.primerApell || '';
    document.getElementById('editSecundoApell').value = user.secundoApell || '';
    document.getElementById('editCorreo').value = user.correo || '';
    document.getElementById('editNumeroTelefono').value = user.numero_telefono || '';
    document.getElementById('editFirebaseUid').value = user.firebase_uid || '';
    document.getElementById('editTipoUsuario').value = user.tipo_usuario || '';

    const fullName = `${user.nombre || ''} ${user.primerApell || ''} ${user.secundoApell || ''}`.trim();
    document.getElementById('editUserNameFull').textContent = fullName; // Update modal title

    // Clear previous errors
    ['Nombre', 'PrimerApell', 'SecundoApell', 'Correo', 'NumeroTelefono', 'TipoUsuario', 'FirebaseUid'].forEach(field => {
        displayFieldError(field, '', true);
    });

    openModal('editUserModal');
}

// Handle "Edit User" Form Submission
async function handleEditUserSubmit(event) {
    event.preventDefault();

    const id_Usuario = document.getElementById('editUserId').value;
    const nombre = document.getElementById('editNombre').value;
    const primerApell = document.getElementById('editPrimerApell').value;
    const secundoApell = document.getElementById('editSecundoApell').value;
    const correo = document.getElementById('editCorreo').value;
    const numero_telefono = document.getElementById('editNumeroTelefono').value;
    const firebase_uid = document.getElementById('editFirebaseUid').value;
    const tipo_usuario = document.getElementById('editTipoUsuario').value;

    let isValid = true;
    isValid = validateNombre(nombre, true) && isValid;
    isValid = validatePrimerApell(primerApell, true) && isValid;
    isValid = validateCorreo(correo, true) && isValid;
    isValid = validateNumeroTelefono(numero_telefono, true) && isValid;
    isValid = validateFirebaseUid(firebase_uid, true) && isValid;
    isValid = validateTipoUsuario(tipo_usuario, true) && isValid;

    if (!isValid) {
        return;
    }

    const updatedUser = {
        id_Usuario: parseInt(id_Usuario), // Asegúrate de que sea un número
        nombre,
        primerApell,
        secundoApell: secundoApell || null, // Si es vacío, enviamos null
        correo,
        numero_telefono,
        firebase_uid,
        tipo_usuario
    };

    try {
        // Llama a putUsuario de Post.js
        const response = await putUsuario(parseInt(id_Usuario), updatedUser); 
        if (response && (response.status === 0 || response.ok)) { // Asumiendo status 0 para éxito o response.ok
            showMessage('Usuario actualizado exitosamente.', 'success');
            closeModal('editUserModal');
            renderUsers(); // Recargar la lista de usuarios
        } else {
            // Manejar errores si la API devuelve un mensaje específico o un error
            const errorMessage = response.message || 'Error desconocido al actualizar usuario.';
            showMessage(`Error al actualizar usuario: ${errorMessage}`, 'error');
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        showMessage('Error al actualizar usuario. Intente de nuevo más tarde.', 'error');
    }
}

// Show "Add User" Modal
function showAddUserModal() {
    document.getElementById('addUserForm').reset(); // Limpiar el formulario
    // Clear previous errors
    ['Nombre', 'PrimerApell', 'SecundoApell', 'Correo', 'NumeroTelefono', 'TipoUsuario', 'FirebaseUid'].forEach(field => {
        displayFieldError(field, '', false, true);
    });
    openModal('addUserModal');
}

// Handle "Add User" Form Submission
async function handleAddUserSubmit(event) {
    event.preventDefault();

    const nombre = document.getElementById('newNombre').value;
    const primerApell = document.getElementById('newPrimerApell').value;
    const secundoApell = document.getElementById('newSecundoApell').value;
    const correo = document.getElementById('newCorreo').value;
    const numero_telefono = document.getElementById('newNumeroTelefono').value;
    const firebase_uid = document.getElementById('newFirebaseUid').value;
    const tipo_usuario = document.getElementById('newTipoUsuario').value;

    let isValid = true;
    isValid = validateNombre(nombre, false, true) && isValid;
    isValid = validatePrimerApell(primerApell, false, true) && isValid;
    isValid = validateCorreo(correo, false, true) && isValid;
    isValid = validateNumeroTelefono(numero_telefono, false, true) && isValid;
    isValid = validateFirebaseUid(firebase_uid, false, true) && isValid;
    isValid = validateTipoUsuario(tipo_usuario, false, true) && isValid;

    if (!isValid) {
        return;
    }

    const newUser = {
        nombre,
        primerApell,
        secundoApell: secundoApell || null,
        correo,
        numero_telefono,
        firebase_uid,
        tipo_usuario
    };

    try {
        // Llama a postUsuarios de Post.js
        const response = await postUsuarios(newUser); 
        if (response && (response.status === 0 || response.ok)) { // Asumiendo status 0 para éxito o response.ok
            showMessage('Usuario registrado exitosamente.', 'success');
            closeModal('addUserModal');
            renderUsers(); // Recargar la lista de usuarios
        } else {
            // Manejar errores si la API devuelve un mensaje específico o un error
            const errorMessage = response.message || 'Error desconocido al registrar usuario.';
            showMessage(`Error al registrar usuario: ${errorMessage}`, 'error');
        }
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        showMessage('Error al registrar usuario. Intente de nuevo más tarde.', 'error');
    }
}


// General Modal Functions (assuming these are global or in a common file)
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
window.closeModal = closeModal; // Make it globally accessible for onclick in HTML

// Handle Search Input
function handleUserSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredUsers = users.filter(user => {
        const fullName = `${user.nombre || ''} ${user.primerApell || ''} ${user.secundoApell || ''}`.toLowerCase();
        const email = (user.correo || '').toLowerCase();
        const phone = (user.numero_telefono || '').toLowerCase();
        const userType = (user.tipo_usuario || '').toLowerCase();

        return fullName.includes(searchTerm) ||
               email.includes(searchTerm) ||
               phone.includes(searchTerm) ||
               userType.includes(searchTerm);
    });
    renderUsers(filteredUsers);
}
window.handleUserSearch = handleUserSearch; // Make it globally accessible for onkeyup in HTML

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
   
    renderUsers(); // Initial render of users

    // Event listener for "Nuevo Usuario" button
    const newUserBtn = document.getElementById('newUserBtn');
    if (newUserBtn) {
        newUserBtn.addEventListener('click', showAddUserModal);
    }

    // Event listener for "Edit User" form submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserSubmit);
    }

    // Event listener for "Add User" form submission
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUserSubmit);
    }
});