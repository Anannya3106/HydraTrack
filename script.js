let currentWater = 0;
let dailyGoal = 2000; // Default 2 liters

// Set goal based on weight
function setGoal() {
    const weight = document.getElementById('weightInput').value;
    if (weight) {
        dailyGoal = Math.round(weight * 33); // 33ml per kg
        document.getElementById('goalAmount').textContent = (dailyGoal / 1000).toFixed(1);
        updateDisplay();
        alert(`Daily goal set to ${dailyGoal}ml (≈${(dailyGoal/1000).toFixed(1)}L)`);
    } else {
        alert("Please enter your weight first!");
    }
}

// Add water when button clicked
function addWater() {
    currentWater += 250; // 250ml per click
    if (currentWater > dailyGoal) currentWater = dailyGoal;
    updateDisplay();
    
    // Celebration when goal reached
    if (currentWater >= dailyGoal) {
        alert("🎉 Congratulations! You reached your daily goal!");
    }
}

// Update the water glass and progress
function updateDisplay() {
    const percent = Math.min(100, (currentWater / dailyGoal) * 100);
    
    // Update water glass
    document.getElementById('waterLevel').style.height = `${percent}%`;
    
    // Update progress bar
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressPercent').textContent = Math.round(percent);
    
    // Update tips based on progress
    const tipText = document.getElementById('tipText');
    if (percent < 30) {
        tipText.textContent = "💡 Start your day with 2 glasses of water!";
    } else if (percent < 70) {
        tipText.textContent = "💡 Keep going! Drink before meals for better digestion.";
    } else if (percent < 100) {
        tipText.textContent = "💡 Almost there! Drinking water improves focus.";
    } else {
        tipText.textContent = "🎉 Goal achieved! You're hydrated and healthy!";
    }
}

// Reset for new day
function resetDay() {
    currentWater = 0;
    updateDisplay();
    alert("Day reset! Start fresh.");
}

// Enable reminders (browser notification)
function enableReminders() {
    if ("Notification" in window && Notification.permission === "granted") {
        alert("Reminders already enabled!");
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("✅ Reminders enabled! You'll get notifications every 2 hours.");
                // Simple reminder every 2 hours (for demo)
                setInterval(() => {
                    new Notification("💧 HydraTrack Reminder", {
                        body: "Time to drink water! Stay hydrated!",
                        icon: "https://cdn-icons-png.flaticon.com/128/869/869869.png"
                    });
                }, 7200000); // 2 hours in milliseconds
            }
        });
    }
}

// Initialize with default values
document.getElementById('goalAmount').textContent = "2.0";
updateDisplay();