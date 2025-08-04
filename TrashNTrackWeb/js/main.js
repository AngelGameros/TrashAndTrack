//import
import { showSideMenu, loadComponent } from './sidebar.js';
import { updateGrafica } from './dashboard.js';

//event
window.addEventListener('load', init);

//initialize document
function init() {
    console.log('Initializing Application...');
    showSideMenu(); //show side menu
    updateGrafica();
}