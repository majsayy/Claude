// Workout Tracker Application

// State
let workouts = [];
let currentView = 'day';
let currentDate = new Date();
let selectedWorkoutId = null;

// DOM Elements
const viewTabs = document.querySelectorAll('.tab-btn');
const dateDisplay = document.getElementById('current-date-display');
const prevDateBtn = document.getElementById('prev-date');
const nextDateBtn = document.getElementById('next-date');
const addWorkoutBtn = document.getElementById('add-workout-btn');
const workoutList = document.getElementById('workout-list');
const workoutModal = document.getElementById('workout-modal');
const detailModal = document.getElementById('detail-modal');
const workoutForm = document.getElementById('workout-form');
const closeModalBtn = document.getElementById('close-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal');
const cancelBtn = document.getElementById('cancel-btn');
const intensitySlider = document.getElementById('intensity');
const intensityValue = document.getElementById('intensity-value');
const muscleFrequencyChart = document.getElementById('muscle-frequency-chart');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    setupEventListeners();
    updateDateDisplay();
    renderCurrentView();
    updateMuscleFrequency();
});

// Event Listeners
function setupEventListeners() {
    // View tabs
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentView = tab.dataset.view;
            renderCurrentView();
        });
    });

    // Date navigation
    prevDateBtn.addEventListener('click', () => navigateDate(-1));
    nextDateBtn.addEventListener('click', () => navigateDate(1));

    // Add workout
    addWorkoutBtn.addEventListener('click', openAddWorkoutModal);

    // Modal controls
    closeModalBtn.addEventListener('click', closeWorkoutModal);
    closeDetailModalBtn.addEventListener('click', closeDetailModal);
    cancelBtn.addEventListener('click', closeWorkoutModal);
    workoutModal.addEventListener('click', (e) => {
        if (e.target === workoutModal) closeWorkoutModal();
    });
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetailModal();
    });

    // Form submission
    workoutForm.addEventListener('submit', handleWorkoutSubmit);

    // Intensity slider
    intensitySlider.addEventListener('input', () => {
        intensityValue.textContent = intensitySlider.value;
    });

    // Detail modal actions
    document.getElementById('edit-workout-btn').addEventListener('click', () => {
        closeDetailModal();
        openEditWorkoutModal(selectedWorkoutId);
    });

    document.getElementById('delete-workout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this workout?')) {
            deleteWorkout(selectedWorkoutId);
            closeDetailModal();
        }
    });

    // Auto-calculate volume when sets, reps, weight change
    ['sets', 'reps', 'weight'].forEach(id => {
        document.getElementById(id).addEventListener('input', autoCalculateVolume);
    });
}

// Data Management
function loadWorkouts() {
    const stored = localStorage.getItem('workouts');
    if (stored) {
        workouts = JSON.parse(stored);
    }
}

function saveWorkouts() {
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Date Helpers
function formatDate(date, format = 'full') {
    const options = {
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        short: { month: 'short', day: 'numeric' },
        iso: null
    };

    if (format === 'iso') {
        return date.toISOString().split('T')[0];
    }

    return date.toLocaleDateString('en-US', options[format] || options.full);
}

function getWeekDates(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
    }
    return days;
}

function getMonthDates(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const dates = [];
    let current = new Date(startDate);
    while (current <= lastDay || dates.length % 7 !== 0) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function isSameDay(date1, date2) {
    return formatDate(date1, 'iso') === formatDate(date2, 'iso');
}

function isToday(date) {
    return isSameDay(date, new Date());
}

// Navigation
function navigateDate(direction) {
    switch (currentView) {
        case 'day':
            currentDate.setDate(currentDate.getDate() + direction);
            break;
        case 'week':
            currentDate.setDate(currentDate.getDate() + (direction * 7));
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + direction);
            break;
    }
    updateDateDisplay();
    renderCurrentView();
    updateMuscleFrequency();
}

function updateDateDisplay() {
    let displayText;
    switch (currentView) {
        case 'day':
            displayText = formatDate(currentDate);
            break;
        case 'week':
            const weekDates = getWeekDates(currentDate);
            displayText = `${formatDate(weekDates[0], 'short')} - ${formatDate(weekDates[6], 'short')}, ${weekDates[6].getFullYear()}`;
            break;
        case 'month':
            displayText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            break;
    }
    dateDisplay.textContent = displayText;
}

// Render Functions
function renderCurrentView() {
    updateDateDisplay();
    switch (currentView) {
        case 'day':
            renderDayView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'month':
            renderMonthView();
            break;
    }
}

