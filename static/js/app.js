// static/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Hero Image Scroll Effect ---
    const heroImage = document.getElementById('hero-image-zoom');
    const heroSection = document.getElementById('hero-image-section');
    
    function handleHeroParallax() {
        if (!heroImage || !heroSection) return;

        const scrollPos = window.pageYOffset;
        const heroHeight = heroSection.offsetHeight;
        
        if (scrollPos <= heroHeight) {
            const scaleFactor = 1 + (scrollPos * 0.0003);
            const opacityFactor = 1 - (scrollPos / (heroHeight * 0.7));
            
            heroImage.style.transform = `scale(${scaleFactor})`;
            heroImage.style.opacity = `${opacityFactor}`;
            heroImage.style.position = 'fixed';
            
        } else {
             heroImage.style.opacity = '0';
             heroImage.style.position = 'absolute';
        }
        parallaxStars(); 
    }
    
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTabId = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('tab-active'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            this.classList.add('tab-active');
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
            
            if (targetTabId === 'sample-data') {
                const selectedSample = document.querySelector('.sample-card.selected');
                if (selectedSample) {
                    handleSampleSelection(selectedSample);
                }
            } else {
               document.getElementById('sample-result-display').innerHTML = '';
            }
        });
    });
    
    // --- Sample Card Selection Logic ---
    const sampleCards = document.querySelectorAll('.sample-card');
    sampleCards.forEach(card => {
        card.addEventListener('click', function() {
            sampleCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            handleSampleSelection(this);
        });
    });

    // --- Core Sample Handler Function ---
    function handleSampleSelection(selectedCard) {
        const type = selectedCard.getAttribute('data-type');
        const sampleName = selectedCard.getAttribute('data-sample-name');
        window.renderSelectedChart(type, sampleName); 
        
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

    // --- Helper to display sample result card ---
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
    const defaultSelectedCard = document.querySelector('.sample-card.selected');
    if (defaultSelectedCard) {
        handleSampleSelection(defaultSelectedCard);
    }
    
    // --- Scroll Event Handler ---
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleHeroParallax(); 
                ticking = false;
            });
            ticking = true;
        }
    });
    handleHeroParallax();

    // --- Form Validation ---
    const form = document.getElementById('exoplanet-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            form.classList.add('form-loading');
        });
    }
    
    // --- Sample Data Fill Button ---
    createSampleDataButton();

    /**
     * Creates and injects the 'Fill Sample Data' button into the form.
     */
    function createSampleDataButton() {
        const form = document.getElementById('exoplanet-form');
        if (!form) return;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'text-center mb-8';
        
        const sampleButton = document.createElement('button');
        sampleButton.type = 'button';
        sampleButton.className = 'px-6 py-2 rounded-full border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400/20 transition';
        sampleButton.textContent = '🪐 Fill Guaranteed Exoplanet Data';
        
        sampleButton.addEventListener('click', fillSampleData);
        buttonContainer.appendChild(sampleButton);
        
        const uploadOwnTab = document.getElementById('upload-own');
        if (uploadOwnTab) {
            uploadOwnTab.insertBefore(buttonContainer, form);
        }
    }

    /**
     * Fills the form with a sample guaranteed to be classified as 'CONFIRMED' by our model.
     */
    function fillSampleData() {
        // ===============================================================
        // UPDATED: This new data is from a real exoplanet that our new model
        // has been verified to classify correctly with high confidence.
        // ===============================================================
        const sampleData = {
            "koi_period": 18.64932728,
            "koi_duration": 4.4056,
            "koi_prad": 3.12,
            "koi_ror": 0.027096,
            "koi_slogg": 4.405,
            "koi_srad": 1.053,
            "koi_impact": 0.08,
            "koi_insol": 57.13,
            "koi_teq": 701.0,
            "koi_mass": 1.026,
            "koi_snr": 46.1,
            "koi_density": 1.97596,
            "koi_time0bk": 174.771,
            "koi_dor": 33.12,
            "koi_incl": 89.86
        };
        
        for (const [key, value] of Object.entries(sampleData)) {
            const input = document.querySelector(`input[name="${key}"]`);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input')); 
            }
        }
    }

    /** Parallax effect for stars. */
    function parallaxStars() {
        const scrolled = window.pageYOffset;
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            const speed = 0.1 + (index % 3) * 0.05;
            const yPos = -(scrolled * speed); 
            star.style.transform = `translateY(${yPos}px)`;
        });
    }

    /** Adds more stars for a richer background. */
    function addMoreStars(count = 50) {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = `${Math.random() * 2 + 1}px`;
            star.style.height = star.style.width;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            star.style.animationDelay = `${Math.random() * 2}s`;
            starsContainer.appendChild(star);
        }
    }
    addMoreStars(50);
});

