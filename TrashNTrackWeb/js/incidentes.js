import { getIncidentes, getUserById } from "../DataConnection/Gets.js"

let todosLosIncidentes = []

document.addEventListener("DOMContentLoaded", async () => {
  await cargarIncidentes()
  agregarEventosDeFiltros()
  aplicarFiltros()
})

async function cargarIncidentes() {
  try {
    // Mostrar estado de carga
    mostrarEstadoCarga(true)

    const respuesta = await getIncidentes()
    const incidentesOriginales = respuesta.data || []

    console.log("Incidentes obtenidos:", incidentesOriginales.length)

    // Obtener información de usuarios para cada incidente
    todosLosIncidentes = await Promise.all(
      incidentesOriginales.map(async (incidente) => {
        try {
          const usuarioResponse = await getUserById(incidente.idUsuario)
          const usuario = usuarioResponse.usuario

          const nombreCompleto = usuario
            ? `${usuario.nombre} ${usuario.primerApellido} ${usuario.segundoApellido}`
            : "Usuario Desconocido"

          return {
            ...incidente,
            nombreCompleto,
            usuario, // Guardamos también el objeto usuario completo
          }
        } catch (error) {
          console.error(`Error al obtener usuario ${incidente.idUsuario}:`, error)
          return {
            ...incidente,
            nombreCompleto: "Usuario Desconocido",
            usuario: null,
          }
        }
      }),
    )

    console.log("Incidentes con usuarios cargados:", todosLosIncidentes.length)
  } catch (error) {
    console.error("Error al cargar incidentes:", error)
    mostrarErrorCarga()
  } finally {
    mostrarEstadoCarga(false)
  }
}

function agregarEventosDeFiltros() {
  document.getElementById("searchIncidentesInput").addEventListener("input", aplicarFiltros)
  document.getElementById("fechaIncidentesFilter").addEventListener("change", aplicarFiltros)
}

function aplicarFiltros() {
  const texto = document.getElementById("searchIncidentesInput").value.toLowerCase()
  const fechaFiltro = document.getElementById("fechaIncidentesFilter").value

  const hoy = new Date()
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - hoy.getDay())
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const filtrados = todosLosIncidentes.filter((incidente) => {
    // Buscar en nombre, descripción Y nombre del usuario
    const coincideTexto =
      incidente.nombre.toLowerCase().includes(texto) ||
      incidente.descripcion.toLowerCase().includes(texto) ||
      incidente.nombreCompleto.toLowerCase().includes(texto)

    const fechaIncidente = new Date(incidente.fechaIncidente)
    let coincideFecha = true

    if (fechaFiltro === "hoy") {
      coincideFecha = fechaIncidente.toDateString() === hoy.toDateString()
    } else if (fechaFiltro === "semana") {
      coincideFecha = fechaIncidente >= inicioSemana && fechaIncidente <= hoy
    } else if (fechaFiltro === "mes") {
      coincideFecha = fechaIncidente >= inicioMes && fechaIncidente <= hoy
    }

    return coincideTexto && coincideFecha
  })

  renderizarLista(filtrados)
}