function renderDayView() {
    const dayWorkouts = getWorkoutsForDate(currentDate);

    if (dayWorkouts.length === 0) {
        workoutList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3>No workouts</h3>
                <p>No workouts logged for this day. Click "Add Workout" to get started!</p>
            </div>
        `;
        return;
    }

    workoutList.innerHTML = dayWorkouts.map(workout => createWorkoutCard(workout)).join('');

    // Add click handlers
    document.querySelectorAll('.workout-card').forEach(card => {
        card.addEventListener('click', () => openDetailModal(card.dataset.id));
    });
}

function renderWeekView() {
    const weekDates = getWeekDates(currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate week stats
    const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return weekDates.some(d => isSameDay(d, workoutDate));
    });

    const totalDuration = weekWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
    const avgIntensity = weekWorkouts.length > 0
        ? (weekWorkouts.reduce((sum, w) => sum + (parseInt(w.intensity) || 0), 0) / weekWorkouts.length).toFixed(1)
        : 0;

    let html = `
        <div class="summary-stats">
            <div class="summary-card">
                <div class="label">Workouts</div>
                <div class="value">${weekWorkouts.length}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Time</div>
                <div class="value">${totalDuration}</div>
                <div class="sub-value">minutes</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Intensity</div>
                <div class="value">${avgIntensity}</div>
                <div class="sub-value">/ 10</div>
            </div>
        </div>
        <div class="week-grid">
    `;

    weekDates.forEach((date, index) => {
        const dayWorkouts = getWorkoutsForDate(date);
        const todayClass = isToday(date) ? 'today' : '';

        html += `
            <div class="week-day ${todayClass}" data-date="${formatDate(date, 'iso')}">
                <div class="day-header">
                    <div class="day-name">${dayNames[index]}</div>
                    <div class="day-number">${date.getDate()}</div>
                </div>
                ${dayWorkouts.length > 0 ? `
                    ${dayWorkouts.slice(0, 3).map(() => '<div class="workout-indicator"></div>').join('')}
                    <div class="workout-count">${dayWorkouts.length} workout${dayWorkouts.length > 1 ? 's' : ''}</div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    workoutList.innerHTML = html;

    // Add click handlers for week days
    document.querySelectorAll('.week-day').forEach(day => {
        day.addEventListener('click', () => {
            currentDate = new Date(day.dataset.date);
            viewTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-view="day"]').classList.add('active');
            currentView = 'day';
            renderCurrentView();
        });
    });
}

function renderMonthView() {
    const monthDates = getMonthDates(currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentMonth = currentDate.getMonth();

    // Calculate month stats
    const monthWorkouts = workouts.filter(w => {
        const d = new Date(w.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentDate.getFullYear();
    });

    const totalDuration = monthWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
    const activeDays = new Set(monthWorkouts.map(w => w.date)).size;

    let html = `
        <div class="summary-stats">
            <div class="summary-card">
                <div class="label">Total Workouts</div>
                <div class="value">${monthWorkouts.length}</div>
            </div>
            <div class="summary-card">
                <div class="label">Active Days</div>
                <div class="value">${activeDays}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Time</div>
                <div class="value">${Math.round(totalDuration / 60)}</div>
                <div class="sub-value">hours</div>
            </div>
        </div>
        <div class="month-calendar">
            <div class="calendar-header">
                ${dayNames.map(name => `<span>${name}</span>`).join('')}
            </div>
            <div class="calendar-grid">
    `;

    monthDates.forEach(date => {
        const dayWorkouts = getWorkoutsForDate(date);
        const isOtherMonth = date.getMonth() !== currentMonth;
        const todayClass = isToday(date) ? 'today' : '';
        const otherMonthClass = isOtherMonth ? 'other-month' : '';

        html += `
            <div class="calendar-day ${todayClass} ${otherMonthClass}" data-date="${formatDate(date, 'iso')}">
                <div class="date-num">${date.getDate()}</div>
                <div class="day-workouts">
                    ${dayWorkouts.slice(0, 2).map(w => `
                        <div class="day-workout-item">${getWorkoutTypeLabel(w.type)}</div>
                    `).join('')}
                    ${dayWorkouts.length > 2 ? `<div class="day-workout-item">+${dayWorkouts.length - 2} more</div>` : ''}
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    workoutList.innerHTML = html;

    // Add click handlers for calendar days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', () => {
            currentDate = new Date(day.dataset.date);
            viewTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-view="day"]').classList.add('active');
            currentView = 'day';
            renderCurrentView();
        });
    });
}

