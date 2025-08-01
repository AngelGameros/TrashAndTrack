import { getEmpresas, getUbicaciones } from "../DataConnection/Gets.js";

const inputNombre = document.getElementById("inputNombre");
const selectUbicacion = document.getElementById("selectUbicacion");
const empresasContainer = document.getElementById("empresasContainer");

let listaEmpresas = [];
let listaUbicaciones = [];

// Modal
const modal = document.createElement("div");
modal.id = "empresaModal";
modal.className = "empresa-modal";
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
    const empresasResponse = await getEmpresas();

    if (
      Array.isArray(ubicacionesResponse.ubicaciones) &&
      empresasResponse.status === 0 &&
      Array.isArray(empresasResponse.data)
    ) {
      listaEmpresas = empresasResponse.data;

      // IDs únicos de ubicaciones usadas por las empresas
      const ubicacionesEmpresasIds = [
        ...new Set(listaEmpresas.map((e) => e.idUbicacion)),
      ];

      // Filtrar las ubicaciones para solo las que usan las empresas
      listaUbicaciones = ubicacionesResponse.ubicaciones.filter((u) =>
        ubicacionesEmpresasIds.includes(u.idUbicacion)
      );

      llenarSelectUbicaciones();
      filtrarEmpresas(); // Mostrar todo inicialmente
    } else {
      empresasContainer.textContent =
        "No se pudieron cargar las empresas o ubicaciones.";
    }
  } catch (err) {
    empresasContainer.textContent = "Error al cargar datos.";
    console.error(err);
  }
});

// ========== Filtros automáticos ==========
if (inputNombre) {
  inputNombre.addEventListener("input", filtrarEmpresas);
}

if (selectUbicacion) {
  selectUbicacion.addEventListener("change", filtrarEmpresas);
}

// ========== Llenar Select ==========
function llenarSelectUbicaciones() {
  selectUbicacion.innerHTML = `<option value="">Todas las ubicaciones</option>`;
  listaUbicaciones.forEach((ubicacion) => {
    const option = document.createElement("option");
    option.value = ubicacion.idUbicacion;
    option.textContent = ubicacion.direccion;
    selectUbicacion.appendChild(option);
  });
}

// ========== Filtrar Empresas ==========
function filtrarEmpresas() {
  const nombreFiltro = inputNombre.value.trim().toLowerCase();
  const ubicacionFiltro = selectUbicacion.value;

  const empresasFiltradas = listaEmpresas.filter((empresa) => {
    const coincideNombre = empresa.nombre.toLowerCase().includes(nombreFiltro);
    const coincideUbicacion =
      ubicacionFiltro === "" || empresa.idUbicacion === parseInt(ubicacionFiltro);

    return coincideNombre && coincideUbicacion;
  });

  mostrarEmpresas(empresasFiltradas);
}

// ========== Mostrar Empresas ==========
function mostrarEmpresas(empresas) {
  if (empresas.length === 0) {
    empresasContainer.innerHTML =
      "<p>No hay empresas que coincidan con los filtros.</p>";
    return;
  }

  empresasContainer.innerHTML = "";
  empresas.forEach((empresa) => {
    const div = document.createElement("div");
    div.classList.add("empresa-card");

    const direccion = obtenerDireccion(empresa.idUbicacion);

    div.innerHTML = `
      <h3>${empresa.nombre}</h3>
      <p><strong>RFC:</strong> ${empresa.rfc}</p>
      <p><strong>Fecha Registro:</strong> ${empresa.fechaRegistro}</p>
      <p><strong>Ubicación:</strong> ${direccion}</p>
    `;

    empresasContainer.appendChild(div);
  });
}

// ========== Obtener Dirección desde ID ==========
function obtenerDireccion(idUbicacion) {
  const ubicacion = listaUbicaciones.find((u) => u.idUbicacion === idUbicacion);
  return ubicacion ? ubicacion.direccion : `Ubicación ID ${idUbicacion}`;
}
