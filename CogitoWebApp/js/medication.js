/**
 * Medication Scheduling System
 * Handles medication reminders, scheduling, and notifications
 */

const MedicationManager = {
    schedules: [],
    activeReminders: [],
    checkInterval: null,
    snoozeTimers: new Map(),

    /**
     * Initialize medication manager
     */
    init() {
        this.loadSchedules();
        this.startChecking();
    },

    /**
     * Load schedules from storage
     */
    loadSchedules() {
        this.schedules = Storage.getSchedules();
        console.log('Loaded schedules:', this.schedules);
    },

    /**
     * Add a new medication schedule
     */
    addSchedule(schedule) {
        const newSchedule = {
            id: schedule.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: schedule.name,
            time: schedule.time,
            days: schedule.days || [0, 1, 2, 3, 4, 5, 6], // Default to all days
            enabled: true,
            type: schedule.type || 'medication', // 'medication' or 'activity'
            message: schedule.message || null,
            createdAt: schedule.createdAt || new Date().toISOString()
        };

        this.schedules.push(newSchedule);
        Storage.saveSchedules(this.schedules);
        return newSchedule;
    },

    /**
     * Remove a medication schedule
     */
    removeSchedule(scheduleId) {
        this.schedules = this.schedules.filter(s => s.id !== scheduleId);
        Storage.saveSchedules(this.schedules);
    },

    /**
     * Get schedules for a specific day (0 = Sunday, 6 = Saturday)
     */
    getSchedulesForDay(dayOfWeek) {
        return this.schedules.filter(schedule => 
            schedule.enabled && schedule.days.includes(dayOfWeek)
        );
    },

    /**
     * Check if it's time for any medication
     */
    checkForReminders() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Time in minutes
        const currentDay = now.getDay();

        const todaySchedules = this.getSchedulesForDay(currentDay);

        for (const schedule of todaySchedules) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const scheduleTime = hours * 60 + minutes;

            // Check if it's time (within 1 minute window)
            if (Math.abs(currentTime - scheduleTime) <= 1) {
                // Check if we've already shown this reminder today
                const reminderKey = `${schedule.id}-${now.toDateString()}`;
                if (!this.activeReminders.includes(reminderKey)) {
                    this.triggerReminder(schedule);
                    this.activeReminders.push(reminderKey);
                }
            }
        }
    },

    /**
     * Trigger a medication reminder
     */
    triggerReminder(schedule) {
        console.log('Triggering reminder for:', schedule.name);
        
        // Store current reminder for confirmation
        window.currentReminder = schedule;

        // Check if AI is enabled
        const radioState = Storage.getRadioState();
        const aiEnabled = radioState && radioState.aiEnabled !== false;
        
        if (!aiEnabled && schedule.type === 'activity') {
            // If AI is off, only show medication reminders, not activities
            return;
        }

        // Show reminder screen
        if (typeof app !== 'undefined' && app.showReminder) {
            app.showReminder(schedule);
        }

        // Speak the reminder
        this.speakReminder(schedule);
    },

    /**
     * Speak medication reminder using Web Speech API
     */
    speakReminder(schedule) {
        const settings = Storage.getSettings();
        if (settings.voiceEnabled && window.speechSynthesis) {
            const userName = Storage.getUserName();
            let message;
            
            if (schedule.message) {
                message = schedule.message;
            } else if (schedule.type === 'activity') {
                message = schedule.name === 'Wake Up' 
                    ? `Good morning, ${userName}! Time to wake up and start your day.`
                    : `${userName}, it's time for ${schedule.name.toLowerCase()}.`;
            } else {
                message = `${userName}, it's time to take your ${schedule.name}.`;
            }
            
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
        }
    },

    /**
     * Confirm medication was taken
     */
    confirmMedication(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (schedule) {
            const timestamp = new Date().toISOString();
            Storage.addToHistory(scheduleId, schedule.name, timestamp);
            
            // Remove from active reminders
            const today = new Date().toDateString();
            this.activeReminders = this.activeReminders.filter(
                r => !r.startsWith(`${scheduleId}-${today}`)
            );

            // Clear any snooze timer for this medication
            if (this.snoozeTimers.has(scheduleId)) {
                clearTimeout(this.snoozeTimers.get(scheduleId));
                this.snoozeTimers.delete(scheduleId);
            }
        }
    },

    /**
     * Snooze a reminder
     */
    snoozeReminder(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const settings = Storage.getSettings();
        const snoozeMinutes = settings.snoozeDuration || 5;
        const snoozeMs = snoozeMinutes * 60 * 1000;

        // Set a timer to show the reminder again
        const timerId = setTimeout(() => {
            this.triggerReminder(schedule);
            this.snoozeTimers.delete(scheduleId);
        }, snoozeMs);

        this.snoozeTimers.set(scheduleId, timerId);
    },

    /**
     * Get next upcoming reminder
     */
    getNextReminder() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay();

        let nextReminder = null;
        let minTimeDiff = Infinity;

        // Check today's remaining schedules
        const todaySchedules = this.getSchedulesForDay(currentDay);
        for (const schedule of todaySchedules) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const scheduleTime = hours * 60 + minutes;

            if (scheduleTime > currentTime) {
                const timeDiff = scheduleTime - currentTime;
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    nextReminder = {
                        schedule: schedule,
                        time: scheduleTime,
                        minutesFromNow: timeDiff
                    };
                }
            }
        }

        // Check next 7 days
        for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
            const checkDay = (currentDay + dayOffset) % 7;
            const daySchedules = this.getSchedulesForDay(checkDay);
            
            for (const schedule of daySchedules) {
                const [hours, minutes] = schedule.time.split(':').map(Number);
                const scheduleTime = hours * 60 + minutes;
                const totalMinutes = dayOffset * 24 * 60 + scheduleTime;

                if (totalMinutes < minTimeDiff) {
                    minTimeDiff = totalMinutes;
                    nextReminder = {
                        schedule: schedule,
                        time: scheduleTime,
                        minutesFromNow: totalMinutes
                    };
                }
            }
        }

        return nextReminder;
    },

    /**
     * Format time until next reminder
     */
    formatTimeUntilReminder(minutes) {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    },

    /**
     * Start checking for reminders
     */
    startChecking() {
        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkForReminders();
        }, 60000); // 60 seconds

        // Also check immediately
        this.checkForReminders();
    },

    /**
     * Stop checking for reminders
     */
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
};

