/**
 * Local Storage Management
 * Handles persistence of medication schedules and history
 */

const Storage = {
    // Keys for localStorage
    KEYS: {
        MEDICATION_SCHEDULES: 'cogito_medication_schedules',
        MEDICATION_HISTORY: 'cogito_medication_history',
        USER_NAME: 'cogito_user_name',
        SETTINGS: 'cogito_settings',
        RADIO_STATE: 'cogito_radio_state',
        PROFILE_INITIALIZED: 'cogito_profile_initialized'
    },

    /**
     * Get medication schedules from storage
     */
    getSchedules() {
        try {
            const schedules = localStorage.getItem(this.KEYS.MEDICATION_SCHEDULES);
            return schedules ? JSON.parse(schedules) : [];
        } catch (error) {
            console.error('Error loading schedules:', error);
            return [];
        }
    },

    /**
     * Save medication schedules to storage
     */
    saveSchedules(schedules) {
        try {
            localStorage.setItem(this.KEYS.MEDICATION_SCHEDULES, JSON.stringify(schedules));
            return true;
        } catch (error) {
            console.error('Error saving schedules:', error);
            return false;
        }
    },

    /**
     * Get medication history from storage
     */
    getHistory() {
        try {
            const history = localStorage.getItem(this.KEYS.MEDICATION_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    },

    /**
     * Add medication confirmation to history
     */
    addToHistory(medicationId, medicationName, timestamp) {
        try {
            const history = this.getHistory();
            history.push({
                id: medicationId,
                name: medicationName,
                timestamp: timestamp,
                date: new Date(timestamp).toISOString()
            });
            // Keep only last 100 entries
            const recentHistory = history.slice(-100);
            localStorage.setItem(this.KEYS.MEDICATION_HISTORY, JSON.stringify(recentHistory));
            return true;
        } catch (error) {
            console.error('Error saving history:', error);
            return false;
        }
    },

    /**
     * Get user name from storage
     */
    getUserName() {
        try {
            return localStorage.getItem(this.KEYS.USER_NAME) || 'Ruth';
        } catch (error) {
            console.error('Error loading user name:', error);
            return 'Ruth';
        }
    },

    /**
     * Save user name to storage
     */
    saveUserName(name) {
        try {
            localStorage.setItem(this.KEYS.USER_NAME, name);
            return true;
        } catch (error) {
            console.error('Error saving user name:', error);
            return false;
        }
    },

    /**
     * Get settings from storage
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : {
                soundEnabled: true,
                voiceEnabled: true,
                snoozeDuration: 5 // minutes
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                soundEnabled: true,
                voiceEnabled: true,
                snoozeDuration: 5
            };
        }
    },

    /**
     * Save settings to storage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Get radio state from storage
     */
    getRadioState() {
        try {
            const state = localStorage.getItem(this.KEYS.RADIO_STATE);
            return state ? JSON.parse(state) : null;
        } catch (error) {
            console.error('Error loading radio state:', error);
            return null;
        }
    },

    /**
     * Save radio state to storage
     */
    saveRadioState(state) {
        try {
            localStorage.setItem(this.KEYS.RADIO_STATE, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Error saving radio state:', error);
            return false;
        }
    },

    /**
     * Check if profile has been initialized
     */
    isProfileInitialized() {
        try {
            return localStorage.getItem(this.KEYS.PROFILE_INITIALIZED) === 'true';
        } catch (error) {
            return false;
        }
    },

    /**
     * Mark profile as initialized
     */
    setProfileInitialized() {
        try {
            localStorage.setItem(this.KEYS.PROFILE_INITIALIZED, 'true');
            return true;
        } catch (error) {
            console.error('Error setting profile initialized:', error);
            return false;
        }
    },

    /**
     * Clear all data (for testing/reset)
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
};