function renderizarLista(lista) {
  const ul = document.getElementById("lista-incidentes")
  ul.innerHTML = ""

  if (lista.length === 0) {
    ul.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No se encontraron incidentes</h3>
                <p>No hay incidentes que coincidan con los filtros aplicados.</p>
            </div>
        `
    return
  }

  lista.forEach((incidente) => {
    const item = document.createElement("li")
    item.classList.add("incidente-item")
    item.style.cursor = "pointer"

    // Determinar el estado y su clase CSS
    const estadoClass = getEstadoClass(incidente.estado_incidente)
    const estadoTexto = incidente.estado_incidente || "Pendiente"

    item.innerHTML = `
            <div class="incidente-header">
                <div class="incidente-info">
                    <h3 class="incidente-titulo">${incidente.nombre}</h3>
                    <div class="incidente-meta">
                        <span class="meta-item">
                            <i class="fas fa-user"></i>
                            <strong>${incidente.nombreCompleto}</strong>
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            ${formatearFecha(incidente.fechaIncidente)}
                        </span>
                        <span class="status-badge ${estadoClass}">
                            ${estadoTexto}
                        </span>
                    </div>
                </div>
                <div class="incidente-imagen">
                    <img src="${incidente.photoUrl || "https://via.placeholder.com/80"}" 
                         alt="Imagen del incidente" 
                         onerror="this.src='https://via.placeholder.com/80'">
                </div>
            </div>
            <div class="incidente-descripcion">
                <p>${truncarTexto(incidente.descripcion, 120)}</p>
            </div>
            <div class="incidente-actions">
                <span class="ver-detalles">
                    <i class="fas fa-eye"></i> Ver detalles
                </span>
            </div>
        `

    // Abrir modal al hacer clic en el incidente
    item.addEventListener("click", () => {
      mostrarModal(incidente)
    })

    ul.appendChild(item)
  })
}

// Mostrar modal con detalles del incidente (actualizado)
function mostrarModal(incidente) {
  document.getElementById("modalTitulo").textContent = incidente.nombre
  document.getElementById("modalDescripcion").textContent = incidente.descripcion
  document.getElementById("modalFecha").textContent = formatearFechaCompleta(incidente.fechaIncidente)
  document.getElementById("modalEstado").textContent = incidente.estado_incidente || "Pendiente"

  // Mostrar nombre completo en lugar del ID
  document.getElementById("modalUsuario").textContent = incidente.nombreCompleto

  // Si tienes un elemento adicional para mostrar más info del usuario
  const modalUsuarioDetalle = document.getElementById("modalUsuarioDetalle")
  if (modalUsuarioDetalle && incidente.usuario) {
    modalUsuarioDetalle.innerHTML = `
            <div class="usuario-detalle">
                <h4>Información del Usuario</h4>
                <p><strong>Nombre:</strong> ${incidente.nombreCompleto}</p>
                <p><strong>ID:</strong> ${incidente.idUsuario}</p>
            </div>
        `
  }

  document.getElementById("modalImagen").src = incidente.photoUrl || "https://via.placeholder.com/300"
  document.getElementById("modalIncidente").style.display = "block"
}

// Funciones auxiliares
function mostrarEstadoCarga(mostrar) {
  const loadingElement = document.getElementById("loadingIncidentes")
  if (loadingElement) {
    loadingElement.style.display = mostrar ? "block" : "none"
  }
}

function mostrarErrorCarga() {
  const ul = document.getElementById("lista-incidentes")
  ul.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar incidentes</h3>
            <p>No se pudieron cargar los incidentes. Intenta recargar la página.</p>
            <button onclick="location.reload()" class="btn-reload">
                <i class="fas fa-redo"></i> Recargar
            </button>
        </div>
    `
}

function getEstadoClass(estado) {
  if (!estado) return "pending"

  const estadoLower = estado.toLowerCase()
  if (estadoLower.includes("resuelto") || estadoLower.includes("completado")) {
    return "active"
  } else if (estadoLower.includes("pendiente") || estadoLower.includes("nuevo")) {
    return "pending"
  } else if (estadoLower.includes("proceso") || estadoLower.includes("progreso")) {
    return "processing"
  } else {
    return "inactive"
  }
}

function formatearFecha(fechaString) {
  if (!fechaString) return "Fecha no disponible"

  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatearFechaCompleta(fechaString) {
  if (!fechaString) return "Fecha no disponible"

  const fecha = new Date(fechaString)
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function truncarTexto(texto, limite) {
  if (!texto) return "Sin descripción"
  if (texto.length <= limite) return texto
  return texto.substring(0, limite) + "..."
}

// Cerrar modal
function cerrarModal() {
  document.getElementById("modalIncidente").style.display = "none"
}

// Event listeners para cerrar modal
window.addEventListener("click", (e) => {
  const modal = document.getElementById("modalIncidente")
  if (e.target === modal) {
    cerrarModal()
  }
})

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal()
  }
})

// Asegurarse de que el botón de cerrar funcione
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".close-btn")
  if (closeBtn) {
    closeBtn.addEventListener("click", cerrarModal)
  }
})

// Hacer la función global para el botón de recarga
window.cerrarModal = cerrarModal
