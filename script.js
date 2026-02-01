// ============================================
// HYDRATRACK - MAIN SCRIPT
// ============================================

// Global variables
let currentWater = 0;
let dailyGoal = 2000;
let cupSize = 350;
let today = new Date().toDateString();
let drinkHistory = [];

// Tips database
const tips = [
    "💧 Drink water within 30 minutes of waking up!",
    "💧 Keep a water bottle on your desk",
    "💧 Drink before meals to aid digestion",
    "💧 Feeling hungry? Drink water first!",
    "💧 Add lemon or cucumber for flavor",
    "💧 Drink before and after exercise",
    "💧 Set hourly reminders on your phone",
    "💧 Drink more when it's hot outside",
    "💧 Your urine should be light yellow",
    "💧 Choose water over sugary drinks",
    "💧 Eat water-rich foods like watermelon",
    "💧 Drink before you feel thirsty"
];

// ============================================
// INITIALIZATION
// ============================================

// When page loads
window.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 HydraTrack starting...");
    
    // Load saved data
    loadAllData();
    
    // Set today's date
    document.getElementById('todayDate').textContent = formatDate(new Date());
    
    // Show welcome message
    setTimeout(() => {
        showMessage("HydraTrack loaded! Your data is saved locally.", "success");
    }, 1000);
    
    // Auto-save every 30 seconds
    setInterval(saveAllData, 30000);
    
    console.log("✅ HydraTrack ready!");
});

// ============================================
// CORE FUNCTIONS
// ============================================

// Set daily goal based on weight
function setGoal() {
    const weightInput = document.getElementById('weightInput');
    const weight = parseFloat(weightInput.value);
    
    if (!weight || weight < 30 || weight > 200) {
        showMessage("Please enter a valid weight (30-200 kg)", "error");
        weightInput.focus();
        return;
    }
    
    // Calculate goal: 33ml per kg
    dailyGoal = Math.round(weight * 33);
    
    // Update display
    document.getElementById('goalAmount').textContent = dailyGoal;
    document.getElementById('goalLitres').textContent = (dailyGoal / 1000).toFixed(1);
    document.getElementById('dailyGoalDisplay').textContent = dailyGoal;
    
    // Save and show message
    saveAllData();
    showMessage(`Daily goal set: ${dailyGoal}ml (${(dailyGoal/1000).toFixed(1)}L)`, "success");
    
    updateDisplay();
}

// Select cup size
function selectCup(size) {
    cupSize = size;
    
    // Update active button
    document.querySelectorAll('.cup-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent.replace('ml', '').replace('L', '000')) === size) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('currentCup').textContent = size;
    showMessage(`Cup size set to ${size}ml`, "info");
    saveAllData();
}

// Add water
function addWater() {
    currentWater += cupSize;
    
    // Add to history
    const now = new Date();
    drinkHistory.push({
        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        amount: cupSize,
        total: currentWater
    });
    
    // Keep only last 20 entries
    if (drinkHistory.length > 20) {
        drinkHistory = drinkHistory.slice(-20);
    }
    
    updateDisplay();
    saveAllData();
    showMessage(`+${cupSize}ml added! Total: ${currentWater}ml`, "success");
    
    // Check if goal reached
    if (currentWater >= dailyGoal && dailyGoal > 0) {
        celebrateGoal();
    }
}

// Undo last drink
function undoDrink() {
    if (drinkHistory.length > 0) {
        const lastDrink = drinkHistory.pop();
        currentWater -= lastDrink.amount;
        
        updateDisplay();
        saveAllData();
        showMessage(`Undid ${lastDrink.amount}ml drink`, "info");
    } else {
        showMessage("No drinks to undo", "warning");
    }
}

// Update all displays
function updateDisplay() {
    // Calculate percentage
    const percent = dailyGoal > 0 ? Math.min(100, (currentWater / dailyGoal) * 100) : 0;
    
    // Update water glass
    document.getElementById('waterFill').style.height = `${percent}%`;
    document.getElementById('waterPercent').textContent = `${Math.round(percent)}%`;
    
    // Update stats
    document.getElementById('currentWater').textContent = currentWater;
    document.getElementById('currentStat').textContent = currentWater;
    document.getElementById('remainingStat').textContent = Math.max(0, dailyGoal - currentWater);
    document.getElementById('cupsStat').textContent = Math.round(currentWater / cupSize);
    
    // Update progress
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${Math.round(percent)}%`;
    
    // Update tip based on progress
    updateTip(percent);
}

// Update tip based on progress
function updateTip(percent) {
    let tipIndex = 0;
    if (percent < 25) {
        tipIndex = 0; // Morning
    } else if (percent < 50) {
        tipIndex = 1; // Mid-morning
    } else if (percent < 75) {
        tipIndex = 2; // Afternoon
    } else if (percent < 100) {
        tipIndex = 3; // Evening
    } else {
        tipIndex = 4; // Goal achieved
    }
    
    document.getElementById('currentTip').textContent = tips[tipIndex % tips.length];
}

// Get new random tip
function newTip() {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('currentTip').textContent = randomTip;
    showMessage("New tip loaded!", "info");
}

// ============================================
// DATA STORAGE FUNCTIONS
// ============================================

// Save all data
function saveAllData() {
    try {
        localStorage.setItem('hydra_weight', document.getElementById('weightInput').value);
        localStorage.setItem('hydra_water', currentWater.toString());
        localStorage.setItem('hydra_goal', dailyGoal.toString());
        localStorage.setItem('hydra_cup', cupSize.toString());
        localStorage.setItem('hydra_date', today);
        localStorage.setItem('hydra_history', JSON.stringify(drinkHistory));
        
        // Update save time
        const now = new Date();
        const saveTime = `${formatTime(now)}`;
        localStorage.setItem('hydra_lastSave', saveTime);
        document.getElementById('lastSaveTime').textContent = saveTime;
        
        // Show save indicator
        document.getElementById('saveStatus').innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Saving...`;
        setTimeout(() => {
            document.getElementById('saveStatus').innerHTML = `<i class="fas fa-check-circle"></i> Saved`;
        }, 500);
        
        return true;
    } catch (error) {
        console.error("Save error:", error);
        showMessage("Error saving data", "error");
        return false;
    }
}

