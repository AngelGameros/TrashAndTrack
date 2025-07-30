import { getEmpresas, getEmpresasById, getEmpresasByUbicacion } from "../DataConnection/Gets.js";

const btnFiltrar = document.getElementById("btnFiltrar");
const inputId = document.getElementById("inputId");
const inputUbicacion = document.getElementById("inputUbicacion");
const empresasContainer = document.getElementById("empresasContainer");

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

async function cargarEmpresaPorId(id) {
  empresasContainer.textContent = "Buscando empresa por ID...";
  try {
    const response = await getEmpresasById(id);
    if (response.status === 0 && response.data) {
      const empresas = Array.isArray(response.data) ? response.data : [response.data];
      mostrarEmpresas(empresas);
    } else {
      empresasContainer.textContent = "No se encontró la empresa con ese ID.";
    }
  } catch (error) {
    empresasContainer.textContent = "Error al buscar empresa por ID.";
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
  const id = inputId.value.trim();
  const ubicacion = inputUbicacion.value.trim();

  if (id) {
    cargarEmpresaPorId(id);
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
    div.classList.add("empresa-item");
    div.innerHTML = `
      <h3>${empresa.nombre}</h3>
      <p><strong>RFC:</strong> ${empresa.rfc}</p>
      <p><strong>Fecha Registro:</strong> ${empresa.fechaRegistro}</p>
      <p><strong>ID Ubicación:</strong> ${empresa.idUbicacion}</p>
    `;
    empresasContainer.appendChild(div);
  });
}
