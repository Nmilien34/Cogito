/**
 * Ruth's Profile Data
 * Pre-configured schedules and preferences for Ruth
 */

const RuthProfile = {
    name: 'Ruth',
    birthDate: 'March 14',
    age: 85,
    location: 'Chestnut Nursing Home, New Jersey',
    favoriteGenres: ['Gospel', 'R&B Soul', 'Classical'],
    
    /**
     * Initialize Ruth's default schedules
     */
    initializeSchedules() {
        // Check if schedules already exist
        const existingSchedules = Storage.getSchedules();
        if (existingSchedules.length > 0) {
            console.log('Schedules already exist, skipping initialization');
            return;
        }

        const schedules = [
            // Medications
            {
                name: 'Donepezil',
                time: '09:00',
                days: [0, 1, 2, 3, 4, 5, 6], // Every day
                type: 'medication'
            },
            {
                name: 'Acetaminophen (Pain Medication)',
                time: '10:30',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'medication'
            },
            {
                name: 'Lisinopril (Blood Pressure)',
                time: '11:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'medication'
            },
            {
                name: 'Amlodipine Besylate (Blood Pressure)',
                time: '14:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'medication'
            },
            {
                name: 'Omeprazole',
                time: '18:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'medication'
            },
            // Daily Activities
            {
                name: 'Wake Up',
                time: '08:30',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'activity',
                message: 'Good morning, Ruth! Time to wake up and start your day.'
            },
            {
                name: 'Breakfast',
                time: '10:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'activity',
                message: 'Good morning, Ruth! It\'s time for breakfast.'
            },
            {
                name: 'Lunch',
                time: '12:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'activity',
                message: 'Ruth, it\'s lunch time!'
            },
            {
                name: 'Dinner',
                time: '17:30',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'activity',
                message: 'Ruth, it\'s dinner time!'
            },
            {
                name: 'Bedtime',
                time: '21:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                type: 'activity',
                message: 'Good night, Ruth! Time to get ready for bed.'
            }
        ];

        // Save all schedules with unique IDs
        schedules.forEach((schedule, index) => {
            const scheduleWithId = {
                ...schedule,
                id: `ruth_${Date.now()}_${index}`
            };
            MedicationManager.addSchedule(scheduleWithId);
        });

        console.log('Ruth\'s schedules initialized:', schedules.length, 'schedules');
    },

    /**
     * Get personalized greeting based on time of day
     */
    getGreeting() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 5 && hour < 12) {
            return 'Good morning';
        } else if (hour >= 12 && hour < 17) {
            return 'Good afternoon';
        } else if (hour >= 17 && hour < 21) {
            return 'Good evening';
        } else {
            return 'Good night';
        }
    },

    /**
     * Get welcome message with time
     */
    getWelcomeMessage() {
        const greeting = this.getGreeting();
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        return `${greeting}, ${this.name}! It's ${timeString}. I'm here to help you remember your medications, meals, and daily activities.`;
    }
};

