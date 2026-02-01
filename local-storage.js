// ============================================
// LOCAL STORAGE MANAGER FOR HYDRATRACK
// ============================================

// Global variables
let currentWater = 0;
let dailyGoal = 2000; // Default goal
let currentDate = new Date().toDateString(); // Gets today's date
let cupSize = 350; // Default cup size
let history = []; // Array to store drinking history

// Tips database
const tips = [
    "💡 Drink water within 30 minutes of waking up!",
    "💡 Keep a water bottle on your desk at all times",
    "💡 Drink before meals to aid digestion",
    "💡 If you feel hungry, drink water first - you might be thirsty!",
    "💡 Add lemon or cucumber slices for flavor",
    "💡 Drink a glass before and after exercise",
    "💡 Set hourly reminders on your phone",
    "💡 Drink more when it's hot or you're in AC",
    "💡 Your urine should be light yellow - check it!",
    "💡 Drink water instead of sugary drinks",
    "💡 Eat water-rich foods like watermelon and cucumber",
    "💡 Drink before you feel thirsty - thirst means you're already dehydrated"
];

// ============================================
// LOAD SAVED DATA WHEN PAGE LOADS
// ============================================

function loadSavedData() {
    console.log("🔍 Loading saved data from browser storage...");
    
    // 1. Load user's weight
    const savedWeight = localStorage.getItem('hydratrack_weight');
    if (savedWeight) {
        document.getElementById('weightInput').value = savedWeight;
        calculateGoal(savedWeight);
    }
    
    // 2. Load cup size preference
    const savedCupSize = localStorage.getItem('hydratrack_cupsize');
    if (savedCupSize) {
        cupSize = parseInt(savedCupSize);
        document.getElementById('cupSize').value = cupSize;
        document.getElementById('currentCupSize').textContent = cupSize;
        
        // Update active cup in UI
        document.querySelectorAll('.cup-option').forEach(option => {
            const optionSize = parseInt(option.querySelector('small').textContent.replace('ml', ''));
            option.classList.toggle('active', optionSize === cupSize);
        });
    }
    
    // 3. Check if we have data for today
    const lastSavedDate = localStorage.getItem('hydratrack_lastDate');
    const savedWater = localStorage.getItem('hydratrack_water');
    
    if (lastSavedDate === currentDate && savedWater) {
        // Continue from today
        currentWater = parseInt(savedWater);
        console.log(`💧 Continuing from today: ${currentWater}ml`);
    } else {
        // New day - reset water but keep other settings
        currentWater = 0;
        localStorage.setItem('hydratrack_lastDate', currentDate);
        localStorage.setItem('hydratrack_water', '0');
        console.log("🆕 New day started!");
    }
    
    // 4. Load drinking history
    const savedHistory = localStorage.getItem('hydratrack_history');
    if (savedHistory) {
        try {
            history = JSON.parse(savedHistory);
        } catch (e) {
            history = [];
            console.log("❌ Could not load history, starting fresh");
        }
    }
    
    // 5. Load lifetime total
    const lifetimeTotal = localStorage.getItem('hydratrack_lifetime') || '0';
    
    // 6. Update display
    updateDisplay();
    
    // 7. Update today's date display
    document.getElementById('todayDate').textContent = formatDate(new Date());
    
    // 8. Calculate storage used
    updateStorageUsed();
    
    // 9. Show welcome message
    showWelcomeMessage();
    
    console.log("✅ Data loaded successfully!");
}

// ============================================
// SAVE DATA TO LOCAL STORAGE
// ============================================

function saveData() {
    console.log("💾 Saving data to browser storage...");
    
    // Save all data
    localStorage.setItem('hydratrack_weight', document.getElementById('weightInput').value || '');
    localStorage.setItem('hydratrack_goal', dailyGoal.toString());
    localStorage.setItem('hydratrack_water', currentWater.toString());
    localStorage.setItem('hydratrack_lastDate', currentDate);
    localStorage.setItem('hydratrack_cupsize', cupSize.toString());
    localStorage.setItem('hydratrack_history', JSON.stringify(history));
    
    // Calculate and save lifetime total
    let lifetimeTotal = parseInt(localStorage.getItem('hydratrack_lifetime') || '0');
    lifetimeTotal += currentWater;
    localStorage.setItem('hydratrack_lifetime', lifetimeTotal.toString());
    
    // Update last saved time
    const now = new Date();
    document.getElementById('lastSaved').textContent = 
        `${formatTime(now)} (${formatDate(now)})`;
    
    // Show save confirmation
    showSaveConfirmation();
    
    // Update storage usage
    updateStorageUsed();
    
    console.log("✅ Data saved!");
}

// Auto-save every 30 seconds
setInterval(saveData, 30000);

// ============================================
// MAIN FUNCTIONS
// ============================================

function setGoal() {
    const weightInput = document.getElementById('weightInput');
    const weight = parseFloat(weightInput.value);
    
    if (!weight || weight < 30 || weight > 200) {
        alert("Please enter a valid weight between 30-200 kg");
        weightInput.focus();
        return;
    }
    
    calculateGoal(weight);
    saveData();
    
    // Show success message
    showMessage(`Goal set! Drink ${(dailyGoal/1000).toFixed(1)}L daily`, 'success');
}

