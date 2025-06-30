// Attendance data storage and retrieval functions
function getAttendanceData() {
    const attendanceData = localStorage.getItem('sats_attendance');
    return attendanceData ? JSON.parse(attendanceData) : [];
}

function saveAttendanceData(data) {
    localStorage.setItem('sats_attendance', JSON.stringify(data));
}

// Function to add a new attendance record
function addAttendanceRecord(record) {
    const currentData = getAttendanceData();
    currentData.push(record);
    saveAttendanceData(currentData);
}

function populateClassOptions() {
    const attendance = getAttendanceData();
    const classSelect = document.getElementById('filter-class');
    
    // Clear existing options except the first one
    while (classSelect.options.length > 1) {
        classSelect.remove(1);
    }
    
    // Get unique class codes
    const classCodes = [...new Set(attendance.map(record => record.classCode))];
    
    // Add options
    classCodes.forEach(classCode => {
        const option = document.createElement('option');
        option.value = classCode;
        option.textContent = classCode;
        classSelect.appendChild(option);
    });
}

function displayAttendanceHistory() {
    const attendanceData = getAttendanceData();
    const tableBody = document.getElementById('attendance-data');
    const noRecordsMessage = document.getElementById('no-records-message');
    
    // Get filter values
    const monthFilter = document.getElementById('filter-month').value;
    const classFilter = document.getElementById('filter-class').value;
    const statusFilter = document.getElementById('filter-status').value;
    
    // Apply filters
    let filteredData = attendanceData;
    
    if (monthFilter !== 'all') {
        filteredData = filteredData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() + 1 === parseInt(monthFilter);
        });
    }
    
    if (classFilter !== 'all') {
        filteredData = filteredData.filter(record => record.classCode === classFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredData = filteredData.filter(record => record.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Sort data by date (most recent first)
    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Display data or message
    if (filteredData.length > 0) {
        noRecordsMessage.style.display = 'none';
        
        filteredData.forEach(record => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(record.date).toLocaleDateString();
            row.appendChild(dateCell);
            
            const timeCell = document.createElement('td');
            timeCell.textContent = record.time;
            row.appendChild(timeCell);
            
            const studentIdCell = document.createElement('td');
            studentIdCell.textContent = record.studentId;
            row.appendChild(studentIdCell);
            
            const classCodeCell = document.createElement('td');
            classCodeCell.textContent = record.classCode;
            row.appendChild(classCodeCell);
            
            const courseNameCell = document.createElement('td');
            courseNameCell.textContent = record.courseName || 'N/A';
            row.appendChild(courseNameCell);
            
            const statusCell = document.createElement('td');
            const statusSpan = document.createElement('span');
            statusSpan.className = `status-badge ${record.status.toLowerCase()}`;
            statusSpan.textContent = record.status;
            statusCell.appendChild(statusSpan);
            row.appendChild(statusCell);
            
            tableBody.appendChild(row);
        });
        
        // Update stats
        updateAttendanceStats(filteredData);
    } else {
        noRecordsMessage.style.display = 'flex';
        
        // Reset stats
        document.getElementById('total-attendance').textContent = '0';
        document.getElementById('present-count').textContent = '0';
        document.getElementById('absent-count').textContent = '0';
        document.getElementById('attendance-percentage').textContent = '0%';
    }
}

function updateAttendanceStats(data) {
    const totalClasses = data.length;
    const presentCount = data.filter(record => record.status.toLowerCase() === 'present').length;
    const absentCount = totalClasses - presentCount;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
    document.getElementById('total-attendance').textContent = totalClasses;
    document.getElementById('present-count').textContent = presentCount;
    document.getElementById('absent-count').textContent = absentCount;
    document.getElementById('attendance-percentage').textContent = `${attendancePercentage}%`;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('sats_current_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    displayAttendanceHistory();
    
    // Set up filter event listeners
    document.getElementById('filter-month').addEventListener('change', displayAttendanceHistory);
    document.getElementById('filter-class').addEventListener('change', displayAttendanceHistory);
    document.getElementById('filter-status').addEventListener('change', displayAttendanceHistory);
    
    // Populate class filter options
    populateClassOptions();
}); 

/* Bob is here */