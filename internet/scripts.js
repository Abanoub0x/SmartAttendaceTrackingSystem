// scripts.js - Main JavaScript file for SATS application
// Global variables
let currentUser = null;
const STORAGE_KEYS = {
    USERS: 'sats_users',
    CURRENT_USER: 'sats_current_user',
    ATTENDANCE: 'sats_attendance',
    CLASSES: 'sats_classes'
};

// Sample class data
const sampleClasses = [
    { code: 'CS101', name: 'Introduction to Programming' },
    { code: 'CS202', name: 'Data Structures' },
    { code: 'CS303', name: 'Database Systems' },
    { code: 'CS404', name: 'Artificial Intelligence' }
];

// Helper functions for form validation
function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.classList.add('error');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        inputElement.classList.remove('error');
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('input.error, select.error');
    
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
    
    inputElements.forEach(element => {
        element.classList.remove('error');
    });
}

// Helper function to check if user can access protected pages
function handleProtectedPageAccess(e) {
    if (!currentUser) {
        e.preventDefault();
        alert('You must be logged in to access this page.');
        return false;
    }
    return true;
}

function isUserLoggedIn() {
    // Check both systems
    const satsUser = localStorage.getItem('sats_current_user');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = localStorage.getItem('userData');
    return (satsUser || (isLoggedIn && userData));
}

// Initialize application data
function initializeApp() {
    // Check if classes exist in local storage, if not, add sample data
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(sampleClasses));
    }
    
    // Robustly load current user if exists
    let savedUser = null;
    try {
        savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            // Validate structure
            if (parsed && parsed.fullName && parsed.studentId) {
                currentUser = parsed;
                console.log('[SATS] Loaded user from localStorage:', currentUser);
            } else {
                currentUser = null;
                console.log('[SATS] Malformed user in localStorage, treating as logged out.');
            }
        } else {
            currentUser = null;
            console.log('[SATS] No user in localStorage, treating as logged out.');
        }
    } catch (e) {
        currentUser = null;
        console.log('[SATS] Error parsing user from localStorage:', e);
    }
    // Always update UI for logged in/out user
    updateUIForLoggedInUser();

    // Set up protected page navigation
    const protectedPages = ['history.html', 'attendance_history.html', 'checkin.html', 'calendar.html', 'contact.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    // If on a protected page and not logged in, prevent access
    if (protectedPages.includes(currentPage)) {
        if (isUserLoggedIn()) {
            // Show protected content
            const protectedContent = document.getElementById('protected-content');
            if (protectedContent) protectedContent.style.display = '';
        } else {
            alert('You must be logged in to access this page.');
            window.location.href = 'index.html';
            return;
        }
        
    }

    // Set up navigation links for protected pages
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (protectedPages.includes(href)) {
            link.addEventListener('click', handleProtectedPageAccess);
        }
    });

    // Set up registration form handler
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous error messages
            clearErrors();
            
            // Validate password
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password.length < 8) {
                showError('password', 'Password must be at least 8 characters long');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('confirmPassword', 'Passwords do not match');
                return;
            }
            
            // Use fullName for consistency
            const userData = {
                fullName: document.getElementById('fullName').value,
                studentId: document.getElementById('studentId').value,
                email: document.getElementById('email').value,
                password: password
            };
            
            const result = registerUser(userData);
            if (result.success) {
                // Set as current user and update UI
                currentUser = userData;
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                alert('Registration successful! You are now logged in.');
                window.location.href = 'index.html';
            } else {
                showError('email', result.message);
            }
        });
        
        // Add real-time password validation
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                if (this.value.length > 0 && this.value.length < 8) {
                    showError('password', 'Password must be at least 8 characters long');
                } else {
                    clearError('password');
                }
            });
        }
        
        // Add real-time password confirmation validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                const password = document.getElementById('password').value;
                if (this.value !== password) {
                    showError('confirmPassword', 'Passwords do not match');
                } else {
                    clearError('confirmPassword');
                }
            });
        }
    }

    // Set up login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const studentId = document.getElementById('loginStudentId').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = loginUser(studentId, password);
            if (result.success) {
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert(result.message);
            }
        });
    }
}