function calculateGoal(weight) {
    // Standard formula: 33ml per kg of body weight
    dailyGoal = Math.round(weight * 33);
    
    // Update display
    document.getElementById('goalAmount').textContent = dailyGoal;
    document.getElementById('goalLitres').textContent = (dailyGoal / 1000).toFixed(1);
    
    // Update progress labels
    document.getElementById('dynamicLabel').textContent = `Goal: ${dailyGoal}ml`;
}

function selectCup(size) {
    cupSize = size;
    
    // Update UI
    document.querySelectorAll('.cup-option').forEach(option => {
        const optionSize = parseInt(option.querySelector('small').textContent.replace('ml', ''));
        option.classList.toggle('active', optionSize === size);
    });
    
    document.getElementById('cupSize').value = size;
    document.getElementById('currentCupSize').textContent = size;
    
    // Save preference
    localStorage.setItem('hydratrack_cupsize', size.toString());
    
    // Show confirmation
    showMessage(`Cup size set to ${size}ml`, 'info');
}

function addWater() {
    // Add to current water
    currentWater += cupSize;
    
    // Add to history
    const now = new Date();
    history.push({
        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        amount: cupSize,
        total: currentWater,
        date: currentDate
    });
    
    // Keep only last 50 entries
    if (history.length > 50) {
        history = history.slice(-50);
    }
    
    // Update display
    updateDisplay();
    
    // Save automatically
    saveData();
    
    // Check if goal reached
    if (currentWater >= dailyGoal && dailyGoal > 0) {
        celebrateGoal();
    }
    
    // Show confirmation
    showMessage(`+${cupSize}ml added! Total: ${currentWater}ml`, 'success');
}

function undoDrink() {
    if (history.length > 0) {
        const lastDrink = history.pop();
        currentWater -= lastDrink.amount;
        
        updateDisplay();
        saveData();
        
        showMessage(`Undid ${lastDrink.amount}ml drink`, 'info');
    } else {
        showMessage('No drinks to undo', 'warning');
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function updateDisplay() {
    // Calculate percentage
    const percent = dailyGoal > 0 ? Math.min(100, (currentWater / dailyGoal) * 100) : 0;
    
    // Update water glass
    document.getElementById('waterFill').style.height = `${percent}%`;
    document.getElementById('waterLevel').textContent = `${Math.round(percent)}%`;
    
    // Update stats
    document.getElementById('currentWater').textContent = currentWater;
    document.getElementById('remainingWater').textContent = Math.max(0, dailyGoal - currentWater);
    document.getElementById('progressPercent').textContent = Math.round(percent);
    
    // Update progress bar
    document.getElementById('progressFill').style.width = `${percent}%`;
    
    // Update tip based on progress
    updateTip(percent);
}

function updateTip(percent) {
    const tipContent = document.getElementById('tipContent');
    
    let tipIndex = 0;
    if (percent < 25) {
        tipIndex = 0; // Start of day tip
    } else if (percent < 50) {
        tipIndex = 1; // Morning tip
    } else if (percent < 75) {
        tipIndex = 2; // Afternoon tip
    } else if (percent < 100) {
        tipIndex = 3; // Almost there tip
    } else {
        tipIndex = 4; // Goal achieved tip
    }
    
    tipContent.innerHTML = `
        <i class="fas fa-lightbulb"></i>
        <p>${tips[tipIndex]}</p>
    `;
}

function newTip() {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    const tipContent = document.getElementById('tipContent');
    
    tipContent.innerHTML = `
        <i class="fas fa-random"></i>
        <p>${randomTip}</p>
    `;
}

// ============================================
// HISTORY FUNCTIONS
// ============================================

function viewHistory() {
    const historyDisplay = document.getElementById('historyDisplay');
    
    if (history.length === 0) {
        historyDisplay.innerHTML = `
            <p class="empty-history">
                <i class="fas fa-clock"></i><br>
                No drinking history yet.<br>
                <small>Start by clicking "I Drank" button!</small>
            </p>
        `;
        return;
    }
    
    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Total</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Show last 10 entries (most recent first)
    const recentHistory = [...history].reverse().slice(0, 10);
    
    recentHistory.forEach(entry => {
        const entryPercent = dailyGoal > 0 ? Math.round((entry.total / dailyGoal) * 100) : 0;
        
        html += `
            <tr>
                <td>${entry.time}</td>
                <td>+${entry.amount}ml</td>
                <td>${entry.total}ml</td>
                <td>
                    <div style="background:#e0e0e0; height:10px; border-radius:5px; width:100px;">
                        <div style="background:#4fc3f7; height:100%; border-radius:5px; width:${Math.min(100, entryPercent)}%"></div>
                    </div>
                    ${Math.min(100, entryPercent)}%
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="text-align:center; margin-top:15px; color:#666;">
            Showing ${recentHistory.length} most recent drinks<br>
            <small>Total Lifetime: ${localStorage.getItem('hydratrack_lifetime') || '0'}ml</small>
        </p>
    `;
    
    historyDisplay.innerHTML = html;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function resetDay() {
    if (confirm("Reset today's water intake? Your weight goal will be kept.")) {
        currentWater = 0;
        history = [];
        updateDisplay();
        saveData();
        
        showMessage("Today's progress reset!", 'success');
        viewHistory();
    }
}

function clearAllData() {
    if (confirm("⚠️ WARNING: This will delete ALL your saved data!\n\n• Weight goal\n• Drinking history\n• All preferences\n\nThis cannot be undone. Continue?")) {
        localStorage.clear();
        currentWater = 0;
        dailyGoal = 2000;
        cupSize = 350;
        history = [];
        
        // Reset form
        document.getElementById('weightInput').value = '';
        
        // Reset UI
        updateDisplay();
        viewHistory();
        
        // Reset cup selection
        document.querySelectorAll('.cup-option').forEach(option => {
            const optionSize = parseInt(option.querySelector('small').textContent.replace('ml', ''));
            option.classList.toggle('active', optionSize === 350);
        });
        
        showMessage("All data cleared successfully", 'warning');
        updateStorageUsed();
    }
}

function enableReminders() {
    if (!("Notification" in window)) {
        alert("This browser doesn't support notifications");
        return;
    }
    
    if (Notification.permission === "granted") {
        showMessage("Reminders already enabled!", 'success');
        startReminders();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showMessage("✅ Reminders enabled! You'll get notified every 2 hours.", 'success');
                startReminders();
            }
        });
    } else {
        alert("Notifications blocked. Please enable them in browser settings.");
    }
}

function startReminders() {
    // Show immediate notification
    new Notification("💧 HydraTrack Reminder", {
        body: `Time to drink water! You've had ${currentWater}ml today. Goal: ${dailyGoal}ml`,
        icon: "https://cdn-icons-png.flaticon.com/128/869/869869.png"
    });
    
    // Set 2-hour reminders
    setInterval(() => {
        if (Notification.permission === "granted") {
            new Notification("💧 HydraTrack Reminder", {
                body: `Stay hydrated! You've had ${currentWater}ml today.`,
                icon: "https://cdn-icons-png.flaticon.com/128/869/869869.png"
            });
        }
    }, 7200000); // 2 hours in milliseconds
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateStorageUsed() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length * 2; // Approximate bytes
        }
    }
    
    const kb = (total / 1024).toFixed(2);
    document.getElementById('storageUsed').textContent = `${kb} KB`;
}

