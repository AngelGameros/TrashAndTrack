document.addEventListener("DOMContentLoaded", function () {
  const sidebarHTML = `
    <aside class="sidebar">
        <div class="logo">
            <h2>Trash & Track</h2>
        </div>

        <div class="nav-group">
            <div class="nav-group-label">Módulos Principales</div>
            <ul class="nav-menu">
                <li class="nav-item"><a href="dashboard.html" class="nav-link"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></a></li>
                <li class="nav-item"><a href="empresas.html" class="nav-link"><i class="fas fa-building"></i><span>Empresas</span></a></li>
                <li class="nav-item"><a href="plantas.html" class="nav-link"><i class="fas fa-industry"></i><span>Plantas</span></a></li>
                <li class="nav-item"><a href="camiones.html" class="nav-link"><i class="fas fa-truck"></i><span>Camiones</span></a></li>
                <li class="nav-item"><a href="rutas.html" class="nav-link"><i class="fas fa-route"></i><span>Rutas</span></a></li>
                <li class="nav-item"><a href="contenedores.html" class="nav-link"><i class="fas fa-box"></i><span>Contenedores</span></a></li>
                <li class="nav-item"><a href="incidentes.html" class="nav-link"><i class="fas fa-exclamation-triangle"></i><span>Incidentes</span></a></li>
                <li class="nav-item"><a href="reportes.html" class="nav-link"><i class="fas fa-chart-bar"></i><span>Reportes</span></a></li>
            </ul>
        </div>

        <div class="nav-group">
            <div class="nav-group-label">Sistema</div>
            <ul class="nav-menu">
                <li class="nav-item"><a href="configuracion.html" class="nav-link"><i class="fas fa-cog"></i><span>Configuración</span></a></li>
                <li class="nav-item"><a href="equipo.html" class="nav-link"><i class="fas fa-users"></i><span>Equipo</span></a></li>
                <!-- NUEVO BOTÓN DE CHAT -->
                <li class="nav-item"><a href="chat.html" class="nav-link"><i class="fas fa-comments"></i><span>Chat con usuarios</span></a></li>
            </ul>
        </div>

        <div class="sidebar-footer">
            <div class="footer-item">
                <div class="user-info">
                    <i class="fas fa-user-circle"></i>
                    <div><div class="user-name">Admin Usuario</div></div>
                </div>
            </div>
        </div>
    </aside>
  `;

  const placeholder = document.getElementById("sidebar-placeholder");
  if (placeholder) {
    placeholder.innerHTML = sidebarHTML;

    // Resaltar la opción actual si coincide con la URL
    const links = placeholder.querySelectorAll(".nav-link");
    links.forEach(link => {
      if (window.location.href.includes(link.getAttribute("href"))) {
        link.classList.add("active");
      }
    });
  }
});
