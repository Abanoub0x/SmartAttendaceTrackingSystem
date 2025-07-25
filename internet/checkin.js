// Smart Attendance Tracking System (SATS) - Check-in Management
// Created for Al-Ryada University for Science & Technology (RST)
// Faculty of Computer Science and Artificial Intelligence

// Check-in Management
class CheckinManager {
    constructor() {
        this.currentLocation = null;
        this.isCheckingIn = false;
        this.init();
    }

    init() {
        // Initialize map
        this.initMap();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Get current location
        this.getCurrentLocation();
    }

    initMap() {
        // Initialize map with default location (RST University)
        const map = L.map('map').setView([30.0444, 31.2357], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        this.map = map;
    }

    setupEventListeners() {
        // Check-in form
        const checkinForm = document.getElementById('checkinForm');
        if (checkinForm) {
            checkinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCheckin(e.target);
            });
        }

        // Location refresh button
        const refreshLocationBtn = document.getElementById('refreshLocation');
        if (refreshLocationBtn) {
            refreshLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        }
    }

    async getCurrentLocation() {
        try {
            const position = await this.getGeolocation();
            this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update map
            this.updateMap();
            
            // Update location display
            this.updateLocationDisplay();
            
            return this.currentLocation;
        } catch (error) {
            console.error('Error getting location:', error);
            this.showError('Unable to get your location. Please check your location settings.');
            return null;
        }
    }

    getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    }

    updateMap() {
        if (!this.map || !this.currentLocation) return;
        
        // Clear existing markers
        this.map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                this.map.removeLayer(layer);
            }
        });
        
        // Add marker for current location
        L.marker([this.currentLocation.lat, this.currentLocation.lng])
            .addTo(this.map)
            .bindPopup('Your current location')
            .openPopup();
        
        // Center map on current location
        this.map.setView([this.currentLocation.lat, this.currentLocation.lng]);
    }

    updateLocationDisplay() {
        const locationDisplay = document.getElementById('currentLocation');
        if (locationDisplay && this.currentLocation) {
            locationDisplay.textContent = `${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}`;
        }
    }

    async handleCheckin(form) {
        if (this.isCheckingIn) return;
        
        try {
            this.isCheckingIn = true;
            this.updateCheckinStatus('Checking in...');
            
            // Get current location
            const location = await this.getCurrentLocation();
            if (!location) {
                throw new Error('Location not available');
            }
            
            // Get form data
            const courseId = form.courseId.value.trim();
            // const studentId = form.studentId.value; // Not needed for recordAttendance
            // Call recordAttendance from scripts.js to save attendance data
            const result = recordAttendance(courseId, '');
            if (!result.success) {
                throw new Error(result.message);
            }
            
            this.showSuccess('Check-in successful!');
            this.updateCheckinStatus('Checked in successfully');
            form.reset();
        } catch (error) {
            console.error('Check-in error:', error);
            this.showError(error.message || 'Check-in failed. Please try again.');
            this.updateCheckinStatus('Check-in failed');
        } finally {
            this.isCheckingIn = false;
        }
    }

    updateCheckinStatus(status) {
        const statusElement = document.getElementById('checkinStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    showSuccess(message) {
        // TODO: Implement proper success display
        alert(message);
    }

    showError(message) {
        // TODO: Implement proper error display
        alert(message);
    }

    // Mock API call (replace with actual API call)
    async mockCheckinAPI(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Check-in successful',
                    data: {
                        id: '12345',
                        timestamp: data.timestamp,
                        status: 'present'
                    }
                });
            }, 1000);
        });
    }
}

// Initialize check-in manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CheckinManager();
});
/* Bob is here */