// Update UI based on logged in status
function updateUIForLoggedInUser() {
    const loginButtons = document.querySelectorAll('.login-button, .register-button');
    const userProfileElements = document.querySelectorAll('.user-profile');
    const userMenu = document.querySelector('.user-menu');
    const userNameSpan = document.querySelector('.user-menu .user-name');
    const dropdownBtn = document.querySelector('.user-dropdown-btn');
    const dropdownMenu = document.querySelector('.user-menu .dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const profileLink = document.getElementById('profile-link');
    const loginLink = document.getElementById('login-link');

    // Always show the user menu
    if (userMenu) {
        userMenu.style.display = 'flex';
        userMenu.style.alignItems = 'center';
    }

    // Load current user from localStorage if not already loaded
    if (!currentUser) {
        try {
            const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed && parsed.fullName && parsed.studentId) {
                    currentUser = parsed;
                }
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }

    if (currentUser) {
        // User is logged in
        loginButtons.forEach(button => button.style.display = 'none');
        userProfileElements.forEach(element => {
            element.style.display = 'flex';
        });
        if (userNameSpan) {
            userNameSpan.textContent = currentUser.fullName;
            userNameSpan.style.display = 'inline-block';
        }
        // Show Profile/Logout, hide Login/Register
        if (profileLink) {
            profileLink.style.display = 'block';
            profileLink.href = 'profile.html';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                logoutUser();
            };
        }
        if (loginLink) loginLink.style.display = 'none';
    } else {
        // Not logged in
        loginButtons.forEach(button => button.style.display = 'inline-block');
        userProfileElements.forEach(element => element.style.display = 'none');
        if (userNameSpan) {
            userNameSpan.textContent = 'Guest';
            userNameSpan.style.display = 'inline-block';
        }
        // Hide Profile/Logout, show Login/Register
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginLink) {
            loginLink.style.display = 'block';
            loginLink.href = 'register.html';
        }
    }

    // Setup dropdown toggle
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.onclick = function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        };
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // Update calendar user info if present
    const calendarUserName = document.getElementById('calendarUserName');
    const calendarUserID = document.getElementById('calendarUserID');
    if (calendarUserName && calendarUserID) {
        calendarUserName.textContent = currentUser ? currentUser.fullName : 'Not logged in';
        calendarUserID.textContent = currentUser ? currentUser.studentId : 'Please log in to view calendar';
    }
}

// User Management Functions
function registerUser(userData) {
    // Get existing users or initialize empty array
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Check if user already exists
    const userExists = users.some(user => user.studentId === userData.studentId || user.email === userData.email);
    
    if (userExists) {
        return {
            success: false,
            message: 'A user with this Student ID or Email already exists.'
        };
    }
    
    // Add new user
    userData.id = Date.now().toString();
    userData.registrationDate = new Date().toISOString();
    users.push(userData);
    
    // Save updated users list
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Set as current user
    currentUser = userData;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    
    // Log the user data for debugging
    console.log('User registered:', currentUser);
    
    return {
        success: true,
        message: 'Registration successful!'
    };
}

function loginUser(studentId, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.studentId === studentId && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        // Clear attendance history for new login
        localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
        return {
            success: true,
            message: 'Login successful!'
        };
    } else {
        return {
            success: false,
            message: 'Invalid Student ID or Password.'
        };
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    updateUIForLoggedInUser();
    
    // Instead of redirecting, show an alert if on a protected page
    const protectedPages = ['history.html', 'attendance_history.html', 'checkin.html', 'calendar.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        alert('You have been logged out. Please log in to access this page.');
    }
}

// Attendance Management Functions
function recordAttendance(classCode, securityAnswer) {
    if (!currentUser) {
        return {
            success: false,
            message: 'You must be logged in to check in.'
        };
    }
    // Debug logging
    console.log('[DEBUG] recordAttendance called with:', classCode);
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    const normalizedInput = classCode.trim().toLowerCase();
    console.log('[DEBUG] Normalized input:', normalizedInput);
    console.log('[DEBUG] Classes in storage:', classes.map(c => c.code));
    const classInfo = classes.find(c => c.code.trim().toLowerCase() === normalizedInput);
    if (!classInfo) {
        console.log('[DEBUG] No match found for:', normalizedInput);
        return {
            success: false,
            message: 'Invalid class code. Please check and try again.'
        };
    }
    
    // Get attendance records
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    
    // Check if already checked in for this class today
    const today = new Date().toLocaleDateString();
    const alreadyCheckedIn = attendance.some(record => 
        record.studentId === currentUser.studentId && 
        record.classCode === classCode && 
        new Date(record.date).toLocaleDateString() === today
    );
    
    if (alreadyCheckedIn) {
        return {
            success: false,
            message: 'You have already checked in for this class today.'
        };
    }
    
    // Record new attendance
    const attendanceRecord = {
        id: Date.now().toString(),
        studentId: currentUser.studentId,
        studentName: currentUser.fullName,
        classCode: classCode,
        courseName: classInfo.name,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        securityAnswer: securityAnswer || '',
        status: 'Present'
    };
    
    attendance.push(attendanceRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    
    return {
        success: true,
        message: 'Check-in successful!',
        record: attendanceRecord
    };
}

function getAttendanceData(studentId = null) {
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    
    if (!studentId && currentUser) {
        studentId = currentUser.studentId;
    }
    
    if (studentId) {
        return attendance.filter(record => record.studentId === studentId);
    }
    
    return attendance;
}

// Calendar Functions
function getCalendarData(year, month, studentId = null) {
    if (!studentId && currentUser) {
        studentId = currentUser.studentId;
    }
    
    if (!studentId) {
        return [];
    }
    
    const attendance = getAttendanceData(studentId);
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    
    // Generate calendar data for the specified month
    const calendarData = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayAttendance = attendance.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getDate() === day && 
                   recordDate.getMonth() === month && 
                   recordDate.getFullYear() === year;
        });
        
        const events = dayAttendance.map(record => {
            return {
                classCode: record.classCode,
                courseName: record.courseName,
                time: record.time,
                status: record.status
            };
        });
        
        calendarData.push({
            date: date,
            events: events
        });
    }
    
    return calendarData;
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getCurrentMonth() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth()
    };
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Ensure user menu is updated after a short delay to allow all elements to load
    setTimeout(updateUIForLoggedInUser, 100);
    
    // Check if logout button exists and add event listener
    const logoutBtn = document.querySelector('.logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
});