function createWorkoutCard(workout) {
    const intensityClass = workout.intensity <= 3 ? 'low' : workout.intensity <= 6 ? 'medium' : 'high';
    const intensityLabel = workout.intensity <= 3 ? 'Easy' : workout.intensity <= 6 ? 'Moderate' : 'Hard';

    return `
        <div class="workout-card" data-id="${workout.id}">
            <div class="card-header">
                <span class="workout-title">${getWorkoutTypeLabel(workout.type)}</span>
                <span class="intensity-badge ${intensityClass}">${intensityLabel} (${workout.intensity}/10)</span>
            </div>
            <div class="workout-meta">
                ${workout.sets ? `<span class="meta-item"><strong>${workout.sets}</strong> sets</span>` : ''}
                ${workout.reps ? `<span class="meta-item"><strong>${workout.reps}</strong> reps</span>` : ''}
                ${workout.weight ? `<span class="meta-item"><strong>${workout.weight}</strong></span>` : ''}
                ${workout.duration ? `<span class="meta-item"><strong>${workout.duration}</strong> min</span>` : ''}
                ${workout.restTime ? `<span class="meta-item"><strong>${workout.restTime}s</strong> rest</span>` : ''}
            </div>
            ${workout.muscleGroups && workout.muscleGroups.length > 0 ? `
                <div class="muscle-tags">
                    ${workout.muscleGroups.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Helper Functions
function getWorkoutsForDate(date) {
    const dateStr = formatDate(date, 'iso');
    return workouts.filter(w => w.date === dateStr).sort((a, b) => b.id.localeCompare(a.id));
}

function getWorkoutTypeLabel(type) {
    const labels = {
        strength: 'Strength Training',
        cardio: 'Cardio',
        hiit: 'HIIT',
        flexibility: 'Flexibility/Yoga',
        sports: 'Sports',
        other: 'Other'
    };
    return labels[type] || type;
}

// Modal Functions
function openAddWorkoutModal() {
    document.getElementById('modal-title').textContent = 'Add Workout';
    document.getElementById('workout-id').value = '';
    workoutForm.reset();
    document.getElementById('workout-date').value = formatDate(currentDate, 'iso');
    intensitySlider.value = 5;
    intensityValue.textContent = '5';
    workoutModal.classList.add('active');
}

function openEditWorkoutModal(id) {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    document.getElementById('modal-title').textContent = 'Edit Workout';
    document.getElementById('workout-id').value = workout.id;
    document.getElementById('workout-date').value = workout.date;
    document.getElementById('workout-type').value = workout.type;
    document.getElementById('sets').value = workout.sets || '';
    document.getElementById('reps').value = workout.reps || '';
    document.getElementById('weight').value = workout.weight || '';
    document.getElementById('volume').value = workout.volume || '';
    document.getElementById('rest-time').value = workout.restTime || '';
    document.getElementById('duration').value = workout.duration || '';
    document.getElementById('intensity').value = workout.intensity || 5;
    intensityValue.textContent = workout.intensity || 5;
    document.getElementById('exercises').value = workout.exercises || '';
    document.getElementById('notes').value = workout.notes || '';

    // Set muscle groups
    document.querySelectorAll('#muscle-groups input[type="checkbox"]').forEach(cb => {
        cb.checked = workout.muscleGroups && workout.muscleGroups.includes(cb.value);
    });

    workoutModal.classList.add('active');
}

function closeWorkoutModal() {
    workoutModal.classList.remove('active');
}

function openDetailModal(id) {
    selectedWorkoutId = id;
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    const intensityClass = workout.intensity <= 3 ? 'low' : workout.intensity <= 6 ? 'medium' : 'high';

    const content = `
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Sets</div>
                <div class="stat-value">${workout.sets || '-'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Reps</div>
                <div class="stat-value">${workout.reps || '-'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Weight</div>
                <div class="stat-value">${workout.weight || '-'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Volume</div>
                <div class="stat-value">${workout.volume || '-'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Rest Time</div>
                <div class="stat-value">${workout.restTime ? workout.restTime + 's' : '-'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Duration</div>
                <div class="stat-value">${workout.duration ? workout.duration + ' min' : '-'}</div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Type</h4>
            <p>${getWorkoutTypeLabel(workout.type)}</p>
        </div>

        <div class="detail-section">
            <h4>Intensity</h4>
            <p><span class="intensity-badge ${intensityClass}">${workout.intensity}/10</span></p>
        </div>

        ${workout.muscleGroups && workout.muscleGroups.length > 0 ? `
            <div class="detail-section">
                <h4>Muscle Groups</h4>
                <div class="muscle-tags">
                    ${workout.muscleGroups.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${workout.exercises ? `
            <div class="detail-section">
                <h4>Exercises</h4>
                <pre>${workout.exercises}</pre>
            </div>
        ` : ''}

        ${workout.notes ? `
            <div class="detail-section">
                <h4>Notes</h4>
                <pre>${workout.notes}</pre>
            </div>
        ` : ''}

        <div class="detail-section">
            <h4>Date</h4>
            <p>${formatDate(new Date(workout.date))}</p>
        </div>
    `;

    document.getElementById('workout-detail-content').innerHTML = content;
    detailModal.classList.add('active');
}

function closeDetailModal() {
    detailModal.classList.remove('active');
    selectedWorkoutId = null;
}

// Form Handling
function handleWorkoutSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('workout-id').value;
    const muscleGroups = Array.from(document.querySelectorAll('#muscle-groups input:checked')).map(cb => cb.value);

    const workoutData = {
        id: id || generateId(),
        date: document.getElementById('workout-date').value,
        type: document.getElementById('workout-type').value,
        muscleGroups,
        sets: document.getElementById('sets').value,
        reps: document.getElementById('reps').value,
        weight: document.getElementById('weight').value,
        volume: document.getElementById('volume').value,
        restTime: document.getElementById('rest-time').value,
        duration: document.getElementById('duration').value,
        intensity: document.getElementById('intensity').value,
        exercises: document.getElementById('exercises').value,
        notes: document.getElementById('notes').value
    };

    if (id) {
        // Update existing workout
        const index = workouts.findIndex(w => w.id === id);
        if (index !== -1) {
            workouts[index] = workoutData;
        }
    } else {
        // Add new workout
        workouts.push(workoutData);
    }

    saveWorkouts();
    closeWorkoutModal();
    renderCurrentView();
    updateMuscleFrequency();
}

function deleteWorkout(id) {
    workouts = workouts.filter(w => w.id !== id);
    saveWorkouts();
    renderCurrentView();
    updateMuscleFrequency();
}

function autoCalculateVolume() {
    const sets = parseInt(document.getElementById('sets').value) || 0;
    const repsStr = document.getElementById('reps').value;
    const weightStr = document.getElementById('weight').value;

    // Parse reps (handle ranges like "8-12")
    let reps = 0;
    if (repsStr) {
        if (repsStr.includes('-')) {
            const parts = repsStr.split('-').map(p => parseInt(p.trim()));
            reps = Math.round((parts[0] + parts[1]) / 2);
        } else {
            reps = parseInt(repsStr) || 0;
        }
    }

    // Parse weight (remove units)
    const weight = parseFloat(weightStr.replace(/[^\d.]/g, '')) || 0;

    if (sets > 0 && reps > 0 && weight > 0) {
        const volume = sets * reps * weight;
        document.getElementById('volume').value = volume.toLocaleString();
    }
}

// Muscle Frequency Tracking
function updateMuscleFrequency() {
    const weekDates = getWeekDates(currentDate);
    const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return weekDates.some(d => isSameDay(d, workoutDate));
    });

    const muscleCount = {};
    const allMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'glutes', 'calves', 'forearms', 'full-body'];

    allMuscles.forEach(m => muscleCount[m] = 0);

    weekWorkouts.forEach(workout => {
        if (workout.muscleGroups) {
            workout.muscleGroups.forEach(muscle => {
                muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
            });
        }
    });

    const maxCount = Math.max(...Object.values(muscleCount), 1);

    muscleFrequencyChart.innerHTML = Object.entries(muscleCount)
        .filter(([_, count]) => count > 0 || allMuscles.includes(_))
        .map(([muscle, count]) => {
            let levelClass = '';
            if (count >= 3) levelClass = 'high';
            else if (count >= 2) levelClass = 'medium';
            else if (count >= 1) levelClass = 'low';

            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return `
                <div class="muscle-item ${levelClass}">
                    <span class="name">${muscle.replace('-', ' ')}</span>
                    <span class="count">${count}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            `;
        }).join('');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWorkoutModal();
        closeDetailModal();
    }
});
