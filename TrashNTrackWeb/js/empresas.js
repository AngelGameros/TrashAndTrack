import { getEmpresas, getEmpresasByUbicacion } from "../DataConnection/Gets.js";

const btnFiltrar = document.getElementById("btnFiltrar");
const inputNombre = document.getElementById("inputNombre");
const inputUbicacion = document.getElementById("inputUbicacion");
const empresasContainer = document.getElementById("empresasContainer");

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

async function cargarTodasEmpresas() {
  empresasContainer.textContent = "Cargando empresas...";
  try {
    const response = await getEmpresas();
    if (response.status === 0 && Array.isArray(response.data)) {
      mostrarEmpresas(response.data);
    } else {
      empresasContainer.textContent = "No se pudieron cargar las empresas.";
    }
  } catch (error) {
    empresasContainer.textContent = "Error al obtener las empresas.";
    console.error(error);
  }
}

async function cargarEmpresaPorNombre(nombre) {
  empresasContainer.textContent = "Buscando empresa por nombre...";
  try {
    const response = await getEmpresas(); // Traemos todas las empresas
    if (response.status === 0 && Array.isArray(response.data)) {
      // Filtrar por nombre (insensible a mayúsculas)
      const empresasFiltradas = response.data.filter(emp =>
        emp.nombre.toLowerCase().includes(nombre.toLowerCase())
      );

      if (empresasFiltradas.length > 0) {
        mostrarEmpresas(empresasFiltradas);
      } else {
        empresasContainer.textContent = "No se encontró ninguna empresa con ese nombre.";
      }
    } else {
      empresasContainer.textContent = "No se pudieron cargar las empresas.";
    }
  } catch (error) {
    empresasContainer.textContent = "Error al buscar empresa por nombre.";
    console.error(error);
  }
}

async function cargarEmpresasPorUbicacion(ubicacionId) {
  empresasContainer.textContent = "Buscando empresas por ubicación...";
  try {
    const response = await getEmpresasByUbicacion(ubicacionId);
    if (response.status === 0 && Array.isArray(response.data)) {
      mostrarEmpresas(response.data);
    } else {
      empresasContainer.textContent = "No se encontraron empresas para esa ubicación.";
    }
  } catch (error) {
    empresasContainer.textContent = "Error al buscar empresas por ubicación.";
    console.error(error);
  }
}

btnFiltrar.addEventListener("click", () => {
  const nombre = inputNombre.value.trim();
  const ubicacion = inputUbicacion.value.trim();

  if (nombre) {
    cargarEmpresaPorNombre(nombre);
  } else if (ubicacion) {
    cargarEmpresasPorUbicacion(ubicacion);
  } else {
    cargarTodasEmpresas();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  cargarTodasEmpresas();
});

function mostrarEmpresas(empresas) {
  if (empresas.length === 0) {
    empresasContainer.innerHTML = "<p>No hay empresas registradas.</p>";
    return;
  }

  empresasContainer.innerHTML = "";
  empresas.forEach((empresa) => {
    const div = document.createElement("div");
    div.classList.add("empresa-card");

    div.innerHTML = `
      <h3>${empresa.nombre}</h3>
      <p><strong>RFC:</strong> ${empresa.rfc}</p>
      <p><strong>Fecha Registro:</strong> ${empresa.fechaRegistro}</p>
      <p><strong>Ubicación:</strong> ${empresa.idUbicacion}</p>
    `;

    empresasContainer.appendChild(div);
  });

}