// Save now button
function saveNow() {
    if (saveAllData()) {
        showMessage("Data saved successfully!", "success");
    }
}

// Load all data
function loadAllData() {
    console.log("📂 Loading saved data...");
    
    try {
        // Load basic data
        const savedWeight = localStorage.getItem('hydra_weight');
        const savedWater = localStorage.getItem('hydra_water');
        const savedGoal = localStorage.getItem('hydra_goal');
        const savedCup = localStorage.getItem('hydra_cup');
        const savedDate = localStorage.getItem('hydra_date');
        const savedHistory = localStorage.getItem('hydra_history');
        const savedTime = localStorage.getItem('hydra_lastSave');
        
        // Set values
        if (savedWeight) {
            document.getElementById('weightInput').value = savedWeight;
            calculateGoal(savedWeight);
        }
        
        if (savedWater) currentWater = parseInt(savedWater);
        if (savedGoal) dailyGoal = parseInt(savedGoal);
        if (savedCup) {
            cupSize = parseInt(savedCup);
            selectCup(cupSize);
        }
        
        if (savedHistory) {
            try {
                drinkHistory = JSON.parse(savedHistory);
            } catch (e) {
                drinkHistory = [];
            }
        }
        
        // Check if it's a new day
        if (savedDate !== today) {
            currentWater = 0;
            drinkHistory = [];
            showMessage("🎉 New day started! Stay hydrated!", "success");
        }
        
        // Update last save time
        if (savedTime) {
            document.getElementById('lastSaveTime').textContent = savedTime;
        }
        
        // Update display
        document.getElementById('goalAmount').textContent = dailyGoal;
        document.getElementById('goalLitres').textContent = (dailyGoal / 1000).toFixed(1);
        document.getElementById('dailyGoalDisplay').textContent = dailyGoal;
        
        updateDisplay();
        
        console.log("✅ Data loaded successfully");
        return true;
        
    } catch (error) {
        console.error("Load error:", error);
        showMessage("Error loading saved data", "error");
        return false;
    }
}

