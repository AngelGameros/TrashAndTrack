import { getIncidentes } from '../DataConnection/Gets.js';

let todosLosIncidentes = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarIncidentes();
    agregarEventosDeFiltros();
    aplicarFiltros();
});

async function cargarIncidentes() {
    try {
        const respuesta = await getIncidentes();
        todosLosIncidentes = respuesta.data || [];
        console.log("Incidentes cargados:", todosLosIncidentes.length);
    } catch (error) {
        console.error("Error al cargar incidentes:", error);
    }
}

function agregarEventosDeFiltros() {
    document.getElementById("searchIncidentesInput").addEventListener("input", aplicarFiltros);
    document.getElementById("fechaIncidentesFilter").addEventListener("change", aplicarFiltros);
}

function aplicarFiltros() {
    const texto = document.getElementById("searchIncidentesInput").value.toLowerCase();
    const fechaFiltro = document.getElementById("fechaIncidentesFilter").value;

    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const filtrados = todosLosIncidentes.filter(incidente => {
        const coincideTexto =
            incidente.nombre.toLowerCase().includes(texto) ||
            incidente.descripcion.toLowerCase().includes(texto);

        const fechaIncidente = new Date(incidente.fechaIncidente);
        let coincideFecha = true;

        if (fechaFiltro === "hoy") {
            coincideFecha = fechaIncidente.toDateString() === hoy.toDateString();
        } else if (fechaFiltro === "semana") {
            coincideFecha = fechaIncidente >= inicioSemana && fechaIncidente <= hoy;
        } else if (fechaFiltro === "mes") {
            coincideFecha = fechaIncidente >= inicioMes && fechaIncidente <= hoy;
        }

        return coincideTexto && coincideFecha;
    });

    renderizarLista(filtrados);
}

function renderizarLista(lista) {
    const ul = document.getElementById("lista-incidentes");
    ul.innerHTML = "";

    if (lista.length === 0) {
        ul.innerHTML = "<p>No hay incidentes registrados.</p>";
        return;
    }

    lista.forEach((incidente) => {
        const item = document.createElement("li");
        item.classList.add("incidente-item");
        item.style.cursor = "pointer";
        item.innerHTML = `
            <strong>${incidente.nombre}</strong><br>
            Usuario: ${incidente.idUsuario}<br>
            Fecha: ${new Date(incidente.fechaIncidente).toLocaleString()}<br>
            Descripción: ${incidente.descripcion}<br>
            <img src="${incidente.photoUrl || 'https://via.placeholder.com/100'}" width="100" style="border-radius: 6px;">
            <hr>
        `;
        // Abrir modal al hacer clic en el incidente
        item.addEventListener('click', () => {
            mostrarModal(incidente);
        });
        ul.appendChild(item);
    });
}

// Mostrar modal con detalles del incidente
function mostrarModal(incidente) {
    document.getElementById("modalTitulo").textContent = incidente.nombre;
    document.getElementById("modalDescripcion").textContent = incidente.descripcion;
    document.getElementById("modalFecha").textContent = new Date(incidente.fechaIncidente).toLocaleString();
    document.getElementById("modalEstado").textContent = incidente.estado_incidente || "Pendiente";
    document.getElementById("modalUsuario").textContent = incidente.idUsuario;
    document.getElementById("modalImagen").src = incidente.photoUrl || 'https://via.placeholder.com/300';

    document.getElementById("modalIncidente").style.display = 'block';
}

// Cerrar modal
function cerrarModal() {
    document.getElementById("modalIncidente").style.display = 'none';
}

// Cerrar modal si haces clic fuera del contenido
window.addEventListener('click', (e) => {
    const modal = document.getElementById("modalIncidente");
    if (e.target === modal) {
        cerrarModal();
    }
});

// Cerrar modal con tecla ESC
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        cerrarModal();
    }
});
document.querySelector('.close-btn').addEventListener('click', cerrarModal);
