/* 
    HydraTrack - Main Logic 
    Handles state management, local storage, goal calculation (Weight * 33),
    and UI updates.
*/

// --- DOM Elements ---
const weightInput = document.getElementById('weight-input');
const saveWeightBtn = document.getElementById('save-weight-btn');
const goalDisplay = document.getElementById('goal-amount');
const waterFill = document.getElementById('water-fill');
const percentText = document.getElementById('percentage-text');
const drankDisplay = document.getElementById('drank-amount');
const remainingDisplay = document.getElementById('remaining-amount');
const addWaterBtn = document.getElementById('add-water-btn');
const cupButtons = document.querySelectorAll('.cup-btn');
const historyList = document.getElementById('history-list');
const resetBtn = document.getElementById('reset-day-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const tipText = document.getElementById('tip-text');
const currentDateEl = document.getElementById('current-date');
const modal = document.getElementById('celebration-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// --- App State ---
let appState = {
    weight: 0,
    dailyGoal: 0, // Calculated as weight * 33
    currentIntake: 0,
    selectedCupSize: 350,
    history: [],
    lastDate: new Date().toDateString(),
    goalReachedToday: false
};

// --- Hydration Tips ---
const tips = [
    "Start your day with a glass!",
    "Great start! Keep sipping.",
    "Halfway there! Your skin thanks you.",
    "Almost done! One more push.",
    "Hydration champion! Goal reached.",
    "Drink water before meals to aid digestion."
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkDateReset();
    updateUI();
    setupEventListeners();
    
    // Display current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
});

// --- Core Functions ---

/**
 * Loads data from LocalStorage
 */
function loadData() {
    const savedData = localStorage.getItem('hydraTrackData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            // Merge saved data with default structure to prevent errors if structure changes
            appState = { ...appState, ...parsed };
            console.log('Data loaded:', appState);
        } catch (e) {
            console.error('Error loading data', e);
        }
    }
}

/**
 * Saves current state to LocalStorage
 */
function saveData() {
    localStorage.setItem('hydraTrackData', JSON.stringify(appState));
    console.log('Data saved');
}

/**
 * Checks if the day has changed to reset intake
 */
function checkDateReset() {
    const today = new Date().toDateString();
    if (appState.lastDate !== today) {
        appState.currentIntake = 0;
        appState.history = [];
        appState.goalReachedToday = false;
        appState.lastDate = today;
        saveData();
        console.log('New day detected. Progress reset.');
    }
}

/**
 * Calculates daily goal based on weight
 * Formula: Weight (kg) * 33 = Goal (ml)
 */
function calculateGoal(weight) {
    return Math.round(weight * 33);
}

/**
 * Updates all visual elements based on state
 */
function updateUI() {
    // 1. Update Goal
    if (appState.weight > 0) {
        weightInput.value = appState.weight;
        goalDisplay.textContent = appState.dailyGoal;
    } else {
        goalDisplay.textContent = "0";
    }

    // 2. Update Stats
    drankDisplay.textContent = appState.currentIntake;
    const remaining = Math.max(0, appState.dailyGoal - appState.currentIntake);
    remainingDisplay.textContent = remaining;

    // 3. Update Visuals (Glass & Percentage)
    let percentage = 0;
    if (appState.dailyGoal > 0) {
        percentage = Math.min(100, Math.round((appState.currentIntake / appState.dailyGoal) * 100));
    }
    
    waterFill.style.height = `${percentage}%`;
    percentText.textContent = `${percentage}%`;

    // 4. Update History List
    renderHistory();

    // 5. Update Tips
    updateTip(percentage);

    // 6. Update Cup Selection UI
    cupButtons.forEach(btn => {
        if (parseInt(btn.dataset.size) === appState.selectedCupSize) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 7. Check Celebration
    if (percentage >= 100 && !appState.goalReachedToday && appState.dailyGoal > 0) {
        showCelebration();
        appState.goalReachedToday = true;
        saveData();
    }
}

function updateTip(percentage) {
    let tipIndex = 0;
    if (percentage === 0) tipIndex = 0;
    else if (percentage < 30) tipIndex = 1;
    else if (percentage < 60) tipIndex = 2;
    else if (percentage < 90) tipIndex = 3;
    else tipIndex = 4;
    
    // Randomize slightly for variety if not 100% or 0%
    if (percentage > 0 && percentage < 100 && Math.random() > 0.7) {
        tipIndex = 5; 
    }
    
    tipText.textContent = tips[tipIndex];
}

function renderHistory() {
    historyList.innerHTML = '';
    if (appState.history.length === 0) {
        historyList.innerHTML = '<li class="empty-msg">No water intake yet today.</li>';
        return;
    }

    // Show latest first
    const reversedHistory = [...appState.history].reverse();

    reversedHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span>${item.time}</span>
            <span>+${item.amount} ml</span>
        `;
        historyList.appendChild(li);
    });
}

function showCelebration() {
    modal.classList.remove('hidden');
    // Optional: play a sound here if desired
}

// --- Event Listeners ---

// 1. Save Weight / Set Goal
saveWeightBtn.addEventListener('click', () => {
    const weight = parseFloat(weightInput.value);
    
    if (isNaN(weight) || weight <= 0) {
        alert("Please enter a valid weight in kg.");
        return;
    }

    appState.weight = weight;
    appState.dailyGoal = calculateGoal(weight);
    
    // Recalculate goal-reached status in case goal increased
    if (appState.dailyGoal > appState.currentIntake) {
        appState.goalReachedToday = false;
    }

    saveData();
    updateUI();
});

// 2. Cup Size Selector
cupButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        appState.selectedCupSize = parseInt(e.target.dataset.size);
        saveData();
        updateUI();
    });
});

// 3. Add Water
addWaterBtn.addEventListener('click', () => {
    if (appState.dailyGoal === 0) {
        alert("Please set your weight first!");
        weightInput.focus();
        return;
    }

    const amount = appState.selectedCupSize;
    appState.currentIntake += amount;
    
    // Add to history
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appState.history.push({ time: timeString, amount: amount });

    saveData();
    updateUI();
});

// 4. Reset Today
resetBtn.addEventListener('click', () => {
    if (confirm("Reset today's progress?")) {
        appState.currentIntake = 0;
        appState.history = [];
        appState.goalReachedToday = false;
        saveData();
        updateUI();
    }
});

// 5. Clear All Data
clearAllBtn.addEventListener('click', () => {
    if (confirm("This will delete your weight settings and all history. Are you sure?")) {
        localStorage.removeItem('hydraTrackData');
        // Reset state to defaults
        appState = {
            weight: 0,
            dailyGoal: 0,
            currentIntake: 0,
            selectedCupSize: 350,
            history: [],
            lastDate: new Date().toDateString(),
            goalReachedToday: false
        };
        updateUI();
    }
});

// 6. Close Modal
closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Close modal on click outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});
