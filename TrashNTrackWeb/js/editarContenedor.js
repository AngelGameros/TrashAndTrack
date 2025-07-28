import { loadContainersFromLocalStorage, saveContainersToLocalStorage, renderContainers, displayFieldError, validateDescripcion, TIPO_RESIDUOS_DATA, TIPO_CONTENEDORES_DATA, showViewContainerModal, showEditContainerModal, attachButtonListeners } from '../js/contenedores.js';

        // Función para cargar opciones en los select de edición
        function populateEditSelects() {
            const editTipoResiduoSelect = document.getElementById('editTipoResiduo');
            editTipoResiduoSelect.innerHTML = '<option value="">Seleccione un tipo de residuo</option>';
            TIPO_RESIDUOS_DATA.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                editTipoResiduoSelect.appendChild(option);
            });

            const editTipoContenedorSelect = document.getElementById('editTipoContenedor');
            editTipoContenedorSelect.innerHTML = '<option value="">Seleccione un tipo de contenedor</option>';
            TIPO_CONTENEDORES_DATA.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                editTipoContenedorSelect.appendChild(option);
            });
        }

        // Manejar el envío del formulario de Edición de Contenedor
        document.getElementById('editContainerForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const containerId = document.getElementById('editContainerId').value;
            
            // Limpiar mensajes de error previos del modal de edición
            displayFieldError('Descripcion', '', true);
            displayFieldError('FechaRegistro', '', true);
            displayFieldError('TipoResiduo', '', true);
            displayFieldError('TipoContenedor', '', true);

            const editDescripcion = document.getElementById('editDescripcion').value;
            const editFechaRegistro = document.getElementById('editFechaRegistro').value;
            const editTipoResiduoId = parseInt(document.getElementById('editTipoResiduo').value);
            const editTipoContenedorId = parseInt(document.getElementById('editTipoContenedor').value);

            let isValid = true;

            // Validaciones para el modal de edición
            const descripcionError = validateDescripcion(editDescripcion);
            if (descripcionError) {
                displayFieldError('Descripcion', descripcionError, true);
                isValid = false;
            }
            if (!editFechaRegistro) {
                displayFieldError('FechaRegistro', 'La fecha de registro es obligatoria.', true);
                isValid = false;
            }
            if (isNaN(editTipoResiduoId)) {
                displayFieldError('TipoResiduo', 'Debe seleccionar un tipo de residuo.', true);
                isValid = false;
            }
            if (isNaN(editTipoContenedorId)) {
                displayFieldError('TipoContenedor', 'Debe seleccionar un tipo de contenedor.', true);
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Obtener nombres y capacidad máxima para guardar en el objeto del contenedor
            const tipoResiduo = TIPO_RESIDUOS_DATA.find(t => t.id === editTipoResiduoId);
            const tipoContenedor = TIPO_CONTENEDORES_DATA.find(t => t.id === editTipoContenedorId);

            const updatedData = {
                descripcion: editDescripcion,
                fecha_registro: editFechaRegistro,
                id_tipo_residuo: editTipoResiduoId,
                tipo_residuo_nombre: tipoResiduo ? tipoResiduo.nombre : 'Desconocido',
                id_tipo_contenedor: editTipoContenedorId,
                tipo_contenedor_nombre: tipoContenedor ? tipoContenedor.nombre : 'Desconocido',
                capacidad_maxima_contenedor: tipoContenedor ? tipoContenedor.capacidad_maxima : null,
            };

            // Encontrar el índice del contenedor y actualizarlo
            let containers = loadContainersFromLocalStorage(); // Cargar la lista actual
            const containerIndex = containers.findIndex(c => c.id === containerId);
            if (containerIndex !== -1) {
                containers[containerIndex] = { ...containers[containerIndex], ...updatedData };
                saveContainersToLocalStorage(containers); // Guardar los cambios en localStorage
                renderContainers(); // Volver a renderizar para reflejar los cambios
                console.log("Contenedor actualizado exitosamente en localStorage!");
                window.closeModal('editContainerModal'); // Usar window.closeModal
            } else {
                console.error("Error: Contenedor no encontrado para actualizar en localStorage.");
            }
        });

        // Cargar y renderizar contenedores cuando la ventana se carga
        window.onload = () => {
            let currentContainers = loadContainersFromLocalStorage();
            if (currentContainers.length === 0) {
                // Si no hay contenedores en localStorage, precargar algunos datos de ejemplo
                const initialContainers = [
                    { id: 'BOTE-001', descripcion: 'Contenedor para residuos químicos del laboratorio principal.', fecha_registro: '2024-01-15', id_empresa: 'simulated-company-id', id_tipo_residuo: 1, tipo_residuo_nombre: 'Químicos', id_tipo_contenedor: 102, tipo_contenedor_nombre: 'Contenedor IBC 1000L', capacidad_maxima_contenedor: 1000 },
                    { id: 'BOTE-002', descripcion: 'Bote para desechos biológicos de la sala de cirugía.', fecha_registro: '2024-02-20', id_empresa: 'simulated-company-id', id_tipo_residuo: 2, tipo_residuo_nombre: 'Biológicos', id_tipo_contenedor: 101, tipo_contenedor_nombre: 'Barril 200L', capacidad_maxima_contenedor: 200 },
                    { id: 'BOTE-003', descripcion: 'Contenedor para residuos radiactivos de la unidad de radiología.', fecha_registro: '2024-03-10', id_empresa: 'simulated-company-id', id_tipo_residuo: 3, tipo_residuo_nombre: 'Radiactivos', id_tipo_contenedor: 103, tipo_contenedor_nombre: 'Cubo 20L', capacidad_maxima_contenedor: 20 },
                    { id: 'BOTE-004', descripcion: 'Contenedor de residuos industriales generales de la planta de ensamblaje.', fecha_registro: '2024-04-05', id_empresa: 'simulated-company-id', id_tipo_residuo: 4, tipo_residuo_nombre: 'Industriales', id_tipo_contenedor: 102, tipo_contenedor_nombre: 'Contenedor IBC 1000L', capacidad_maxima_contenedor: 1000 },
                    { id: 'BOTE-005', descripcion: 'Contenedor para ácidos corrosivos en el área de producción.', fecha_registro: '2024-05-01', id_empresa: 'simulated-company-id', id_tipo_residuo: 5, tipo_residuo_nombre: 'Corrosivos', id_tipo_contenedor: 101, tipo_contenedor_nombre: 'Barril 200L', capacidad_maxima_contenedor: 200 }
                ];
                saveContainersToLocalStorage(initialContainers);
                console.log("Se cargaron datos iniciales de contenedores en localStorage.");
            }
            populateEditSelects(); // Poblar selects en el modal de edición
            renderContainers(); // Renderiza los contenedores (ya sea los cargados o los iniciales)

            // Adjuntar el event listener del botón "Nuevo Bote" aquí
            const newContainerButton = document.getElementById('newContainerBtn');
            if (newContainerButton) {
                console.log("Elemento 'newContainerBtn' encontrado y listener adjuntado.");
                newContainerButton.addEventListener('click', () => {
                    console.log("Botón 'Nuevo Bote' clicado. Redirigiendo a new-container.html");
                    window.location.href = 'registrarContenedor.html';
                });
            } else {
                console.error("Elemento 'newContainerBtn' NO encontrado.");
            }
        };