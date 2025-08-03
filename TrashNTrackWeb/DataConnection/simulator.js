// simulator.js
import { postContainer } from './Post.js';

let simulatorInterval;
let selectedCollection = 'Contenedor Individual Shell'; // Colección por defecto

const containers = [
    { name: 'Contenedor Inteligente Orgánico', deviceId: "1", id_empresa: 1, type: '1', maxWeight: 200 },
    { name: 'Contenedor Básico Plástico', deviceId: "2", id_empresa: 1, type: '2', maxWeight: 500 },
    { name: 'Contenedor Químico Peligroso', deviceId: "3", id_empresa: 1, type: '3', maxWeight: 1500 },
    { name: 'Contenedor de Industrias ABC', deviceId: "4", id_empresa: 2, type: '4', maxWeight: 300 },
    { name: 'Contenedor de Metalurgica XYZ', deviceId: "5", id_empresa: 2, type: '5', maxWeight: 800 },
    { name: 'Contenedor de Quimicos SA', deviceId: "6", id_empresa: 2, type: '6', maxWeight: 1000 },
    { name: 'Contenedor de Textilera Fina', deviceId: "7", id_empresa: 9, type: '5', maxWeight: 400 },
    { name: 'Contenedor de Plastico Reciclado', deviceId: "8", id_empresa: 10, type: '4', maxWeight: 1200 },
    { name: 'Contenedor de Plastico Reciclado (1)', deviceId: "9", id_empresa: 10, type: '6', maxWeight: 600 }
];

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

function getRandomSensorValue(baseValue, maxVariation = 2.0) {
    const variation = (Math.random() * maxVariation * 2) - maxVariation;
    return parseFloat((baseValue + variation).toFixed(2));
}

function generateContainerData(containerConfig) {
    const baseToC = 25.0;
    const baseRH = 70.0;
    const baseCO2 = 400.0;
    const baseGLP = 10.0;
    const baseCH4 = 2.0;
    const baseH2 = 5.0;

    return {
        DeviceID: containerConfig.deviceId, // Correcto
        ClientID: containerConfig.clientId,
        Name: containerConfig.name,
        Status: "active",//Math.random() > 0.5 ? "active" : "inactive",
        Type: containerConfig.type,
        MaxWeight_kg: containerConfig.maxWeight,
        Values: {
            ToC: getRandomSensorValue(baseToC),
            RH: getRandomSensorValue(baseRH),
            CO2_PPM: getRandomSensorValue(baseCO2, 50.0),
            GLP_PPM: getRandomSensorValue(baseGLP, 5.0),
            CH4_PPM: getRandomSensorValue(baseCH4, 1.0),
            H2_PPM: getRandomSensorValue(baseH2, 2.0)
        }
    };
}

async function sendContainerData() {
    const containerConfig = containers.find(c => c.name === selectedCollection);
    if (!containerConfig) {
        logMessage(`Error: No se encontró la configuración para el contenedor seleccionado: ${selectedCollection}`, 'error');
        return;
    }

    const data = generateContainerData(containerConfig);
    logMessage(`Intentando enviar datos a la colección: ${selectedCollection} (DeviceID: ${data.DeviceID}, ClientID: ${data.ClientID})...`, 'info');
    try {
        const response = await postContainer(data, selectedCollection);
        logMessage(`Datos enviados exitosamente a la colección: ${selectedCollection}. Respuesta: ${JSON.stringify(response)}`, 'success');
    } catch (error) {
        logMessage(`Error al enviar datos a la colección: ${selectedCollection}. Error: ${error.message}`, 'error');
        console.error("Detalle del error:", error);
    }
}

export function startSimulator() {
    if (simulatorInterval) {
        logMessage("El simulador ya está en marcha.", 'warning');
        return;
    }
    logMessage(`Iniciando simulador para la colección: ${selectedCollection}...`, 'info');
    document.getElementById('containerSelector').disabled = true;
    sendContainerData();
    simulatorInterval = setInterval(sendContainerData, 3000);
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
}

export function stopSimulator() {
    if (!simulatorInterval) {
        logMessage("El simulador no está en marcha.", 'warning');
        return;
    }
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    logMessage("Simulador detenido.", 'info');
    document.getElementById('containerSelector').disabled = false;
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    const containerSelector = document.getElementById('containerSelector');
    
    containers.forEach(container => {
        const option = document.createElement('option');
        option.value = container.name;
        option.textContent = container.name;
        containerSelector.appendChild(option);
    });

    containerSelector.addEventListener('change', (event) => {
        selectedCollection = event.target.value;
        logMessage(`Contenedor seleccionado: ${selectedCollection}`, 'info');
    });

    document.getElementById('startButton').addEventListener('click', startSimulator);
    document.getElementById('stopButton').addEventListener('click', stopSimulator);
    document.getElementById('stopButton').disabled = true;
});