// View drinking history
function viewHistory() {
    const container = document.getElementById('historyContainer');
    
    if (drinkHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>No drinking history yet.</p>
                <p><small>Start by clicking "Drink" button!</small></p>
            </div>
        `;
        return;
    }
    
    let html = `
        <h3><i class="fas fa-history"></i> Today's Drinks</h3>
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
    
    // Show drinks in reverse order (newest first)
    const reversedHistory = [...drinkHistory].reverse();
    
    reversedHistory.forEach(entry => {
        const percent = dailyGoal > 0 ? Math.min(100, (entry.total / dailyGoal) * 100) : 0;
        
        html += `
            <tr>
                <td>${entry.time}</td>
                <td>+${entry.amount}ml</td>
                <td>${entry.total}ml</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="flex:1; background:#e0e0e0; height:8px; border-radius:4px;">
                            <div style="background:#4fc3f7; height:100%; border-radius:4px; width:${percent}%"></div>
                        </div>
                        <span>${Math.round(percent)}%</span>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="text-align:center; margin-top:15px; color:#666;">
            <small>Showing ${reversedHistory.length} drinks today</small>
        </p>
    `;
    
    container.innerHTML = html;
}

// Reset today's data
function resetToday() {
    if (confirm("Reset today's water intake? Your weight goal will be kept.")) {
        currentWater = 0;
        drinkHistory = [];
        updateDisplay();
        saveAllData();
        viewHistory();
        showMessage("Today's progress reset!", "success");
    }
}

// Clear all data
function clearAllData() {
    if (confirm("⚠️ WARNING: Delete ALL saved data?\n\n• Weight goal\n• Drinking history\n• All preferences\n\nThis cannot be undone.")) {
        localStorage.clear();
        currentWater = 0;
        dailyGoal = 2000;
        cupSize = 350;
        drinkHistory = [];
        
        // Reset form
        document.getElementById('weightInput').value = '';
        
        // Reset UI
        updateDisplay();
        viewHistory();
        selectCup(350);
        
        showMessage("All data cleared", "warning");
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show message to user
function showMessage(text, type = "info") {
    // Create message element
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    
    // Icons for different types
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    message.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        <span>${text}</span>
    `;
    
    // Add styles
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Add animation if not exists
    if (!document.getElementById('messageStyles')) {
        const style = document.createElement('style');
        style.id = 'messageStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    // Add to page
    document.body.appendChild(message);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 4000);
}

// Calculate goal (used in load)
function calculateGoal(weight) {
    dailyGoal = Math.round(weight * 33);
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Celebrate when goal reached
function celebrateGoal() {
    // Create confetti
    const colors = ['#4fc3f7', '#0288d1', '#00acc1', '#26c6da'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -20px;
            left: ${Math.random() * 100}vw;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 9999;
            pointer-events: none;
        `;
        
        document.body.appendChild(confetti);
        
        // Animate
        const duration = 1000 + Math.random() * 2000;
        confetti.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
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
    showMessage(`🎉 CONGRATULATIONS! You reached your daily goal of ${dailyGoal}ml!`, "success");
    
    // Play celebration sound (optional)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.volume = 0.2;
        audio.play().catch(() => { /* Ignore errors */ });
    } catch (e) {
        // Continue without sound
    }
}

// Enable browser reminders
function enableReminders() {
    if (!("Notification" in window)) {
        showMessage("This browser doesn't support notifications", "error");
        return;
    }
    
    if (Notification.permission === "granted") {
        showMessage("Reminders already enabled!", "success");
        startReminders();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showMessage("✅ Reminders enabled! You'll get notified every 2 hours.", "success");
                startReminders();
            }
        });
    } else {
        showMessage("Notifications blocked. Please enable in browser settings.", "error");
    }
}

// Start reminder interval
function startReminders() {
    // Show immediate notification
    if (Notification.permission === "granted") {
        new Notification("💧 HydraTrack Reminder", {
            body: `Time to drink water! You've had ${currentWater}ml today. Goal: ${dailyGoal}ml`,
            icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png"
        });
    }
    
    // Set 2-hour reminders
    setInterval(() => {
        if (Notification.permission === "granted") {
            new Notification("💧 HydraTrack Reminder", {
                body: `Stay hydrated! You've had ${currentWater}ml today.`,
                icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png"
            });
        }
    }, 7200000); // 2 hours
}

// ============================================
// TEST FUNCTION - REMOVE IN FINAL VERSION
// ============================================

// Quick test function
function testApp() {
    console.log("🧪 Testing HydraTrack...");
    console.log("Current water:", currentWater);
    console.log("Daily goal:", dailyGoal);
    console.log("Cup size:", cupSize);
    console.log("History length:", drinkHistory.length);
    
    // Test local storage
    localStorage.setItem('test', 'working');
    const testResult = localStorage.getItem('test');
    console.log("Local Storage test:", testResult === 'working' ? '✅ WORKING' : '❌ FAILED');
    
    showMessage("App test completed. Check console for results.", "info");
}
