//

(function() {
    // This self-invoking function prevents variables from conflicting with other scripts.

    document.addEventListener('DOMContentLoaded', function() {
        // --- SETUP ---
        const analysisContainer = document.querySelector('.analysis-container');
        if (!analysisContainer) return; // Exit if the container isn't on the page

        const tabButtons = analysisContainer.querySelectorAll('.tab-btn');
        const tabPanes = analysisContainer.querySelectorAll('.tab-pane');

        // --- CHART & DATA STATE ---
        let analysisData = null; // This will store our fetched chart data
        let dataExplorationChart = null;
        let featureImportanceChart = null;
        let modelPerformanceChart = null;

        // --- Chart.js Global Styling ---
        Chart.defaults.color = 'rgba(224, 224, 224, 0.9)';
        Chart.defaults.borderColor = 'rgba(136, 71, 255, 0.2)';
        Chart.defaults.font.family = "'Inter', sans-serif";

        
        // --- CORE LOGIC ---

        /**
         * Fetches data ONCE from the server and renders the initial active chart.
         */
        async function initializeCharts() {
            try {
                const response = await fetch('/api/analysis_data');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                analysisData = await response.json(); // Store data for later use

                // Render the chart for the initially active tab
                renderActiveChart(); 
            } catch (error) {
                console.error("Could not fetch or render analysis charts:", error);
            }
        }

        /**
         * Handles tab button clicks.
         * @param {Event} event The click event.
         */
        function handleTabClick(event) {
            const clickedButton = event.currentTarget;

            // 1. Update the active state for buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            clickedButton.classList.add('active');
            const targetPaneId = clickedButton.getAttribute('data-tab');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // 2. Render the chart for the newly active tab (if it hasn't been rendered yet)
            renderActiveChart();
        }

        /**
         * Checks which tab is active and calls the correct render function if needed.
         */
        function renderActiveChart() {
            if (!analysisData) return; // Don't render if data hasn't been fetched

            const activeTab = analysisContainer.querySelector('.tab-btn.active');
            if (!activeTab) return;

            const chartToRender = activeTab.getAttribute('data-tab');

            if (chartToRender === 'data-exploration' && !dataExplorationChart) {
                renderDataExplorationChart(analysisData.data_exploration);
            } else if (chartToRender === 'feature-importance' && !featureImportanceChart) {
                renderFeatureImportanceChart(analysisData.feature_importance);
            } else if (chartToRender === 'model-performance' && !modelPerformanceChart) {
                renderModelPerformanceChart(analysisData.model_performance);
            }
        }

        // --- EVENT LISTENERS ---
        tabButtons.forEach(button => button.addEventListener('click', handleTabClick));

        // --- INITIALIZATION ---
        initializeCharts();


        // --- CHART RENDERING FUNCTIONS (from your original file) ---

        function renderDataExplorationChart(chartData) {
            const ctx = document.getElementById('dataExplorationChart').getContext('2d');
            dataExplorationChart = new Chart(ctx, { /* ... options from your file ... */ 
                type: 'bar', data: { labels: chartData.labels, datasets: [{ label: 'Number of Confirmed Exoplanets', data: chartData.data, backgroundColor: 'rgba(168, 85, 247, 0.6)', borderColor: 'rgba(168, 85, 247, 1)', borderWidth: 2, borderRadius: 4, hoverBackgroundColor: 'rgba(168, 85, 247, 0.8)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Exoplanet Size Distribution', font: { size: 16 } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } } }
            });
        }

        function renderFeatureImportanceChart(chartData) {
            const ctx = document.getElementById('featureImportanceChart').getContext('2d');
            featureImportanceChart = new Chart(ctx, { /* ... options from your file ... */
                type: 'bar', data: { labels: chartData.labels, datasets: [{ label: 'Importance Score', data: chartData.data, backgroundColor: 'rgba(236, 72, 153, 0.6)', borderColor: 'rgba(236, 72, 153, 1)', borderWidth: 2, borderRadius: 4, hoverBackgroundColor: 'rgba(236, 72, 153, 0.8)' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Top Predictive Features', font: { size: 16 } } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } } }
            });
        }

        function renderModelPerformanceChart(chartData) {
            const ctx = document.getElementById('modelPerformanceChart').getContext('2d');
            modelPerformanceChart = new Chart(ctx, { /* ... options from your file ... */
                type: 'doughnut', data: { labels: chartData.labels, datasets: [{ label: 'Count', data: chartData.data, backgroundColor: [ 'rgba(6, 182, 212, 0.7)', 'rgba(251, 191, 36, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(52, 211, 153, 0.7)' ], borderColor: 'rgba(18, 18, 38, 0.8)', hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Model Prediction Breakdown', font: { size: 16 } } } }
            });
        }
    });
})();