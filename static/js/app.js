// static/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Form Validation and Submission Handling
    const form = document.getElementById('exoplanet-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            // Add loading state
            form.classList.add('form-loading');
            
            // Validate all inputs are filled
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
                
                // Show error message
                showNotification('Please fill in all required fields', 'error');
            }
        });
        
        // Real-time input validation
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.value && this.value.trim() !== '') {
                    this.style.borderColor = '#a855f7';
                } else {
                    this.style.borderColor = '';
                }
            });
            
            // Clear error state on focus
            input.addEventListener('focus', function() {
                this.style.borderColor = '#a855f7';
            });
        });
    }
    
    // Smooth Scroll for Navigation Links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Sample Data Fill Button (for demo purposes)
    createSampleDataButton();
    
    // Result Card Animation
    const resultCard = document.querySelector('.result-card');
    if (resultCard) {
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
    
    // Add parallax effect to stars on scroll
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                parallaxStars();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Mobile Menu Toggle (if needed in future)
    const menuButton = document.getElementById('mobile-menu-button');
    if (menuButton) {
        menuButton.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    }
});

// Helper Functions

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-purple-500'
    } text-white font-semibold transition-all duration-300`;
    notification.textContent = message;
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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
    
    buttonContainer.appendChild(sampleButton);
    form.insertBefore(buttonContainer, form.firstChild);
}

/**
 * Fill form with sample exoplanet data
 */
function fillSampleData() {
    const sampleData = {
        koi_period: 9.488036,
        koi_duration: 2.783,
        koi_prad: 1.94,
        koi_depth: 344.6,
        koi_slogg: 5778,
        koi_srad: 0.927,
        koi_impact: 0.146,
        koi_insol: 93.59,
        koi_teq: 707.2,
        koi_score: 0.946,
        koi_steff: 67.6,
        koi_model_snr: 4.467,
        koi_time0bk: 170.538,
        koi_dor: 0.089,
        koi_incl: 89.37
    };
    
    for (const [key, value] of Object.entries(sampleData)) {
        const input = document.querySelector(`input[name="${key}"]`);
        if (input) {
            input.value = value;
            input.style.borderColor = '#a855f7';
            
            // Animate the input
            input.style.transform = 'scale(1.05)';
            setTimeout(() => {
                input.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    showNotification('Sample data loaded successfully!', 'info');
}

/**
 * Parallax effect for stars
 */
function parallaxStars() {
    const scrolled = window.pageYOffset;
    const stars = document.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        const speed = 0.1 + (index % 3) * 0.05;
        const yPos = -(scrolled * speed);
        star.style.transform = `translateY(${yPos}px)`;
    });
}

/**
 * Copy result to clipboard
 */
function copyResultToClipboard() {
    const resultText = document.querySelector('.result-card');
    if (!resultText) return;
    
    const text = resultText.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Result copied to clipboard!', 'info');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Validate numeric input
 */
function validateNumericInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value)) {
        input.style.borderColor = '#ef4444';
        return false;
    }
    input.style.borderColor = '#a855f7';
    return true;
}

/**
 * Add keyboard shortcuts
 */
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus on first input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstInput = document.querySelector('input[name="koi_period"]');
        if (firstInput) firstInput.focus();
    }
    
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('exoplanet-form');
        if (form) form.submit();
    }
});

/**
 * Add dynamic star generation (optional enhancement)
 */
function addMoreStars(count = 20) {
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

// Add more stars on load for richer background
addMoreStars(30);