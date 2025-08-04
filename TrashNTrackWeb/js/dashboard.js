import { getCamiones,getRutas,getContenedores} from "../DataConnection/Gets.js";
import { containers, selectedCollection, initCharts, updateCharts } from '../DataConnection/simulator.js';


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

export function updateGrafica() {
  let selectedCollection = 'ContenedorInteligenteOrganico';

  const selector = document.getElementById('containerSelector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      selectedCollection = e.target.value;
      initCharts(selectedCollection);
    });
  }

  console.log("Dashboard cargado, inicializando gráficas con:", selectedCollection);
  initCharts(selectedCollection);

  setInterval(() => {
    updateCharts(selectedCollection);
  }, 3000);
}


document.addEventListener('DOMContentLoaded', () => {
  updateGrafica();
});
