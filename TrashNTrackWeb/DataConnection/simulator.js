// simulator.js
import { postContainer } from './Post.js';
import { getContainer } from './Gets.js';

export const sensorAliasMap = {
  toC:    'ToC',
  rh:     'RH',
  cO2_PPM:'CO2_PPM',
  glP_PPM:'GLP_PPM',
  cH4_PPM:'CH4_PPM',
  h2_PPM: 'H2_PPM'
};

export const sensorCharts = {};
export let selectedCollection = 'ContenedorInteligenteOrganico';

export const containers = [
  { name: 'ContenedorInteligenteOrganico', deviceId: "1", id_empresa: 1, type: '1', maxWeight: 200 },
  { name: 'ContenedorBasicoPlastico',       deviceId: "2", id_empresa: 1, type: '2', maxWeight: 500 },
  { name: 'ContenedorQuimicoPeligroso',      deviceId: "3", id_empresa: 1, type: '3', maxWeight: 1500 },
  { name: 'ContenedorIndustriasABC',         deviceId: "4", id_empresa: 2, type: '4', maxWeight: 300 },
  { name: 'ContenedorMetalurgicaXYZ',        deviceId: "5", id_empresa: 2, type: '5', maxWeight: 800 },
  { name: 'ContenedorQuimicosSA',            deviceId: "6", id_empresa: 2, type: '6', maxWeight: 1000 },
  { name: 'ContenedorTextileraFina',         deviceId: "7", id_empresa: 9, type: '5', maxWeight: 400 },
  { name: 'ContenedorPlasticoReciclado',     deviceId: "8", id_empresa: 10,type: '4', maxWeight: 1200 },
  { name: 'ContenedorPlasticoReciclado',     deviceId: "9", id_empresa: 10,type: '6', maxWeight: 600 }
];

let simulatorInterval = null;
let chartUpdateInterval = null;

function getRandomSensorValue(baseValue, maxVariation = 2.0) {
  const variation = (Math.random() * maxVariation * 2) - maxVariation;
  return parseFloat((baseValue + variation).toFixed(2));
}

export function generateContainerData(containerConfig) {
  return {
    DeviceID:   containerConfig.deviceId,
    id_empresa: containerConfig.id_empresa,
    Name:       containerConfig.name,
    Status:     "active",
    Type:       containerConfig.type,
    MaxWeight_kg: containerConfig.maxWeight,
    Values: {
      ToC:     getRandomSensorValue(25.0),
      RH:      getRandomSensorValue(70.0),
      CO2_PPM: getRandomSensorValue(400.0, 50.0),
      GLP_PPM: getRandomSensorValue(10.0, 5.0),
      CH4_PPM: getRandomSensorValue(2.0, 1.0),
      H2_PPM:  getRandomSensorValue(5.0, 2.0)
    },
    createdAt: new Date().toISOString()
  };
}

export function sendContainerData(logCallback) {
  const cfg = containers.find(c => c.name === selectedCollection);
  if (!cfg) {
    logCallback?.(`Error: no existe configuración para "${selectedCollection}"`, 'error');
    return;
  }

  const payload = generateContainerData(cfg);
  logCallback?.(`Enviando datos a "${selectedCollection}"…`, 'info');

  postContainer(payload, selectedCollection)
    .then(res => {
      logCallback?.(`Envío exitoso: ${JSON.stringify(res)}`, 'success');
    })
    .catch(err => {
      logCallback?.(`Error enviando datos: ${err.message}`, 'error');
      console.error(err);
    });
}

export function initCharts(collection) {
  Object.values(sensorAliasMap).forEach(sensor => {
    if (sensorCharts[sensor]) {
      sensorCharts[sensor].destroy();
    }
    const el = document.getElementById(`chart-${sensor}`);
    if (!el) return;
    sensorCharts[sensor] = Highcharts.chart(el, {
      chart: { type: 'line' },
      title: { text: sensor },
      series: [{ name: sensor, data: [] }],
      xAxis: { type: 'datetime' }
    });
  });

  updateCharts(collection);
}

export async function updateCharts(collection) {
  try {
    const resp = await getContainer(collection);
    const items = Array.isArray(resp?.data) ? resp.data
                : Array.isArray(resp)      ? resp
                : [];

    if (!items.length) return;

    const seriesData = {};
    items.forEach(item => {
      const raw = item.Values || item.values;
      const ts  = new Date(item.updatedAt || item.createdAt).getTime();
      Object.entries(raw).forEach(([k, v]) => {
        const key = sensorAliasMap[k];
        if (!key) return;
        seriesData[key] = seriesData[key] || [];
        seriesData[key].push([ts, v]);
      });
    });

    Object.entries(seriesData).forEach(([sensor, data]) => {
      const chart = sensorCharts[sensor];
      if (chart) chart.series[0].setData(data, true);
    });
  } catch (err) {
    console.error('Error actualizando gráficas:', err);
  }
}

export function startSimulator(logCallback) {
  if (simulatorInterval) {
    logCallback?.('El simulador ya está activo.', 'warning');
    return;
  }
  logCallback?.(`Simulador iniciado para "${selectedCollection}"`, 'success');
  sendContainerData(logCallback);
  simulatorInterval = setInterval(() => sendContainerData(logCallback), 3000);
  startChartsUpdate(logCallback);
}

export function stopSimulator(logCallback) {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    logCallback?.('Simulador detenido.', 'info');
  }
  stopChartsUpdate(logCallback);
}

export function startChartsUpdate(logCallback) {
  stopChartsUpdate();
  chartUpdateInterval = setInterval(() => updateCharts(selectedCollection), 5000);
  logCallback?.('Actualización de gráficas automática iniciada.', 'info');
}

export function stopChartsUpdate(logCallback) {
  if (chartUpdateInterval) {
    clearInterval(chartUpdateInterval);
    chartUpdateInterval = null;
    logCallback?.('Actualización de gráficas detenida.', 'info');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const selector   = document.getElementById('containerSelector');
  const btnStart   = document.getElementById('startButton');
  const btnStop    = document.getElementById('stopButton');
  const btnRefresh = document.getElementById('refreshButton');
  const logDiv     = document.getElementById('log');

  // logging helper
  function logMessage(msg, type = 'info') {
    if (!logDiv) return;
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    p.className = type;
    logDiv.prepend(p);
    while (logDiv.children.length > 50) {
      logDiv.removeChild(logDiv.lastChild);
    }
  }

  // llenar <select> con contenedores
  containers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    selector.appendChild(opt);
  });

  // estado inicial
  selector.value  = selectedCollection;
  btnStop.disabled = true;
  initCharts(selectedCollection);

  // cambiar colección
  selector.addEventListener('change', () => {
    selectedCollection = selector.value;
    logMessage(`Contenedor seleccionado: ${selectedCollection}`, 'info');
    initCharts(selectedCollection);
  });

  // iniciar
  btnStart.addEventListener('click', () => {
    startSimulator(logMessage);
    btnStart.disabled = true;
    btnStop.disabled  = false;
    selector.disabled = true;
  });

  // detener
  btnStop.addEventListener('click', () => {
    stopSimulator(logMessage);
    btnStart.disabled = false;
    btnStop.disabled  = true;
    selector.disabled = false;
  });

  // refrescar gráficas manual
  btnRefresh.addEventListener('click', () => {
    updateCharts(selectedCollection);
  });
});