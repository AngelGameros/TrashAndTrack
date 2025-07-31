import { config } from './Config.js';

// Función auxiliar para todas las llamadas PUT
export async function putData(endpoint, data) {
    const url = config.api.url + endpoint;
    console.log("PUT =>", url);

    return await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(result => {
        if (!result.ok) {
            return result.json().then(err => { throw err; });
        }
        return result.json();
    })
    .catch(error => {
        console.error("Error en putData:", error);
        throw error;
    });
}

// =======================================
// PUTS PARA USUARIOS
// =======================================

export async function putUsuario(id, { nombre, primerApellido, segundoApellido, numeroTelefono }) {
    return putData(`Usuarios/${id}`, {
        nombre,
        primerApellido,
        segundoApellido,
        numeroTelefono
    });
}


// Aquí puedes agregar más funciones PUT específicas como:
// putSensor, putRuta, etc., siguiendo el mismo patrón
