// Parental Controls - PIN and Time Management
class ParentalControls {
    constructor() {
        this.failedAttempts = 0;
        this.maxAttempts = 3;
        this.lockoutTime = 5 * 60 * 1000; // 5 minutes
        this.schedule = this.getDefaultSchedule();
        this.timeTracking = {
            startTime: null,
            totalUsed: 0,
            lastReset: new Date().toDateString()
        };
    }

    // PIN Management
    async checkPIN() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['parentalPIN', 'pinLockout'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error checking PIN:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                
                // Check if locked out
                if (result.pinLockout && result.pinLockout > Date.now()) {
                    const remainingTime = Math.ceil((result.pinLockout - Date.now()) / 1000 / 60);
                    this.showPINError(`Too many attempts. Try again in ${remainingTime} minutes.`);
                    resolve(false);
                    return;
                }
                
                // No PIN set
                if (!result.parentalPIN) {
                    resolve(true);
                    return;
                }
                
                // Show PIN prompt
                this.showPINPrompt(resolve);
            });
        });
    }

    showPINPrompt(callback) {
        const overlay = document.getElementById('pinLockOverlay');
        const input = document.getElementById('pinInput');
        const submitBtn = document.getElementById('pinSubmit');
        const error = document.getElementById('pinError');
        
        overlay.style.display = 'flex';
        input.value = '';
        input.focus();
        error.style.display = 'none';
        
        const validatePIN = () => {
            const enteredPIN = input.value;
            
            chrome.storage.sync.get(['parentalPIN'], (result) => {
                if (result.parentalPIN === enteredPIN) {
                    // Correct PIN
                    overlay.style.display = 'none';
                    this.failedAttempts = 0;
                    callback(true);
                } else {
                    // Wrong PIN
                    this.failedAttempts++;
                    
                    if (this.failedAttempts >= this.maxAttempts) {
                        // Lock out
                        const lockoutUntil = Date.now() + this.lockoutTime;
                        chrome.storage.sync.set({ pinLockout: lockoutUntil });
                        this.showPINError('Too many attempts. Locked for 5 minutes.');
                        setTimeout(() => {
                            overlay.style.display = 'none';
                            callback(false);
                        }, 2000);
                    } else {
                        this.showPINError(`Incorrect PIN. ${this.maxAttempts - this.failedAttempts} attempts remaining.`);
                        input.value = '';
                        input.focus();
                    }
                }
            });
        };
        
        submitBtn.onclick = validatePIN;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') validatePIN();
        };
    }

    showPINError(message) {
        const error = document.getElementById('pinError');
        error.textContent = message;
        error.style.display = 'block';
    }

    async setPIN(newPIN) {
        if (!newPIN || newPIN.length !== 4 || !/^\d+$/.test(newPIN)) {
            throw new Error('PIN must be exactly 4 digits');
        }
        
        return new Promise((resolve) => {
            chrome.storage.sync.set({ parentalPIN: newPIN }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting PIN:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async removePIN() {
        const authorized = await this.checkPIN();
        if (!authorized) return false;
        
        return new Promise((resolve) => {
            chrome.storage.sync.remove(['parentalPIN', 'pinLockout'], () => {
                if (chrome.runtime.lastError) {
                    console.error('Error removing PIN:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Time Management
    async setDailyAllowance(hours) {
        const authorized = await this.checkPIN();
        if (!authorized) return false;
        
        return new Promise((resolve) => {
            // When setting timer, record the start time and expiry
            const timerData = {
                dailyAllowance: hours,
                timerStarted: Date.now(),
                timerExpires: hours > 0 ? Date.now() + (hours * 60 * 60 * 1000) : 0
            };
            
            chrome.storage.sync.set(timerData, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting daily allowance:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async checkTimeAllowed() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['dailyAllowance', 'timerExpires', 'weeklySchedule'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error checking time:', chrome.runtime.lastError);
                    resolve(true); // Allow on error
                    return;
                }
                
                // Check daily allowance
                if (result.dailyAllowance === 0) {
                    // No videos allowed
                    resolve(false);
                    return;
                } else if (result.dailyAllowance > 0) {
                    // Check if timer has expired
                    if (result.timerExpires && Date.now() > result.timerExpires) {
                        // Timer has expired
                        resolve(false);
                        return;
                    }
                }
                
                // Check weekly schedule
                if (result.weeklySchedule) {
                    const now = new Date();
                    const day = now.getDay();
                    const hour = now.getHours();
                    
                    const schedule = result.weeklySchedule;
                    if (schedule[day] && schedule[day][hour] === false) {
                        resolve(false);
                        return;
                    }
                }
                
                resolve(true);
            });
        });
    }

    startTimeTracking() {
        this.timeTracking.startTime = Date.now();
        
        // Update every minute
        this.trackingInterval = setInterval(() => {
            this.updateTimeUsed();
        }, 60000);
    }

    stopTimeTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
        this.updateTimeUsed();
    }

    updateTimeUsed() {
        if (!this.timeTracking.startTime) return;
        
        const minutesUsed = Math.floor((Date.now() - this.timeTracking.startTime) / 1000 / 60);
        this.timeTracking.totalUsed += minutesUsed;
        this.timeTracking.startTime = Date.now();
        
        chrome.storage.sync.set({ timeTracking: this.timeTracking });
        
        // Update display
        this.updateTimeDisplay();
    }

    updateTimeDisplay() {
        chrome.storage.sync.get(['dailyAllowance', 'timerExpires'], (result) => {
            const display = document.getElementById('timeRemaining');
            const statusDisplay = document.getElementById('timerStatus');
            if (!display) return;
            
            // Handle different timer states
            if (result.dailyAllowance === 0) {
                // No videos allowed
                display.textContent = '';
                if (statusDisplay) {
                    statusDisplay.textContent = '✕ Videos blocked';
                    statusDisplay.className = 'timer-status expired';
                }
                return;
            } else if (result.dailyAllowance > 0 && result.timerExpires) {
                // Calculate remaining time from countdown
                const now = Date.now();
                const remainingMs = Math.max(0, result.timerExpires - now);
                const remainingMinutes = Math.floor(remainingMs / 1000 / 60);
                
                if (remainingMinutes === 0) {
                    display.textContent = 'Timer expired';
                    display.className = 'time-remaining critical';
                    if (statusDisplay) {
                        statusDisplay.textContent = '✕ Timer expired';
                        statusDisplay.className = 'timer-status expired';
                    }
                    
                    // Reset timer to 0 when expired
                    chrome.storage.sync.set({ dailyAllowance: 0 });
                } else {
                    const hours = Math.floor(remainingMinutes / 60);
                    const minutes = remainingMinutes % 60;
                    
                    if (hours > 0) {
                        display.textContent = `${hours}h ${minutes}m remaining`;
                    } else {
                        display.textContent = `${minutes} minutes remaining`;
                    }
                    
                    // Add warning colors - green when active, orange/red when low
                    display.classList.remove('warning', 'critical', 'active');
                    if (remainingMinutes <= 5) {
                        display.classList.add('critical');
                    } else if (remainingMinutes <= 15) {
                        display.classList.add('warning');
                    } else {
                        display.classList.add('active');
                    }
                    
                    // Clear status text - just show the time in color
                    if (statusDisplay) {
                        statusDisplay.textContent = '';
                        statusDisplay.className = '';
                    }
                }
            }
        });
    }

    // Weekly Schedule
    getDefaultSchedule() {
        // Default: All hours blocked (false = blocked, true = allowed)
        const schedule = {};
        for (let day = 0; day < 7; day++) {
            schedule[day] = {};
            for (let hour = 0; hour < 24; hour++) {
                schedule[day][hour] = false; // All blocked by default
            }
        }
        return schedule;
    }
    
    formatHour(hour) {
        // Format hours for display (1am-12pm-11pm-12am)
        if (hour === 0) return '12am';
        if (hour < 12) return `${hour}am`;
        if (hour === 12) return '12pm';
        return `${hour - 12}pm`;
    }

    async setWeeklySchedule(schedule) {
        const authorized = await this.checkPIN();
        if (!authorized) return false;
        
        return new Promise((resolve) => {
            chrome.storage.sync.set({ weeklySchedule: schedule }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting schedule:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    showScheduleModal() {
        const modal = document.getElementById('scheduleModal');
        const grid = document.getElementById('scheduleGrid');
        
        // Load current schedule
        chrome.storage.sync.get(['weeklySchedule'], (result) => {
            const schedule = result.weeklySchedule || this.getDefaultSchedule();
            
            // Build grid HTML - start with 1am (hour 1) and go through 12am (hour 0)
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const hourOrder = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0]; // 1am-12am
            
            let html = '<div></div>'; // Empty corner cell
            
            // Hour headers (1am-12am)
            hourOrder.forEach(h => {
                html += `<div class="schedule-header">${this.formatHour(h)}</div>`;
            });
            
            // Day rows
            days.forEach((day, dayIndex) => {
                html += `<div class="schedule-day-label">${day}</div>`;
                hourOrder.forEach(hour => {
                    const isAllowed = schedule[dayIndex][hour];
                    html += `<div class="schedule-hour ${isAllowed ? 'allowed' : 'blocked'}" 
                             data-day="${dayIndex}" data-hour="${hour}" 
                             title="${day} ${this.formatHour(hour)}: ${isAllowed ? 'Videos Allowed' : 'Videos Blocked'}"></div>`;
                });
            });
            
            grid.innerHTML = html;
            
            // Add click handlers
            grid.querySelectorAll('.schedule-hour').forEach(cell => {
                cell.onclick = () => {
                    const isCurrentlyAllowed = cell.classList.contains('allowed');
                    cell.classList.toggle('allowed');
                    cell.classList.toggle('blocked');
                    
                    // Update tooltip
                    const day = days[cell.dataset.day];
                    const hour = parseInt(cell.dataset.hour);
                    const newStatus = isCurrentlyAllowed ? 'Videos Blocked' : 'Videos Allowed';
                    cell.title = `${day} ${this.formatHour(hour)}: ${newStatus}`;
                };
            });
            
            modal.style.display = 'flex';
        });
    }

    saveSchedule() {
        const grid = document.getElementById('scheduleGrid');
        const schedule = {};
        
        // Build schedule from grid
        for (let day = 0; day < 7; day++) {
            schedule[day] = {};
            for (let hour = 0; hour < 24; hour++) {
                const cell = grid.querySelector(`[data-day="${day}"][data-hour="${hour}"]`);
                if (cell) {
                    schedule[day][hour] = cell.classList.contains('allowed');
                } else {
                    // Default to blocked if cell not found
                    schedule[day][hour] = false;
                }
            }
        }
        
        this.setWeeklySchedule(schedule).then(success => {
            if (success) {
                document.getElementById('scheduleModal').style.display = 'none';
            }
        });
    }
}

// Export for use in options.js
window.ParentalControls = ParentalControls;