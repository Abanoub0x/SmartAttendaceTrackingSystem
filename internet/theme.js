// Smart Attendance Tracking System (SATS) - Theme Management
// Created for Al-Ryada University for Science & Technology (RST)
// Faculty of Computer Science and Artificial Intelligence

// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.theme = localStorage.getItem('theme') || this.getSystemTheme();
        this.transitionOverlay = document.createElement('div');
        this.transitionOverlay.className = 'theme-transition-overlay';
        document.body.appendChild(this.transitionOverlay);
        this.isTransitioning = false;
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.theme);

        // Add event listeners
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            this.themeToggle.addEventListener('mouseenter', () => this.addHoverEffect());
            this.themeToggle.addEventListener('mouseleave', () => this.removeHoverEffect());
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    addHoverEffect() {
        if (this.themeToggle && !this.isTransitioning) {
            this.themeToggle.style.transform = 'scale(1.1) rotate(5deg)';
        }
    }

    removeHoverEffect() {
        if (this.themeToggle && !this.isTransitioning) {
            this.themeToggle.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    async setTheme(theme) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Start transition
        this.transitionOverlay.classList.add('active');
        
        // Add click effect
        if (this.themeToggle) {
            this.themeToggle.style.transform = 'scale(0.95)';
            await new Promise(resolve => setTimeout(resolve, 100));
            this.themeToggle.style.transform = 'scale(1)';
        }
        
        // Wait for the overlay to fade in
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Change theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.theme = theme;
        this.updateThemeIcon();
        
        // Wait for the theme change to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // End transition
        this.transitionOverlay.classList.remove('active');
        
        // Reset transition state
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    async toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        await this.setTheme(newTheme);
    }

    updateThemeIcon() {
        if (!this.themeToggle) return;

        const sunIcon = this.themeToggle.querySelector('.fa-sun');
        const moonIcon = this.themeToggle.querySelector('.fa-moon');

        if (sunIcon && moonIcon) {
            if (this.theme === 'light') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                moonIcon.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                sunIcon.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
            }
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
}); 