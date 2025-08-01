import { getPlantas, getUbicaciones } from "../DataConnection/Gets.js";

const inputNombre = document.getElementById("inputNombrePlanta");
const selectUbicacion = document.getElementById("selectUbicacionPlanta");
const plantasContainer = document.getElementById("plantasContainer");

let listaPlantas = [];
let listaUbicaciones = [];

const modal = document.createElement("div");
modal.id = "plantaModal";
modal.className = "planta-modal";
modal.innerHTML = `
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <div id="modalBody"></div>
  </div>
`;
document.body.appendChild(modal);

const modalBody = document.getElementById("modalBody");
const closeModal = modal.querySelector(".close-button");
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// ========== Cargar Datos Iniciales ==========
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const ubicacionesResponse = await getUbicaciones();
    if (Array.isArray(ubicacionesResponse.ubicaciones)) {
      listaUbicaciones = ubicacionesResponse.ubicaciones;
    }

    const plantasResponse = await getPlantas();
    if (plantasResponse.status === 0 && Array.isArray(plantasResponse.data)) {
      listaPlantas = plantasResponse.data;
      llenarSelectUbicaciones(); // llenamos el select con ubicaciones que tienen plantas
      filtrarPlantas(); // Mostrar todo inicialmente
    } else {
      plantasContainer.textContent = "No se pudieron cargar las plantas.";
    }
  } catch (err) {
    plantasContainer.textContent = "Error al cargar datos.";
    console.error(err);
  }
});

// ========== Eventos de filtro instantáneo ==========
inputNombre.addEventListener("input", filtrarPlantas);
selectUbicacion.addEventListener("change", filtrarPlantas);

// ========== Llenar select con ubicaciones que tengan plantas ==========
function llenarSelectUbicaciones() {
  // Obtener solo IDs de ubicaciones que tienen plantas
  const idsUbicacionesConPlantas = new Set(listaPlantas.map(p => p.idUbicacion));
  selectUbicacion.innerHTML = `<option value="">Todas las ubicaciones</option>`;
  listaUbicaciones.forEach((ubicacion) => {
    if (idsUbicacionesConPlantas.has(ubicacion.idUbicacion)) {
      const option = document.createElement("option");
      option.value = ubicacion.idUbicacion;
      option.textContent = ubicacion.direccion;
      selectUbicacion.appendChild(option);
    }
  });
}

// ========== Filtrar plantas según filtros ==========
function filtrarPlantas() {
  const nombreFiltro = inputNombre.value.trim().toLowerCase();
  const ubicacionFiltro = selectUbicacion.value;

  const plantasFiltradas = listaPlantas.filter(planta => {
    const coincideNombre = planta.nombre.toLowerCase().includes(nombreFiltro);
    const coincideUbicacion = ubicacionFiltro === "" || planta.idUbicacion === parseInt(ubicacionFiltro);
    return coincideNombre && coincideUbicacion;
  });

  mostrarPlantas(plantasFiltradas);
}

// ========== Mostrar plantas ==========
function mostrarPlantas(plantas) {
  if (plantas.length === 0) {
    plantasContainer.innerHTML = "<p>No hay plantas registradas que coincidan con los filtros.</p>";
    return;
  }

  plantasContainer.innerHTML = "";
  plantas.forEach(planta => {
    const div = document.createElement("div");
    div.classList.add("planta-card");

    const direccion = obtenerDireccion(planta.idUbicacion);

    div.innerHTML = `
      <h3>${planta.nombre}</h3>
      <p><strong>Ubicación:</strong> ${direccion}</p>
      <button class="btn-detalles" data-id="${planta.id}">Ver detalles</button>
    `;

    plantasContainer.appendChild(div);
  });

  // Agregar evento a botones "Ver detalles"
  document.querySelectorAll(".btn-detalles").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idPlanta = e.target.getAttribute("data-id");
      const planta = listaPlantas.find(p => p.id == idPlanta);
      mostrarDetallesPlanta(planta);
    });
  });
}

// ========== Mostrar detalles en modal ==========
function mostrarDetallesPlanta(planta) {
  const direccion = obtenerDireccion(planta.idUbicacion);
  modalBody.innerHTML = `
    <h2>Detalles de la Planta</h2>
    <p><strong>ID:</strong> ${planta.id}</p>
    <p><strong>Nombre:</strong> ${planta.nombre}</p>
    <p><strong>Ubicación:</strong> ${direccion}</p>
  `;
  modal.classList.add("active");
}

// ========== Obtener dirección desde ID ==========
function obtenerDireccion(idUbicacion) {
  const ubicacion = listaUbicaciones.find(u => u.idUbicacion === idUbicacion);
  return ubicacion ? ubicacion.direccion : `Ubicación ID ${idUbicacion}`;
}
