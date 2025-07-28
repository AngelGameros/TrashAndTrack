
        // Monthly Collection Chart
        const monthlyCollectionCtx = document.getElementById('monthlyCollectionChart').getContext('2d');
        new Chart(monthlyCollectionCtx, {
            type: 'bar',
            data: {
                labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
                datasets: [{
                    label: 'Químicos',
                    data: [45, 52, 48, 61, 55, 67],
                    backgroundColor: '#ef4444'
                }, {
                    label: 'Biológicos',
                    data: [38, 42, 35, 48, 41, 52],
                    backgroundColor: '#f59e0b'
                }, {
                    label: 'Radiactivos',
                    data: [12, 15, 18, 14, 16, 19],
                    backgroundColor: '#8b5cf6'
                }, {
                    label: 'Industriales',
                    data: [65, 72, 68, 78, 71, 85],
                    backgroundColor: '#10b981'
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
                    x: {
                        stacked: true,
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            font: { size: 10 },
                            callback: function(value) {
                                return value + 't';
                            }
                        }
                    }
                }
            }
        });

        // Zone Efficiency Chart
        const zoneEfficiencyCtx = document.getElementById('zoneEfficiencyChart').getContext('2d');
        new Chart(zoneEfficiencyCtx, {
            type: 'radar',
            data: {
                labels: ['Zona Norte', 'Zona Centro', 'Zona Sur', 'Zona Este', 'Zona Oeste', 'Industrial'],
                datasets: [{
                    label: 'Eficiencia (%)',
                    data: [92, 88, 95, 87, 91, 89],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.2)',
                    pointBackgroundColor: '#22d3ee',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#22d3ee'
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
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: { size: 10 },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        // Alerts Trend Chart
        const alertsTrendCtx = document.getElementById('alertsTrendChart').getContext('2d');
        new Chart(alertsTrendCtx, {
            type: 'line',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                datasets: [{
                    label: 'Alertas Críticas',
                    data: [15, 12, 18, 8],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Alertas de Advertencia',
                    data: [28, 32, 25, 30],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
                        ticks: { font: { size: 10 } }
                    },
                    x: {
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });

        // Waste Distribution Chart
        const wasteDistributionCtx = document.getElementById('wasteDistributionChart').getContext('2d');
        new Chart(wasteDistributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Químicos', 'Biológicos', 'Radiactivos', 'Industriales', 'Farmacéuticos'],
                datasets: [{
                    data: [67, 52, 19, 85, 28],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#8b5cf6',
                        '#10b981',
                        '#06b6d4'
                    ],
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
                            padding: 8
                        }
                    }
                }
            }
        });

        // Filter functionality
        document.querySelector('.filters-grid .btn-primary').addEventListener('click', function() {
            console.log('Aplicar filtros de reporte');
        });

        // Table action buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('Ver reporte');
            });
        });

        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!this.disabled) {
                    console.log('Descargar reporte');
                }
            });
        });

        // New report button
        document.querySelector('.header-actions .btn-primary').addEventListener('click', function() {
            console.log('Crear nuevo reporte');
        });

        // Schedule report button
        document.querySelector('.header-actions .btn-secondary').addEventListener('click', function() {
            console.log('Programar reporte automático');
        });
    