/*
 * Dedicated JavaScript for fetching data and rendering the Chart.js Light Curve Graph.
 */

// We skip the initial DOMContentLoaded fetch, as app.js handles the first load
// using handleSampleSelection to ensure the prediction result loads concurrently.

/**
 * Called by app.js to re-render the chart with new data type.
 * @param {string} type - The type of curve ('confirmed' or 'false_positive').
 * @param {string} sampleName - The name of the sample (e.g., 'KOI-123.01').
 */
window.renderSelectedChart = function(type, sampleName) {
    // 1. Update Chart Title
    const chartTitleElement = document.querySelector('#lightCurveChartContainer .chart-title');
    if(chartTitleElement) {
        chartTitleElement.textContent = `Light Curve Data (${sampleName})`;
    }

    // 2. Fetch and Render Chart
    fetchAndRenderChart(type);
}

function fetchAndRenderChart(type) {
    // Destroy previous chart instance if it exists to prevent overlap/memory leak
    const existingChart = Chart.getChart('lightCurveChart');
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Fetch data from the Flask API endpoint, passing the type
    fetch(`/api/light_curve?type=${type}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch light curve data.');
            }
            return response.json();
        })
        .then(data => {
            renderLightCurveChart(data, type);
        })
        .catch(error => {
            console.error("Error fetching light curve data:", error);
            const chartArea = document.getElementById('lightCurveChartContainer');
            if (chartArea) {
                chartArea.innerHTML = '<p class="text-red-400 text-center">Error loading chart data. Please check the server.</p>';
            }
        });
}

/**
 * Renders the Chart.js light curve area chart.
 */
function renderLightCurveChart(data, type) {
    const ctx = document.getElementById('lightCurveChart');
    if (!ctx) return;
    
    const timeLabels = data.time.map(t => t.toString()); 
    const fluxData = data.flux;

    // Define colors based on the type
    const mainColor = type === 'confirmed' ? '#34D399' : '#FBBF24'; // Emerald or Amber
    
    // Create a smooth gradient fill for the area under the curve
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${mainColor}80`); // 80% opacity at the top
    gradient.addColorStop(1, 'rgba(18, 0, 47, 0.1)'); // Fades to deep space dark at the bottom

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Normalized Flux',
                data: fluxData,
                borderColor: mainColor, 
                backgroundColor: gradient, 
                borderWidth: 2,
                pointRadius: 0, 
                fill: true, 
                tension: 0.4, 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: {
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 30, 50, 0.9)', 
                    titleColor: '#F3E8FF',
                    bodyColor: '#D0D0D0',
                    borderWidth: 1,
                    borderColor: mainColor,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            return `Time: ${context[0].label} hours`;
                        },
                        label: function(context) {
                            return `Flux: ${context.formattedValue}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        color: '#9CA3AF' 
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)', 
                        drawBorder: true
                    },
                    ticks: {
                        color: '#E0E0E0',
                        callback: function(value, index, ticks) {
                            if (value % 4 === 0) {
                                return value;
                            }
                            return null;
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Normalized Flux',
                        color: '#9CA3AF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#E0E0E0',
                        // Set limits to clearly show the transit dip
                        min: type === 'confirmed' ? 0.975 : 0.99,
                        max: type === 'confirmed' ? 1.005 : 1.01,
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    },
                }
            }
        }
    });
}