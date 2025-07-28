import { getCamiones,getRutas,getContenedores} from "../DataConnection/Gets.js";

async function loadInfo(){
    try{
        //llamada a los métodos
        const Camiones = await getCamiones();
        const Rutas = await getRutas();
        const Contenedores = await getContenedores();

        //mapeo de las funciones
        const infoCamiones = Camiones.camiones || [];
        const infoRutas = Rutas.data || [];
        const infoContenedores = Contenedores.data || [];

        //conteo de datos
        const totalCamiones = infoCamiones.length;
        const totalRutas = infoRutas.length;
        const totalContenedores = infoContenedores.length;

        const ContadorCamiones = document.getElementById("ContadorCamiones");
        const contadorContenedores = document.getElementById("contadorContenedores");
        const contadorRutas = document.getElementById("contadorRutas");
        if(ContadorCamiones){ContadorCamiones.textContent = totalCamiones;}
        if(contadorContenedores){contadorContenedores.textContent = totalContenedores;}
        if(contadorRutas){contadorRutas.textContent = totalRutas;}


    }
    catch(error){throw (error);}
}

document.addEventListener("DOMContentLoaded", loadInfo);

/*
// === GRÁFICA DE RENDIMIENTO (LINE CHART) ===
const performanceCtx = document.getElementById('performanceChart').getContext('2d');
new Chart(performanceCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Nivel promedio (%)',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
        }, {
            label: 'Capacidad máxima (%)',
            data: [],
            borderColor: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            tension: 0.4,
            fill: false,
            borderDash: [5, 5]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    font: { size: 11 }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    font: { size: 10 },
                    callback: value => value + '%'
                }
            },
            x: {
                ticks: { font: { size: 10 } }
            }
        }
    }
});

// === GRÁFICA DE DISTRIBUCIÓN (DOUGHNUT) ===
const distributionCtx = document.getElementById('distributionChart').getContext('2d');
new Chart(distributionCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                    padding: 10
                }
            }
        }
    }
});

// === TONELADAS RECOLECTADAS (BARRAS) ===
const analyticsCtx = document.getElementById('analyticsChart').getContext('2d');
new Chart(analyticsCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Toneladas recolectadas',
            data: [],
            backgroundColor: '#22d3ee',
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { display: false },
                ticks: {
                    font: { size: 10 },
                    callback: value => value + 't'
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
            }
        }
    }
});

// === TIEMPO PROMEDIO POR RUTA (BARRAS) ===
const avgTimeByRouteCtx = document.getElementById('avgTimeByRouteChart').getContext('2d');
new Chart(avgTimeByRouteCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Tiempo promedio (min)',
            data: [],
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Minutos'
                }
            }
        }
    }
});

// === EMISIONES DE CO₂ (LÍNEA) ===
const co2EmissionsCtx = document.getElementById('co2EmissionsChart').getContext('2d');
new Chart(co2EmissionsCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Emisiones (kg CO₂)',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    font: { size: 11 }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'kg CO₂'
                }
            }
        }
    }
});
*/

