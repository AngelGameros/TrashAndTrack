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
            console.error("Error al crear mensaje en la API:", errorMessage);
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
    /*  Información que espera el método
        newIncidente={
            nombre :nombre,
            fecha_incidente: fecha en formatoISO, ejemplo: 2025-07-26 11:59:59
            url_foto: string con el URL
            descripcion: descripcion del incidente
            id_usuario: numero con el id_usuario
        }
*/
}


// =======================================
// POST PARA REPORTES
// =======================================
export async function postReportes(newReporte){
    if(!newReporte){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Reportes/registrar", newReporte);
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
}


// =======================================
// POST PARA USUARIOS
// =======================================
export async function postUsuarios(newUsuario){
    if(!newUsuario){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Usuarios", newUsuario);
    /*  Información que espera el método
    nombre,
    primer_apellido,
    segundo_apellido,
    correo,
    numero_telefono,
    firebase_uid,
    tipo_usuario
*/
}



// =======================================
// POST PARA CONTENEDORES (un solo contenedor) SOLO PARA SENSORES
// =======================================
export async function postContainer(newContainer,coleccion){
    if(!newContainer){
        throw new Error("Los datos del contenedor no pueden estar vacíos.");
    }
    // El endpoint es simplemente "Containers" para crear un solo contenedor
    return fetchPost("Containers/"+coleccion, newContainer);

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
}




// =======================================
// POST PARA PLANTAS 
// ======================================
export async function postPlantas(newPlanta){
    if(!newPlanta){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Plantas", newPlanta);

    /*datos esperados:
{
    "nombre": "Nueva Planta Ejemplo",
    "idUbicacion": 1 (la ubicacion tiene que existir, sino no va a funcionar)
*/
}


// =======================================
// POST PARA RUTAS
// =======================================
export async function postRutas(newRuta){
    if(!newRuta){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Rutas", newRuta);


    /** 
 * datos esperados:
{
    "nombreRuta": "Ruta de Prueba",
    "fechaCreacion": "2025-07-30T10:00:00",
    "descripcion": "Ya hice el test en postman, pobre de ti que me digas que no sirve c;",
    "estado": "Pendiente",
    "idUsuarioAsignado": 1,
    "progresoRuta": 0
}
*/
}


// =======================================
// POST PARA Contenedores
// =======================================
export async function postContenedor(newContenedor){
    if(!newContenedor){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Contenedores", newContenedor);


    /*  Información esperada
      {
            "id": 1,
            "descripcion": "Contenedor Inteligente Orgánico",
            "fechaRegistro": "2025-07-08",
            "idEmpresa": 1,
            "idTipoResiduo": 1,
            "idTipoContenedor": 1
        },
*/
}



// =======================================
// POST PARA EMPRESAS
// =======================================
export async function postEmpresas(newEmpresa){
    if(!newEmpresa){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Empresas", newEmpresa);

    /*Información esperada (cuida que el RFC no se repita)
{
    "nombre": "empresaTests",
    "rfc": "EMP45678dDDs21",
    "idUbicacion": 3
}
*/
}


// =======================================
// POST PARA asignar rutas
// =======================================
export async function AsignarRutas(infoAsignar){
    if(!infoAsignar){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Rutas/asignar", infoAsignar);


    /* asignar ruta
{
    "idRuta": 1,
    "idRecolector": 1,
    "idAprobador": 20,
    "fechaProgramada": "2025-07-30"
}
*/
}

// =======================================
// POST PARA UBICACIONES
// =======================================
export async function postUbicacion(newUbicacion){
    if(!newUbicacion){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("Ubicaciones", newUbicacion);
    
    /* datos esperados
    {
    "direccion": "enrique segoviano",
    "latitud": 32.50112300,
    "longitud": -117.00345600
    }
    */
}
// =======================================
// POST PARA RutasEmpresas
// =======================================
export async function postRutasEmpresas(newRutaEmpresa){
    if(!newRutaEmpresa){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("RutasEmpresas", newRutaEmpresa);
    
    /* datos esperados
{
    "idRuta" : 3,
    "idEmpresa": 2,
    "orden": 2
}
    */
}

// =======================================
// POST PARA RutasPlantas
// =======================================
export async function postRutasPlantas(newRutaPlanta){
    if(!newRutaPlanta){
        throw new Error("Los datos no pueden estar vacíos");
    }
    return fetchPost("RutasPlantas", newRutaPlanta);
    
    /* datos esperados
{
    "idRuta" : 3,
    "idPlanta": 2
}
    */
}

// =======================================
// POST PARA CAMIONES
// =======================================
export async function postCamiones(newCamion){
  if(!newCamion){
    throw new Error("Los datos no pueden estar vacíos");
  }
  return fetchPost("Camiones", newCamion);
  
   /* datos esperados:
      {
        "placa": "ABC-1234",
        "marca": "Volvo",
        "anio": 2020,    
        "capacidadCarga": 5000,
        "modelo": "F150",
        "idUsuario": 4,
        "estado": "activo o inactivo"  
      }
      */
}