// Also update UI when window loads completely
window.addEventListener('load', function() {
    updateUIForLoggedInUser();
});

// Smart Attendance Tracking System (SATS) - Main Scripts
// Created for Al-Ryada University for Science & Technology (RST)
// Faculty of Computer Science and Artificial Intelligence

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.getElementById('themeToggle');
const calendarDaysGrid = document.getElementById('calendarDaysGrid');
const weekGrid = document.getElementById('weekGrid');
const daySchedule = document.getElementById('daySchedule');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const viewButtons = document.querySelectorAll('.calendar-view-options button');
const calendarViews = document.querySelectorAll('.calendar-view');

// Calendar State
let currentDate = new Date();
let currentView = 'month';
let events = [];

// Initialize Calendar
function initCalendar() {
    // Load events from localStorage or API
    loadEvents();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial view
    renderCalendar();
}

// Load Events
function loadEvents() {
    // TODO: Replace with actual API call
    events = [
        {
            id: 1,
            title: 'CS101',
            date: '2025-05-03',
            time: '09:30',
            duration: 75,
            status: 'present',
            location: 'CS Building, Room 305'
        },
        {
            id: 2,
            title: 'DB250',
            date: '2025-05-03',
            time: '13:00',
            duration: 75,
            status: 'present',
            location: 'CS Building, Room 120'
        }
    ];
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Calendar navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // View switching
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchView(button.dataset.view);
        });
    });
}

// Switch Calendar View
function switchView(view) {
    currentView = view;
    // Update active button
    viewButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.view === view);
    });
    // Update active view
    calendarViews.forEach(viewElement => {
        viewElement.classList.toggle('active', viewElement.id === `${view}View`);
    });
    // Render the new view
    renderCalendar();
}

// Render Calendar
function renderCalendar() {
    switch (currentView) {
        case 'month':
            renderMonthView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'day':
            renderDayView();
            break;
    }
    
    // Update month/year display
    if (currentMonthYear) {
        currentMonthYear.textContent = currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    }
}

// Render Month View
function renderMonthView() {
    if (!calendarDaysGrid) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Clear existing content
    calendarDaysGrid.innerHTML = '';
    
    // Add empty cells for days before start of month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDaysGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        
        // Add events for this day
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === month &&
                   eventDate.getFullYear() === year;
        });
        
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event ${event.status}`;
            eventElement.innerHTML = `
                <span class="event-time">${formatTime(event.time)}</span>
                <span class="event-title">${event.title}</span>
            `;
            eventsContainer.appendChild(eventElement);
        });
        
        dayElement.appendChild(eventsContainer);
        calendarDaysGrid.appendChild(dayElement);
    }
}

// Render Week View
function renderWeekView() {
    if (!weekGrid) return;
    
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Update week header
    const weekHeader = document.querySelector('.week-header');
    if (weekHeader) {
        weekHeader.innerHTML = `
            ${Array.from({ length: 7 }, (_, i) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const isToday = new Date().toDateString() === date.toDateString();
                return `
                    <div class="day-column ${isToday ? 'current-day' : ''}">
                        <div class="weekday">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div class="date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                `;
            }).join('')}
        `;
    }
    
    // Only show empty week grid (no time slots)
    weekGrid.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        weekGrid.appendChild(dayColumn);
    }
}

// Helper Functions
function getWeekStart(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initCalendar);