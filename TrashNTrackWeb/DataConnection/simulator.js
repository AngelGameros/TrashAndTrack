// simulator.js
import { postContainer } from './Post.js';

let simulatorInterval;
let containerCount = 0; // Contador para el nombre del contenedor

// Función para añadir mensajes al log en la página
function logMessage(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    p.className = `log-${type}`; // Para aplicar estilos CSS si los deseas
    logDiv.prepend(p); // Añadir al principio para ver los más recientes
    // Limitar el número de mensajes para no sobrecargar
    if (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

// Función para generar un número entero aleatorio en un rango
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para generar un número decimal aleatorio con pequeña variación
function getRandomSensorValue(baseValue, maxVariation = 2.0) {
    const variation = (Math.random() * maxVariation * 2) - maxVariation; // +/- maxVariation
    return parseFloat((baseValue + variation).toFixed(2)); // Redondear a 2 decimales
}

// Función para generar datos de un contenedor aleatorio
function generateRandomContainerData() {
    containerCount++;
    const deviceId = getRandomInt(1, 9);
    const clientId = getRandomInt(1, 9);
    const baseToC = 25.0; // Temperatura base
    const baseRH = 70.0; // Humedad base
    const baseCO2 = 400.0; // CO2 base
    const baseGLP = 10.0; // GLP base
    const baseCH4 = 2.0; // CH4 base
    const baseH2 = 5.0; // H2 base

    return {
        deviceId: deviceId,
        clientId: clientId,
        name: `Contenedor Simulado ${containerCount}`,
        status: Math.random() > 0.5 ? "active" : "inactive",
        type: ["standard", "refrigerated", "waste", "special"][getRandomInt(0, 3)],
        maxWeight_kg: getRandomInt(500, 2000) + Math.random(), // Peso aleatorio
        values: {
            device_id: deviceId, // Usar el mismo deviceId para la sección values
            ToC: getRandomSensorValue(baseToC),
            RH: getRandomSensorValue(baseRH),
            CO2_PPM: getRandomSensorValue(baseCO2, 50.0), // Mayor variación para CO2
            GLP_PPM: getRandomSensorValue(baseGLP, 5.0),
            CH4_PPM: getRandomSensorValue(baseCH4, 1.0),
            H2_PPM: getRandomSensorValue(baseH2, 2.0)
        }
    };
}

// Función para enviar un contenedor
async function sendContainerData() {
    const data = generateRandomContainerData();
    logMessage(`Intentando enviar datos para DeviceID: ${data.deviceId}, ClientID: ${data.clientId}...`, 'info');
    try {
        const response = await postContainer(data);
        logMessage(`Datos enviados exitosamente para DeviceID: ${data.deviceId}. Respuesta: ${JSON.stringify(response)}`, 'success');
    } catch (error) {
        logMessage(`Error al enviar datos para DeviceID: ${data.deviceId}. Error: ${error.message}`, 'error');
        console.error("Detalle del error:", error);
    }
}

// Función para iniciar el simulador
export function startSimulator() {
    if (simulatorInterval) {
        logMessage("El simulador ya está en marcha.", 'warning');
        return;
    }
    logMessage("Iniciando simulador...", 'info');
    sendContainerData(); // Envía el primer dato inmediatamente
    simulatorInterval = setInterval(sendContainerData, 3000); // Envía cada 3 segundos
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
}

// Función para detener el simulador
export function stopSimulator() {
    if (!simulatorInterval) {
        logMessage("El simulador no está en marcha.", 'warning');
        return;
    }
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    logMessage("Simulador detenido.", 'info');
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}

// Asignar funciones a los botones una vez que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', startSimulator);
    document.getElementById('stopButton').addEventListener('click', stopSimulator);
    document.getElementById('stopButton').disabled = true; // Deshabilitar al inicio
});