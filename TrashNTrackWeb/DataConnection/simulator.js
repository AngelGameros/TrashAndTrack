// simulator.js
import { postContainer } from './Post.js';

let simulatorInterval;
let containerCount = 0; // Contador para el nombre del contenedor
let selectedCollection = 'Contenedor Individual Shell'; // Colección por defecto

// Aquí defines los 9 contenedores. El "name" es el nombre de la colección en tu caso.
const containers = [
    { name: 'device-1', deviceId: 101, clientId: 2001, type: 'small', maxWeight: 200 },
    { name: 'device-2', deviceId: 102, clientId: 2002, type: 'large', maxWeight: 500 },
    { name: 'device-3', deviceId: 103, clientId: 2003, type: 'refrigerated', maxWeight: 1500 },
    { name: 'device-4', deviceId: 104, clientId: 2004, type: 'small', maxWeight: 300 },
    { name: 'device-5', deviceId: 105, clientId: 2005, type: 'waste', maxWeight: 800 },
    { name: 'device-6', deviceId: 106, clientId: 2006, type: 'special', maxWeight: 1000 },
    { name: 'device-7', deviceId: 107, clientId: 2007, type: 'small', maxWeight: 400 },
    { name: 'device-8', deviceId: 108, clientId: 2008, type: 'refrigerated', maxWeight: 1200 },
    { name: 'device-9', deviceId: 109, clientId: 2009, type: 'large', maxWeight: 600 }
];

// Función para añadir mensajes al log en la página
function logMessage(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    p.className = `log-${type}`;
    logDiv.prepend(p);
    if (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

// Función para generar un número decimal aleatorio con pequeña variación
function getRandomSensorValue(baseValue, maxVariation = 2.0) {
    const variation = (Math.random() * maxVariation * 2) - maxVariation;
    return parseFloat((baseValue + variation).toFixed(2));
}

// Función para generar un número entero aleatorio en un rango
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para generar datos de un contenedor con base en el objeto de configuración
function generateContainerData(containerConfig) {
    const baseToC = 25.0; // Temperatura base
    const baseRH = 70.0; // Humedad base
    const baseCO2 = 400.0; // CO2 base
    const baseGLP = 10.0; // GLP base
    const baseCH4 = 2.0; // CH4 base
    const baseH2 = 5.0; // H2 base

    return {
        deviceId: containerConfig.deviceId,
        clientId: containerConfig.clientId,
        name: containerConfig.name,
        status: Math.random() > 0.5 ? "active" : "inactive",
        type: containerConfig.type,
        maxWeight_kg: containerConfig.maxWeight + getRandomSensorValue(0, 10), // Pequeña variación en el peso
        values: {
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
    const containerConfig = containers.find(c => c.name === selectedCollection);
    if (!containerConfig) {
        logMessage(`Error: No se encontró la configuración para el contenedor seleccionado: ${selectedCollection}`, 'error');
        return;
    }

    const data = generateContainerData(containerConfig);
    logMessage(`Intentando enviar datos a la colección: ${selectedCollection} (DeviceID: ${data.deviceId}, ClientID: ${data.clientId})...`, 'info');
    try {
        const response = await postContainer(data, selectedCollection);
        logMessage(`Datos enviados exitosamente a la colección: ${selectedCollection}. Respuesta: ${JSON.stringify(response)}`, 'success');
    } catch (error) {
        logMessage(`Error al enviar datos a la colección: ${selectedCollection}. Error: ${error.message}`, 'error');
        console.error("Detalle del error:", error);
    }
}

// Función para iniciar el simulador
export function startSimulator() {
    if (simulatorInterval) {
        logMessage("El simulador ya está en marcha.", 'warning');
        return;
    }
    logMessage(`Iniciando simulador para la colección: ${selectedCollection}...`, 'info');
    document.getElementById('containerSelector').disabled = true; // Deshabilitar selector al iniciar
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
    document.getElementById('containerSelector').disabled = false; // Habilitar selector al detener
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}

// Asignar funciones a los botones y manejar el selector de contenedores
document.addEventListener('DOMContentLoaded', () => {
    const containerSelector = document.getElementById('containerSelector');
    
    // Rellenar el selector con los nombres de los contenedores
    containers.forEach(container => {
        const option = document.createElement('option');
        option.value = container.name;
        option.textContent = container.name;
        containerSelector.appendChild(option);
    });

    // Manejar el cambio en el selector
    containerSelector.addEventListener('change', (event) => {
        selectedCollection = event.target.value;
        logMessage(`Contenedor seleccionado: ${selectedCollection}`, 'info');
    });

    document.getElementById('startButton').addEventListener('click', startSimulator);
    document.getElementById('stopButton').addEventListener('click', stopSimulator);
    document.getElementById('stopButton').disabled = true; // Deshabilitar al inicio
});