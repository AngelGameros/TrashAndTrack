import { getReportes } from '../DataConnection/Gets.js';

let todosLosReportes = [];

const inputBusqueda = document.getElementById('searchReportesInput');
const listaReportes = document.getElementById('lista-reportes');

document.addEventListener('DOMContentLoaded', async () => {
    await cargarReportes();
});

inputBusqueda.addEventListener('input', aplicarFiltro);

async function cargarReportes() {
    try {
        const respuesta = await getReportes();
        todosLosReportes = respuesta.data || [];
        mostrarReportes(todosLosReportes);
    } catch (error) {
        listaReportes.innerHTML = `<li>Error al cargar reportes.</li>`;
        console.error(error);
    }
}

function aplicarFiltro() {
    const texto = inputBusqueda.value.toLowerCase();
    const filtrados = todosLosReportes.filter(r =>
        (r.titulo || '').toLowerCase().includes(texto) ||
        (r.descripcion || '').toLowerCase().includes(texto)
    );
    mostrarReportes(filtrados);
}

function mostrarReportes(reportes) {
    if (reportes.length === 0) {
        listaReportes.innerHTML = '<li>No se encontraron reportes.</li>';
        return;
    }
    listaReportes.innerHTML = '';
    reportes.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.titulo} - ${new Date(r.fechaReporte).toLocaleDateString()}`;
        listaReportes.appendChild(li);
    });
}
