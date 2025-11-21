/**
 * Main Application Controller
 * Handles UI navigation and user interactions
 */

const app = {
    currentScreen: 'welcome',
    userName: 'Ruth',

    /**
     * Initialize the application
     */
    init() {
        this.userName = Storage.getUserName();
        
        // Make sure settings are hidden on startup
        const settingsScreen = document.getElementById('settingsScreen');
        if (settingsScreen) {
            settingsScreen.classList.add('hidden');
        }
        
        // Initialize Ruth's profile if not already done
        if (!Storage.isProfileInitialized()) {
            RuthProfile.initializeSchedules();
            Storage.setProfileInitialized();
        }
        
        // Reload schedules after initialization
        MedicationManager.init();
        
        // Initialize radio
        RadioController.init();
        
        // Show main screen directly (no welcome screen)
        this.showScreen('mainScreen');
        
        // Update welcome message and time
        this.updateWelcomeMessage();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Don't show reminder by default - only when user clicks button
        // Still update it in background for when user clicks
        this.updateNextReminder();
        setInterval(() => this.updateNextReminder(), 60000); // Update every minute
        
        // Developer mode: double-click title to show settings
        this.setupDeveloperMode();
        
        // Update radio display
        RadioController.updateDisplay();
    },

    /**
     * Update welcome message on main screen
     */
    updateWelcomeMessage() {
        const welcomeTitle = document.getElementById('welcomeTitle');
        const mainMessage = document.getElementById('mainMessage');
        
        if (welcomeTitle) {
            const greeting = RuthProfile.getGreeting();
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
            });
            welcomeTitle.textContent = `${greeting}, ${this.userName}! 👋`;
            welcomeTitle.innerHTML = `${greeting}, ${this.userName}! 👋<br><span style="font-size: 0.6em; font-weight: normal;">${dateString}</span>`;
        }
        
        if (mainMessage) {
            mainMessage.innerHTML = `
                I'm Cogito, your friendly assistant.<br>
                I'm here to help you remember your medications, meals, and daily activities.
            `;
        }
    },

    /**
     * Update time display
     */
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.textContent = `${dateString} - ${timeString}`;
        }
    },

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        const screens = ['welcomeScreen', 'mainScreen', 'reminderScreen', 'confirmationScreen', 'settingsScreen'];
        screens.forEach(screen => {
            const element = document.getElementById(screen);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
        }
        
        // Update welcome message when showing main screen
        if (screenName === 'mainScreen') {
            this.updateWelcomeMessage();
            if (typeof RadioController !== 'undefined') {
                RadioController.updateDisplay();
            }
        }
    },

    /**
     * Setup developer mode (double-click title to show settings)
     */
    setupDeveloperMode() {
        const welcomeTitle = document.getElementById('welcomeTitle');
        const developerAccess = document.getElementById('developerAccess');
        
        if (welcomeTitle && developerAccess) {
            let clickCount = 0;
            let clickTimer;
            
            welcomeTitle.addEventListener('click', () => {
                clickCount++;
                clearTimeout(clickTimer);
                
                clickTimer = setTimeout(() => {
                    if (clickCount >= 2) {
                        // Double-click detected - toggle developer access
                        developerAccess.style.display = developerAccess.style.display === 'none' ? 'block' : 'none';
                    }
                    clickCount = 0;
                }, 300);
            });
            
            welcomeTitle.style.cursor = 'pointer';
            welcomeTitle.title = 'Double-click for developer settings';
        }
    },

    /**
     * Show medication reminder
     */
    showReminder(schedule) {
        const medicationInfo = document.getElementById('medicationInfo');
        const reminderTitle = document.getElementById('reminderTitle');
        const reminderMessage = document.getElementById('reminderMessage');
        const confirmButton = document.getElementById('confirmButton');
        
        if (schedule) {
            const isMedication = schedule.type === 'medication';
            
            // Update title
            if (reminderTitle) {
                reminderTitle.textContent = isMedication 
                    ? '⏰ MEDICINE TIME, RUTH! ⏰'
                    : '⏰ REMINDER, RUTH! ⏰';
            }
            
            // Update message
            if (reminderMessage) {
                if (schedule.message) {
                    reminderMessage.textContent = schedule.message;
                } else if (isMedication) {
                    reminderMessage.textContent = 'It\'s time to take your medicine.';
                } else {
                    reminderMessage.textContent = `It's time for ${schedule.name.toLowerCase()}.`;
                }
            }
            
            // Update info
            if (medicationInfo) {
                medicationInfo.innerHTML = `
                    <strong>${schedule.name}</strong><br>
                    <small>Scheduled for ${this.formatTime(schedule.time)}</small>
                `;
            }
            
            // Update button text
            if (confirmButton) {
                if (isMedication) {
                    confirmButton.textContent = '✓ I Took My Medicine';
                } else if (schedule.name === 'Breakfast' || schedule.name === 'Lunch' || schedule.name === 'Dinner') {
                    confirmButton.textContent = '✓ I Ate My Meal';
                } else {
                    confirmButton.textContent = '✓ Done';
                }
            }
        }
        this.showScreen('reminderScreen');
    },

    /**
     * Show test notification (for demo purposes)
     */
    showTestNotification() {
        // Create a test schedule
        const testSchedule = {
            id: 'test',
            name: 'Test Medication',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        };
        this.showReminder(testSchedule);
        
        // Speak the reminder
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(
                `${this.userName}, it's time to take your medicine`
            );
            utterance.rate = 0.8;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    },

    /**
     * Confirm medication was taken or activity completed
     */
    confirmMedication() {
        let schedule = null;
        if (window.currentReminder) {
            schedule = window.currentReminder;
            
            // For medications, log to history
            if (schedule.type === 'medication') {
                MedicationManager.confirmMedication(schedule.id);
            } else {
                // For activities, also log to history
                const timestamp = new Date().toISOString();
                Storage.addToHistory(schedule.id, schedule.name, timestamp);
            }
            
            window.currentReminder = null;
        }
        
        this.showScreen('confirmationScreen');
        
        // Update confirmation message based on what was confirmed
        const confirmationMessage = document.querySelector('#confirmationScreen .message');
        if (confirmationMessage && schedule) {
            if (schedule.type === 'medication') {
                confirmationMessage.innerHTML = 'You took your medicine.<br>Well done!';
            } else if (schedule.name === 'Breakfast' || schedule.name === 'Lunch' || schedule.name === 'Dinner') {
                confirmationMessage.innerHTML = `You ate your ${schedule.name.toLowerCase()}.<br>Great job!`;
            } else {
                confirmationMessage.innerHTML = `You completed ${schedule.name.toLowerCase()}.<br>Well done!`;
            }
        }
        
        // Auto return to main screen after 3 seconds
        setTimeout(() => {
            this.backToMain();
        }, 3000);
    },

    /**
     * Snooze reminder
     */
    snoozeReminder() {
        if (window.currentReminder) {
            MedicationManager.snoozeReminder(window.currentReminder.id);
        }
        
        this.showScreen('mainScreen');
        const statusEl = document.getElementById('status');
        if (statusEl) {
            const settings = Storage.getSettings();
            const minutes = settings.snoozeDuration || 5;
            statusEl.textContent = `Okay ${this.userName}, I'll remind you again in ${minutes} minutes.`;
            
            setTimeout(() => {
                if (statusEl) {
                    statusEl.textContent = 'All set! Relax and enjoy your day.';
                }
            }, 3000);
        }
    },

    /**
     * Back to main screen
     */
    backToMain() {
        this.showScreen('mainScreen');
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = 'All set! Relax and enjoy your day.';
        }
        this.updateNextReminder();
        
        // Update radio display
        if (typeof RadioController !== 'undefined') {
            RadioController.updateDisplay();
        }
    },

    /**
     * Show settings screen
     */
    showSettings() {
        this.showScreen('settingsScreen');
        this.renderSchedules();
    },

    /**
     * Render medication schedules in settings
     */
    renderSchedules() {
        const scheduleList = document.getElementById('scheduleList');
        if (!scheduleList) return;

        const schedules = MedicationManager.schedules;
        
        if (schedules.length === 0) {
            scheduleList.innerHTML = '<p style="font-size: 20px; color: #888;">No medication schedules yet. Add one to get started!</p>';
            return;
        }

        scheduleList.innerHTML = schedules.map(schedule => {
            const days = this.formatDays(schedule.days);
            const time = this.formatTime(schedule.time);
            
            return `
                <div class="schedule-item">
                    <div class="schedule-item-info">
                        <div class="schedule-item-name">${schedule.name}</div>
                        <div class="schedule-item-time">${time}</div>
                        <div class="schedule-item-days">${days}</div>
                    </div>
                    <div class="schedule-item-actions">
                        <button class="btn-delete" onclick="app.deleteSchedule('${schedule.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Format days array into readable string
     */
    formatDays(days) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
        if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
        return days.map(d => dayNames[d]).join(', ');
    },

    /**
     * Format time string
     */
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },

    /**
     * Medication schedule management removed - Ruth's schedule is pre-configured
     */

    /**
     * Delete medication schedule
     */
    deleteSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this medication reminder?')) {
            MedicationManager.removeSchedule(scheduleId);
            this.renderSchedules();
        }
    },

    /**
     * Update next reminder display
     */
    updateNextReminder() {
        const nextReminder = MedicationManager.getNextReminder();
        const nextReminderTimeEl = document.getElementById('nextReminderTime');
        
        if (nextReminderTimeEl) {
            if (nextReminder && nextReminder.schedule) {
                const timeUntil = MedicationManager.formatTimeUntilReminder(nextReminder.minutesFromNow);
                const time = this.formatTime(nextReminder.schedule.time);
                const schedule = nextReminder.schedule;
                
                // Show more details about the reminder
                let reminderText = `${schedule.name} at ${time}`;
                if (schedule.type === 'medication') {
                    reminderText += ` (Medicine)`;
                } else {
                    reminderText += ` (${schedule.type})`;
                }
                reminderText += ` - in ${timeUntil}`;
                
                nextReminderTimeEl.innerHTML = reminderText;
            } else {
                nextReminderTimeEl.textContent = 'No upcoming reminders';
            }
        }
    },

    /**
     * Handle AI state change
     */
    onAIStateChange(enabled) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = enabled 
                ? 'AI Assistant is now active. I\'ll help remind you throughout the day.'
                : 'AI Assistant is disabled. Only medication reminders will be shown.';
            
            setTimeout(() => {
                if (statusEl) {
                    statusEl.textContent = 'All set! Relax and enjoy your day.';
                }
            }, 3000);
        }
    },


    /**
     * Show next reminder from Ruth's schedule
     */
    showNextReminder() {
        const nextReminder = MedicationManager.getNextReminder();
        
        if (nextReminder && nextReminder.schedule) {
            // Show the reminder screen with the next scheduled item
            this.showReminder(nextReminder.schedule);
        } else {
            // No upcoming reminders
            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.textContent = 'No upcoming reminders scheduled. All set for now!';
                setTimeout(() => {
                    if (statusEl) {
                        statusEl.textContent = 'All set! Relax and enjoy your day.';
                    }
                }, 3000);
            }
        }
    },

    /**
     * Toggle reminder info visibility (for preview)
     */
    toggleReminderInfo() {
        const nextReminder = document.getElementById('nextReminder');
        const toggleButton = document.getElementById('reminderToggleButton');
        
        if (nextReminder && toggleButton) {
            const isHidden = nextReminder.classList.contains('hidden');
            
            if (isHidden) {
                // Show reminder preview
                nextReminder.classList.remove('hidden');
                toggleButton.textContent = '📅 Hide Next Reminder';
                this.updateNextReminder(); // Update the info
            } else {
                // Hide reminder preview
                nextReminder.classList.add('hidden');
                toggleButton.textContent = '📅 Show Next Reminder';
            }
        }
    }
};

// Keyboard shortcuts removed - no modals to close

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

