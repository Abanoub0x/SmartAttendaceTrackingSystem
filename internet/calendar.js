/* Bob is here */
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.attendanceData = [];
        this.init();
    }

    init() {
        // Load attendance data
        this.loadAttendanceData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial render
        this.renderCalendar();
        this.updateMonthYearDisplay();
        this.updateSummaryStats();
    }

    loadAttendanceData() {
        // Get attendance data from localStorage
        const data = localStorage.getItem('sats_attendance');
        this.attendanceData = data ? JSON.parse(data) : [];
        
        // Filter for current user if logged in
        const currentUser = JSON.parse(localStorage.getItem('sats_current_user'));
        if (currentUser) {
            this.attendanceData = this.attendanceData.filter(record => 
                record.studentId === currentUser.studentId
            );
        }
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        
        // View buttons
        document.querySelectorAll('.calendar-view-options button').forEach(button => {
            button.addEventListener('click', () => this.switchView(button.dataset.view));
        });
        
        // Filters
        document.getElementById('calendarCourseFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('calendarStatusFilter')?.addEventListener('change', () => this.applyFilters());
    }

    navigateMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
        this.updateMonthYearDisplay();
        this.updateSummaryStats();
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.calendar-view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        
        document.querySelectorAll('.calendar-view-options button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderCalendar();
    }

    updateMonthYearDisplay() {
        const monthYear = document.getElementById('currentMonthYear');
        if (monthYear) {
            monthYear.textContent = this.currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }
    }

    renderCalendar() {
        switch (this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    renderMonthView() {
        const daysGrid = document.getElementById('calendarDaysGrid');
        if (!daysGrid) return;
        
        daysGrid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Get today's date for comparison
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            daysGrid.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayCell = document.createElement('div');
            const date = new Date(year, month, day);
            // Use local date string for comparison
            const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
            
            // Check if this is today
            const isToday = isCurrentMonth && day === today.getDate();
            
            // Find attendance records for this day (compare only local date)
            const dayRecords = this.attendanceData.filter(record => {
                const recordDateObj = new Date(record.date);
                const recordDateStr = recordDateObj.getFullYear() + '-' + String(recordDateObj.getMonth() + 1).padStart(2, '0') + '-' + String(recordDateObj.getDate()).padStart(2, '0');
                return recordDateStr === dateStr;
            });
            
            // Set classes for the day cell
            dayCell.className = `calendar-day ${isToday ? 'today' : ''}`;
            
            // Create day content
            const dayContent = document.createElement('div');
            dayContent.className = 'day-content';
            
            // Add day number
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayContent.appendChild(dayNumber);
            
            // Add attendance information (only course name, no status)
            if (dayRecords.length > 0) {
                const attendanceInfo = document.createElement('div');
                attendanceInfo.className = 'attendance-info';
                
                dayRecords.forEach(record => {
                    const recordDiv = document.createElement('div');
                    recordDiv.className = `attendance-record ${record.status.toLowerCase()}`;
                    recordDiv.innerHTML = `
                        <span class="course-name">${record.courseName}</span>
                    `;
                    attendanceInfo.appendChild(recordDiv);
                });
                
                dayContent.appendChild(attendanceInfo);
            }
            
            // Add attendance markers
            if (dayRecords.length > 0) {
                const markers = document.createElement('div');
                markers.className = 'attendance-markers';
                markers.innerHTML = dayRecords.map(record => `
                    <span class="marker ${record.status.toLowerCase()}" 
                          title="${record.courseName}">
                    </span>
                `).join('');
                dayContent.appendChild(markers);
            }
            
            dayCell.appendChild(dayContent);
            daysGrid.appendChild(dayCell);
        }
    }

    createAttendanceMarkers(records) {
        if (records.length === 0) return '';
        
        return `
            <div class="attendance-markers">
                ${records.map(record => `
                    <span class="marker ${record.status.toLowerCase()}" 
                          title="${record.courseName}: ${record.status}">
                    </span>
                `).join('')}
            </div>
        `;
    }

    updateSummaryStats() {
        // Get data for current month
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthData = this.attendanceData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === month;
        });
        
        // Update total classes
        document.getElementById('totalClasses').textContent = monthData.length;
        
        // Calculate attendance rate
        const presentCount = monthData.filter(record => 
            record.status.toLowerCase() === 'present'
        ).length;
        const rate = monthData.length ? Math.round((presentCount / monthData.length) * 100) : 0;
        document.getElementById('monthAttendanceRate').textContent = `${rate}%`;
        
        // Find most attended course
        const courseCounts = {};
        monthData.forEach(record => {
            courseCounts[record.classCode] = (courseCounts[record.classCode] || 0) + 1;
        });
        
        const mostAttended = Object.entries(courseCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        document.getElementById('mostAttendedCourse').textContent = mostAttended;
    }

    applyFilters() {
        this.loadAttendanceData();
        
        const courseFilter = document.getElementById('calendarCourseFilter').value;
        const statusFilter = document.getElementById('calendarStatusFilter').value;
        
        if (courseFilter !== 'all') {
            this.attendanceData = this.attendanceData.filter(record => 
                record.classCode === courseFilter
            );
        }
        
        if (statusFilter !== 'all') {
            this.attendanceData = this.attendanceData.filter(record => 
                record.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }
        
        this.renderCalendar();
        this.updateSummaryStats();
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalendarManager();
}); 