function showSaveConfirmation() {
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Saving...';
    
    setTimeout(() => {
        saveStatus.innerHTML = '<i class="fas fa-check-circle"></i> All changes saved';
    }, 500);
    
    setTimeout(() => {
        saveStatus.innerHTML = '<i class="fas fa-check-circle"></i> Auto-saving enabled';
    }, 3000);
}

function showMessage(text, type = 'info') {
    // Create message element
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${text}</span>
    `;
    
    // Add styles
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation style if not exists
    if (!document.getElementById('messageStyles')) {
        const style = document.createElement('style');
        style.id = 'messageStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

function showWelcomeMessage() {
    const lastDate = localStorage.getItem('hydratrack_lastDate');
    if (lastDate !== currentDate) {
        showMessage("🎉 Welcome to a new day! Stay hydrated!", 'success');
    } else if (localStorage.getItem('hydratrack_weight')) {
        showMessage("👋 Welcome back! Your data was loaded.", 'success');
    }
}

function celebrateGoal() {
    // Create confetti
    const colors = ['#4fc3f7', '#0288d1', '#00acc1', '#26c6da'];
    const container = document.getElementById('confettiContainer');
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: fixed;
            width: ${10 + Math.random() * 10}px;
            height: ${10 + Math.random() * 10}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -50px;
            left: ${Math.random() * 100}vw;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 9998;
            pointer-events: none;
        `;
        
        container.appendChild(confetti);
        
        // Animate
        const duration = 2000 + Math.random() * 2000;
        confetti.animate([
            { 
                transform: `translate(0, 0) rotate(0deg)`, 
                opacity: 1 
            },
            { 
                transform: `translate(${Math.random() * 200 - 100}px, 100vh) rotate(${360 + Math.random() * 360}deg)`, 
                opacity: 0 
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
        }).onfinish = () => confetti.remove();
    }
    
    // Show celebration message
    showMessage(`🎉 CONGRATULATIONS! You reached your daily goal of ${dailyGoal}ml!`, 'success');
    
    // Play sound if available (optional)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.volume = 0.3;
        audio.play();
    } catch (e) {
        // Sound not supported, continue silently
    }
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================

// Wait for page to load
window.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 HydraTrack starting...");
    
    // Load saved data
    loadSavedData();
    
    // Set today's date
    document.getElementById('todayDate').textContent = formatDate(new Date());
    
    // Auto-save on page unload
    window.addEventListener('beforeunload', saveData);
    
    // Show loading is complete
    setTimeout(() => {
        console.log("✅ HydraTrack ready!");
    }, 100);
});