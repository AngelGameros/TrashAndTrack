import { config } from "./Config.js";


export async function fetchPut(endpoint, id, info) {
    var url = config.api.url + endpoint + "/" + id; // Include the ID in the URL
    console.log("URL para el método: " + url);
    console.log("Información a actualizar: " + JSON.stringify(info)); // Stringify para darle formato tipo JSon

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(info)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = `Error HTTP ${response.status}: ${errorBody.message || response.statusText}`;
            console.error("Error updating data in the API:", errorMessage);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("PUT request successful (API response):", result);
        return result;

    } catch (error) {
        console.error("Error realizando el PUT:", error);
        throw error;
    }
}

// =======================================
// PUT para Empresas
// =======================================
export async function putEmpresas(id, infoEmpresa) {
    if (!id) {
        throw new Error("se debe especificar el id de la ruta.");
    }
    if (!infoEmpresa) {
        throw new Error("Updated route data cannot be empty.");
    }
    return fetchPut("Rutas", id, infoEmpresa);

    /* Información esperada para actualizar Rutas:
{
    "idEmpresa": 1, //este también debe de coincidir con el que vas a actualizar, ya luego lo arreglo xd
    "nombre": "Prueba de Put2", 
    "fechaRegistro": "7-4-2025",
    "rfc": "EMP123456A1",
    "idUbicacion": 3
}
    Nota: El "id" se pasa a la ruta como parte del URL como un argumento serparado
    si es necesario también actualizar el ID este se debe de agregar en el cuerpo
*/
}

// =======================================
// PUT para PLANTAS
// =======================================
export async function putPlantas(id, infoPlantas) {
    if (!id) {
        throw new Error("se debe especificar el id de la ruta.");
    }
    if (!infoPlantas) {
        throw new Error("Updated route data cannot be empty.");
    }
    return fetchPut("Plantas", id, infoPlantas);
}

// =======================================
// PUT para usar el método de canelar un itinerario (liberar ruta)
// =======================================
export async function cancelarRuta(id,idRutaLiberar) {
    if (!idRutaLiberar) {
        throw new Error("Updated route data cannot be empty.");
    }
    id = "liberar";
    return fetchPut("Rutas", id, idRutaLiberar);

    /*
 el método espera un resultado parecido a:
    {"idRuta": 1} (no funciona si la ruta no existe o no está asignada)
*/
}

// =======================================
// PUT para UBICACION
// =======================================
export async function putEmpresas(id, infoUbicacion) {
    if (!id) {
        throw new Error("se debe especificar el id de la ruta.");
    }
    if (!infoUbicacion) {
        throw new Error("Updated route data cannot be empty.");
    }
    return fetchPut("Rutas", id, infoUbicacion);

    /*información esperada por el método
    {
    "idUbicacion": 18,
    "direccion": "asereje ja dejebe tu dejebe",
    "latitud": 32.50112300,
    "longitud": -117.00345600
    }
    */

}

// =======================================
// PUT para USUARIOS
// =======================================
export async function putEmpresas(id, infoUsuario) {
    if (!id) {
        throw new Error("se debe especificar el id de la ruta.");
    }
    if (!infoUsuario) {
        throw new Error("Updated route data cannot be empty.");
    }
    return fetchPut("Usuarios", id, infoUsuario);
/*
{
  "nombre": "Nuevo Nombre",
  "primer_apellido": "Nuevo Primer Apellido",
  "segundo_apellido": "Nuevo Segundo Apellido"
}
*/
}