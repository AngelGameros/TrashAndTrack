import { getPlantas, getPlantasById, getPlantasByUbicacion } from "../DataConnection/Gets.js";

const btnFiltrar = document.getElementById("btnFiltrarPlantas");
const inputNombre = document.getElementById("inputNombrePlanta");
const inputUbicacion = document.getElementById("inputUbicacionPlanta");
const plantasContainer = document.getElementById("plantasContainer");

// Crear modal dinámicamente (igual que con empresas)
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

async function cargarTodasPlantas() {
  plantasContainer.textContent = "Cargando plantas...";
  try {
    const response = await getPlantas();
    if (response.status === 0 && Array.isArray(response.data)) {
      mostrarPlantas(response.data);
    } else {
      plantasContainer.textContent = "No se pudieron cargar las plantas.";
    }
  } catch (error) {
    plantasContainer.textContent = "Error al obtener las plantas.";
    console.error(error);
  }
}

async function cargarPlantaPorId(id) {
  plantasContainer.textContent = "Buscando planta por ID...";
  try {
    const response = await getPlantasById(id);
    if (response.status === 0 && response.data) {
      const plantas = Array.isArray(response.data) ? response.data : [response.data];
      mostrarPlantas(plantas);
    } else {
      plantasContainer.textContent = "No se encontró la planta con ese ID.";
    }
  } catch (error) {
    plantasContainer.textContent = "Error al buscar planta por ID.";
    console.error(error);
  }
}

async function cargarPlantasPorUbicacion(ubicacionId) {
  plantasContainer.textContent = "Buscando plantas por ubicación...";
  try {
    const response = await getPlantasByUbicacion(ubicacionId);
    if (response.status === 0 && Array.isArray(response.data)) {
      mostrarPlantas(response.data);
    } else {
      plantasContainer.textContent = "No se encontraron plantas para esa ubicación.";
    }
  } catch (error) {
    plantasContainer.textContent = "Error al buscar plantas por ubicación.";
    console.error(error);
  }
}

btnFiltrar.addEventListener("click", () => {
  const nombre = inputNombre.value.trim();
  const ubicacion = inputUbicacion.value.trim();

  if (nombre) {
    // Como no tienes getPlantasByNombre, aquí podemos cargar todas plantas y filtrar en cliente:
    filtrarPlantasPorNombre(nombre);
  } else if (ubicacion) {
    cargarPlantasPorUbicacion(ubicacion);
  } else {
    cargarTodasPlantas();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  cargarTodasPlantas();
});

// Función para mostrar plantas en el contenedor
function mostrarPlantas(plantas) {
  if (plantas.length === 0) {
    plantasContainer.innerHTML = "<p>No hay plantas registradas.</p>";
    return;
  }

  plantasContainer.innerHTML = "";
  plantas.forEach((planta) => {
    const div = document.createElement("div");
    div.classList.add("planta-card");

    div.innerHTML = `
      <h3>${planta.nombre}</h3>
      <p><strong>ID Ubicación:</strong> ${planta.idUbicacion}</p>
      <button class="btn-detalles" data-id="${planta.id}">Ver detalles</button>
    `;

    plantasContainer.appendChild(div);
  });

  // Evento para botones "Ver detalles"
  document.querySelectorAll(".btn-detalles").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idPlanta = e.target.getAttribute("data-id");
      const planta = plantas.find(pl => pl.id == idPlanta);
      mostrarDetallesPlanta(planta);
    });
  });
}

// Modal con detalles planta
function mostrarDetallesPlanta(planta) {
  modalBody.innerHTML = `
    <h2>Detalles de la Planta</h2>
    <p><strong>ID:</strong> ${planta.id}</p>
    <p><strong>Nombre:</strong> ${planta.nombre}</p>
    <p><strong>ID Ubicación:</strong> ${planta.idUbicacion}</p>
  `;
modal.classList.add("active"); // muestra el modal centrado

}

// Filtrar plantas por nombre en cliente
async function filtrarPlantasPorNombre(nombre) {
  plantasContainer.textContent = "Buscando plantas por nombre...";
  try {
    const response = await getPlantas(); // Traemos todas para filtrar localmente
    if (response.status === 0 && Array.isArray(response.data)) {
      const filtradas = response.data.filter(planta =>
        planta.nombre.toLowerCase().includes(nombre.toLowerCase())
      );
      mostrarPlantas(filtradas);
    } else {
      plantasContainer.textContent = "No se pudieron cargar las plantas para filtrar.";
    }
  } catch (error) {
    plantasContainer.textContent = "Error al filtrar plantas por nombre.";
    console.error(error);
  }
}
