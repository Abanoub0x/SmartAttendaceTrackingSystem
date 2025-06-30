// maps.js - Handles Google Maps functionality for GPS check-in

let map;
let studentMarker;
let universityCenter;
/* Bob is here */

const UNIVERSITY_LAT = 34.0522; // Example: Los Angeles
const UNIVERSITY_LNG = -118.2437;
const UNIVERSITY_RADIUS = 500; // in meters, adjust as needed for your campus size

// Initialize the map
function initializeMap() {
    // Check if map is already initialized
    if (map) return;
    
    // Check if map div exists
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    
    // Set university center coordinates
    universityCenter = { lat: UNIVERSITY_LAT, lng: UNIVERSITY_LNG };
    
    // Create map centered on university
    map = new google.maps.Map(mapDiv, {
        center: universityCenter,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });
    
    // Add university circle (campus boundary)
    const universityCircle = new google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        map: map,
        center: universityCenter,
        radius: UNIVERSITY_RADIUS
    });
}

// Show student's location on map
function showLocationOnMap(lat, lng) {
    // Initialize map if not already initialized
    if (!map) {
        initializeMap();
    }
    
    // Convert coordinates to LatLng object
    const studentPosition = new google.maps.LatLng(lat, lng);
    
    // Remove existing marker if any
    if (studentMarker) {
        studentMarker.setMap(null);
    }
    
    // Create new marker for student location
    studentMarker = new google.maps.Marker({
        position: studentPosition,
        map: map,
        title: 'Your Location',
        animation: google.maps.Animation.DROP,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#DB4437',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        }
    });
    
    // Center map on student's location
    map.setCenter(studentPosition);
    
    // Check if student is within university radius
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        studentPosition,
        new google.maps.LatLng(UNIVERSITY_LAT, UNIVERSITY_LNG)
    );
    
    // Update status message
    const locationStatus = document.querySelector('.location-status p');
    if (distance <= UNIVERSITY_RADIUS) {
        locationStatus.innerHTML = '<i class="fas fa-check-circle"></i> Location verified! You are at the university.';
        locationStatus.style.color = '#2b8a15';
    } else {
        locationStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> You appear to be outside the university campus.';
        locationStatus.style.color = '#c33030';
    }
    
    // Add info window with distance info
    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family: Arial, sans-serif; padding: 5px;">
            <strong>Your Location</strong><br>
            Distance to campus center: ${Math.round(distance)} meters
        </div>`
    });
    
    // Open info window when marker is clicked
    studentMarker.addListener('click', function() {
        infoWindow.open(map, studentMarker);
    });
    
    // Add line connecting student marker to university center
    const connectingLine = new google.maps.Polyline({
        path: [studentPosition, new google.maps.LatLng(UNIVERSITY_LAT, UNIVERSITY_LNG)],
        geodesic: true,
        strokeColor: '#DB4437',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: map
    });
    
    // Automatically open info window
    infoWindow.open(map, studentMarker);
}