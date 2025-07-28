import { config } from "./Config.js";

//este método contiene la lógica de como se maneja el envío de información del método post
export async function fetchPost(endpoint,info){
    var url = config.api.url + endpoint;
    console.log("URL para el método: "+url);
    console.log("datos a subir: "+info);
    try{
        const response = await fetch(url, {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(info)
        });
        if(!response.ok){
            const errorBody = await response.json();
            const errorMessage = `Error HTTP ${response.status}: ${errorBody || response.statusText}`;
            console.error("Error al crear incidente en la API:", errorMessage);
            throw new Error(errorMessage);
        }
        const result = await response.json();
        console.log("Post subido con éxito (respuesta de la API):", result);
        return result;

    }
    catch(error){
        console.error("Error al realizar la solicitud POST:", error);
        throw error;

    }
}

// =======================================
// POST PARA INCIDENTES
// =======================================
export async function postIncidentes(newIncidente){
    if(!newIncidente){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Incidente", newIncidente);
}
/*  Información que espera el método
        newIncidente={
            nombre :nombre,
            fecha_incidente: fecha en formatoISO, ejemplo: 2025-07-26 11:59:59
            url_foto: string con el URL
            descripcion: descripcion del incidente
            id_usuario: numero con el id_usuario
        }
*/

// =======================================
// POST PARA REPORTES
// =======================================
export async function postReportes(newReporte){
    if(!newReporte){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Reportes/registrar", newReporte);
}
/*  Información que espera el método
        newIncidente={
            nombre :,
            descripcion,
            idUsuario,
            idContenedor
            cantidadRecolectada
            estadoContenedor
        }
*/

// =======================================
// POST PARA USUARIOS
// =======================================
export async function postUsuarios(newUsuario){
    if(!newUsuario){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Usuarios", newUsuario);
}
/*  Información que espera el método
    nombre,
    primer_apellido,
    segundo_apellido,
    correo,
    numero_telefono,
    firebase_uid,
    tipo_usuario
*/


// =======================================
// POST PARA CONTENEDORES (un solo contenedor)
// =======================================
export async function postContainer(newContainer){
    if(!newContainer){
        throw new Error("Los datos del contenedor no pueden estar vacíos.");
    }
    // El endpoint es simplemente "Containers" para crear un solo contenedor
    return fetchPost("Containers", newContainer);
}
/* Información que espera el método (para un solo contenedor):
        newContainer = {
            deviceId: int,
            clientId: int,
            name: string,
            status: string,
            type: string,
            maxWeight_kg: double,
            values: {
                device_id: int,
                ToC: double,
                RH: double,
                CO2_PPM: double,
                GLP_PPM: double,
                CH4_PPM: double,
                H2_PPM: double
            }
        }
    NOTA: createdAt, updatedAt e Id son generados por el backend.
*/

// =======================================
// POST PARA CONTENEDORES (actualización por lotes)
// =======================================
export async function postBatchUpdateContainers(containersList){
    if(!containersList || !Array.isArray(containersList) || containersList.length === 0){
        throw new Error("La lista de contenedores no puede estar vacía o no es un arreglo.");
    }
    // El endpoint para la actualización por lotes es "Containers/batch-update"
    return fetchPost("Containers/batch-update", containersList);
}
/* Información que espera el método (para actualización por lotes):
        containersList = [
            {
                deviceId: int,
                clientId: int,
                name: string,
                status: string,
                type: string,
                maxWeight_kg: double,
                values: {
                    device_id: int,
                    ToC: double,
                    RH: double,
                    CO2_PPM: double,
                    GLP_PPM: double,
                    CH4_PPM: double,
                    H2_PPM: double
                }
            },
            // ... más objetos de contenedor
        ]
    NOTA: createdAt, updatedAt e Id son generados/manejados por el backend.
          Para actualizaciones, el 'deviceId' se usa para encontrar el registro existente.
*/