// static/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTabId = this.getAttribute('data-tab');
            
            // Deactivate all buttons and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('tab-active'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Activate the clicked button and show the target content
            this.classList.add('tab-active');
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
            
            // If switching to sample data, force re-render with the currently selected sample type
            if (targetTabId === 'sample-data') {
                const selectedSample = document.querySelector('.sample-card.selected');
                if (selectedSample) {
                    handleSampleSelection(selectedSample);
                }
            } else {
                 // Clear dynamic sample result when switching to manual input
                 document.getElementById('sample-result-display').innerHTML = '';
            }
        });
    });
    
    // --- Sample Card Selection Logic ---
    const sampleCards = document.querySelectorAll('.sample-card');
    sampleCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove 'selected' class from all
            sampleCards.forEach(c => c.classList.remove('selected'));
            
            // Add 'selected' class to the clicked card
            this.classList.add('selected');
            
            handleSampleSelection(this);
        });
    });

    // --- Core Sample Handler Function ---
    function handleSampleSelection(selectedCard) {
        const type = selectedCard.getAttribute('data-type');
        const sampleName = selectedCard.getAttribute('data-sample-name');

        // 1. Update Chart (forces light_curve_chart.js to re-fetch and draw)
        // We call the function defined in light_curve_chart.js
        window.renderSelectedChart(type, sampleName); 
        
        // 2. Fetch and Display Prediction Result
        fetch(`/api/sample_prediction?type=${type}`)
            .then(response => response.json())
            .then(data => {
                displaySampleResult(data.result, data.confidence);
            })
            .catch(error => {
                console.error("Error fetching sample prediction:", error);
                displaySampleResult('ERROR', 0.0);
            });
    }

    // --- Helper function to dynamically display the result card in the Sample tab ---
    function displaySampleResult(result, confidence) {
        const display = document.getElementById('sample-result-display');
        
        const isConfirmed = result === 'CONFIRMED EXOPLANET';
        const resultClass = isConfirmed ? 'bg-emerald-900/50 border-emerald-500' : 'bg-amber-900/50 border-amber-500';
        const textClass = isConfirmed ? 'text-emerald-300' : 'text-amber-300';
        const icon = isConfirmed ? 
            '<svg class="w-6 h-6 text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' :
            '<svg class="w-6 h-6 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';


        display.innerHTML = `
            <div class="${resultClass} backdrop-blur-sm rounded-2xl p-6 border-2 result-card">
                <div class="text-center">
                    <h3 class="text-2xl font-bold text-white mb-4">AI CLASSIFICATION RESULT</h3>
                    ${icon}
                    <div class="mb-4">
                        <p class="text-gray-300 text-lg mb-1">Prediction:</p>
                        <p class="text-3xl font-extrabold ${textClass}">${result}</p>
                    </div>
                    <div>
                        <p class="text-gray-300 text-lg mb-1">Confidence Score:</p>
                        <p class="text-2xl font-bold text-white">${confidence}%</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // --- Initial Load ---
    // Handle the default selected card on page load
    const defaultSelectedCard = document.querySelector('.sample-card.selected');
    if (defaultSelectedCard) {
        handleSampleSelection(defaultSelectedCard);
    }


    // --- Original Form Validation and Submission Handling (Only for Upload Your Own tab) ---
    const form = document.getElementById('exoplanet-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            // Add loading state
            form.classList.add('form-loading');
            
            // Validate all inputs are filled (Original logic remains)
            const inputs = form.querySelectorAll('input[required]');
            let allValid = true;
            
            inputs.forEach(input => {
                if (!input.value || input.value.trim() === '') {
                    allValid = false;
                    input.style.borderColor = '#ef4444';
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!allValid) {
                e.preventDefault();
                form.classList.remove('form-loading');
                
                showNotification('Please fill in all required fields', 'error');
            }
        });
        
        // Real-time input validation (rest of form logic remains)
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.value && this.value.trim() !== '') {
                    this.style.borderColor = '#a855f7';
                } else {
                    this.style.borderColor = '';
                }
            });
            
            input.addEventListener('focus', function() {
                this.style.borderColor = '#a855f7';
            });
        });
    }
    
    // --- Sample Data Fill Button (moved inside the upload-own tab) ---
    createSampleDataButton();

    // ... (All other original functions like smooth scroll, parallax, and helper functions remain) ...

    /**
     * Create sample data fill button for demo
     */
    function createSampleDataButton() {
        const form = document.getElementById('exoplanet-form');
        if (!form) return;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'text-center mb-6';
        
        const sampleButton = document.createElement('button');
        sampleButton.type = 'button';
        sampleButton.className = 'px-6 py-2 rounded-full border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400 hover:text-purple-900 transition';
        sampleButton.textContent = '✨ Fill Sample Data';
        sampleButton.addEventListener('click', fillSampleData);
        
        // Find the 'upload-own' container to insert the button
        const uploadOwnTab = document.getElementById('upload-own');
        if (uploadOwnTab) {
            // Insert after the title block, before the form
            uploadOwnTab.insertBefore(buttonContainer, uploadOwnTab.querySelector('form'));
        }
    }

    /**
     * Fill form with sample exoplanet data (using the confirmed sample data)
     */
    function fillSampleData() {
        // Using the same confirmed sample data from app.py
        const sampleData = {
            koi_period: 9.488036,
            koi_duration: 2.783,
            koi_prad: 1.94,
            koi_depth: 344.6,
            koi_slogg: 4.467, // Corrected from 5778 (stellar temperature) to Log g 
            koi_srad: 0.927,
            koi_impact: 0.146,
            koi_insol: 93.59,
            koi_teq: 707.2,
            koi_score: 0.946,
            koi_steff: 5778, // Stellar Temperature (using a more appropriate value from earlier context)
            koi_model_snr: 67.6, // SNR
            koi_time0bk: 170.538,
            koi_dor: 0.089,
            koi_incl: 89.37
        };
        
        for (const [key, value] of Object.entries(sampleData)) {
            const input = document.querySelector(`input[name="${key}"]`);
            if (input) {
                input.value = value;
                input.style.borderColor = '#a855f7';
                
                input.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    input.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        showNotification('Sample data loaded successfully!', 'info');
    }

    // ... (The rest of the original helper functions) ...
    function showNotification(message, type = 'info') { /* ... */ }
    function parallaxStars() { /* ... */ }
    function addMoreStars(count = 20) { /* ... */ }
    addMoreStars(30);

});