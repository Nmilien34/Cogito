/**
 * Kiosk Dashboard - Beautiful 7" Interface
 *
 * Inspired by iOS design language - clean, polished, accessible
 */

import { useState, useEffect } from "react";
import { useVapi } from "../context/VapiProvider";
import { useRemindersContext } from "../context/ReminderProvider";

// Daily routine for Ruth - includes meals, medications, and activities
const DAILY_ROUTINE = [
  { time: "8:30 AM", activity: "Wake Up", icon: "☀️", color: "bg-[#FFF3E0] border-[#FF9500]", textColor: "text-[#CC7700]" },
  { time: "9:00 AM", activity: "Breakfast + Metformin", icon: "🍳", color: "bg-[#E8F5E9] border-[#34C759]", textColor: "text-[#2D9F4D]" },
  { time: "10:00 AM", activity: "Morning Meds", icon: "💊", color: "bg-[#FFE5E5] border-[#FF3B30]", textColor: "text-[#FF3B30]" },
  { time: "12:00 PM", activity: "Lunch + Metformin", icon: "🥗", color: "bg-[#E8F5E9] border-[#34C759]", textColor: "text-[#2D9F4D]" },
  { time: "1:00 PM", activity: "Exercise Time", icon: "🚶‍♀️", color: "bg-[#E3F2FD] border-[#007AFF]", textColor: "text-[#0051D5]" },
  { time: "2:00 PM", activity: "Afternoon Med", icon: "💊", color: "bg-[#FFE5E5] border-[#FF3B30]", textColor: "text-[#FF3B30]" },
  { time: "3:00 PM", activity: "Music Hour", icon: "🎵", color: "bg-[#F3E5F5] border-[#AF52DE]", textColor: "text-[#9333EA]" },
  { time: "5:30 PM", activity: "Dinner + Meds", icon: "🍽️", color: "bg-[#FFE5E5] border-[#FF3B30]", textColor: "text-[#FF3B30]" },
  { time: "9:00 PM", activity: "Bedtime", icon: "🌙", color: "bg-[#E8EAF6] border-[#5856D6]", textColor: "text-[#5856D6]" },
];

// Medication alerts for demo
const MEDICATION_ALERTS = [
  {
    time: "9:00 AM",
    title: "Breakfast Medication",
    message: "Time to take Metformin 60mg with breakfast",
    icon: "🍳",
    pillIcon: "💊"
  },
  {
    time: "10:00 AM",
    title: "Morning Medications",
    message: "Take Simvastatin 80mg and Lisinopril 30mg",
    icon: "💊",
    pillIcon: "💊"
  },
  {
    time: "12:00 PM",
    title: "Lunch Medication",
    message: "Time to take Metformin 60mg with lunch",
    icon: "🥗",
    pillIcon: "💊"
  },
  {
    time: "2:00 PM",
    title: "Afternoon Medication",
    message: "Take Amlodipine 2.5mg",
    icon: "💊",
    pillIcon: "💊"
  },
  {
    time: "5:30 PM",
    title: "Dinner Medications",
    message: "Take Metformin 60mg and Donepezil 23mg with dinner",
    icon: "🍽️",
    pillIcon: "💊"
  },
];

export const KioskDashboard = () => {
  const { status, hardwareMode, radioFrequency, radioIsOn, startConversation, stopConversation } = useVapi();
  const { reminders } = useRemindersContext();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [routineIndex, setRoutineIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertIndex, setAlertIndex] = useState(0);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [customRoutines, setCustomRoutines] = useState<Array<{
    time: string;
    activity: string;
    icon: string;
    color: string;
    textColor: string;
    benefit?: string;
  }>>([]);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    time: '',
    benefit: '',
    icon: '📌'
  });

  const isVoiceActive = status === 'connected';
  const isConnecting = status !== 'idle' && status !== 'disconnected' && status !== 'connected';
  const upcomingReminders = reminders?.filter((r: any) => !r.completed).slice(0, 2) || [];
  const currentAlert = MEDICATION_ALERTS[alertIndex];

  // Combine default routines with custom routines
  const allRoutines = [...DAILY_ROUTINE, ...customRoutines];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate routine display every 2.5 minutes (150 seconds)
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setRoutineIndex((prevIndex) => {
        // Calculate next pair of routines to display
        const nextIndex = (prevIndex + 2) % allRoutines.length;
        return nextIndex;
      });
    }, 150000); // 2.5 minutes = 150,000 milliseconds

    return () => clearInterval(rotationTimer);
  }, [allRoutines.length]);

  // Show medication alert every 1.5 minutes for demo
  useEffect(() => {
    const alertTimer = setInterval(() => {
      setShowAlert(true);
      // Move to next alert in the cycle
      setAlertIndex((prevIndex) => (prevIndex + 1) % MEDICATION_ALERTS.length);
    }, 90000); // 1.5 minutes = 90,000 milliseconds

    return () => clearInterval(alertTimer);
  }, []);

  // Handler to dismiss alert
  const handleConfirmAlert = () => {
    setShowAlert(false);
  };

  // Handler to add new routine
  const handleAddRoutine = () => {
    if (newRoutine.name && newRoutine.time) {
      const routine = {
        time: newRoutine.time,
        activity: newRoutine.name,
        icon: newRoutine.icon,
        color: "bg-[#E3F2FD] border-[#007AFF]",
        textColor: "text-[#0051D5]",
        benefit: newRoutine.benefit
      };

      setCustomRoutines([...customRoutines, routine]);

      // Reset form
      setNewRoutine({
        name: '',
        time: '',
        benefit: '',
        icon: '📌'
      });

      setShowAddRoutineModal(false);
    }
  };

  // Get current pair of routines to display
  const displayedRoutines = [
    allRoutines[routineIndex],
    allRoutines[(routineIndex + 1) % allRoutines.length]
  ];

  // Format time
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <div className="w-screen h-screen bg-[#FAF9F6] flex items-center justify-center overflow-hidden">
      <div className="w-[1024px] h-[600px] bg-[#FAF9F6] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="bg-[#FAF9F6] px-8 py-6 flex justify-between items-center border-b border-[#E8E6E1]">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-2 border-white">
              R
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#1C1C1E] mb-1.5 tracking-tight">
                Hello, Ruth!
              </h1>
              <p className="text-lg text-[#6C6C70] font-medium">
                Your radio friend is here
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[52px] font-bold leading-none mb-1.5 text-[#1C1C1E] tracking-tight">
              {formatTime(currentTime)}
            </div>
            <div className="text-lg text-[#6C6C70] font-medium">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-2 gap-6 p-8 bg-[#FAF9F6]">

          {/* Radio Card - Spans 2 rows */}
          <div className="row-span-2 bg-white rounded-3xl p-6 shadow-lg border border-[#EFEDE8] flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">📻</span>
              <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Radio</span>
            </div>

            <div className="text-center my-8 flex-1 flex flex-col justify-center">
              {hardwareMode === 'radio' ? (
                <>
                  <div className="text-6xl font-extrabold leading-none mb-2 tracking-tight text-[#007AFF]">
                    {radioFrequency.toFixed(1)} FM
                  </div>
                  <div className="text-2xl text-[#1C1C1E] font-semibold mt-1">
                    {radioIsOn ? 'Playing' : 'Radio'}
                  </div>

                  {/* Station Controls */}
                  <div className="flex gap-3 mt-4 items-center justify-center">
                    <button
                      onClick={() => {
                        // Scan down 0.1 MHz
                        fetch('http://localhost:4000/api/radio/scan-down', { method: 'POST' })
                          .catch(err => console.error('Failed to scan down:', err));
                      }}
                      className="px-6 py-3 bg-[#F2F2F7] text-[#007AFF] rounded-[12px] text-base font-semibold hover:bg-[#E5E5EA] active:scale-[0.98] transition-all"
                    >
                      ◀ Down
                    </button>
                    <button
                      onClick={() => {
                        // Scan up 0.1 MHz
                        fetch('http://localhost:4000/api/radio/scan-up', { method: 'POST' })
                          .catch(err => console.error('Failed to scan up:', err));
                      }}
                      className="px-6 py-3 bg-[#F2F2F7] text-[#007AFF] rounded-[12px] text-base font-semibold hover:bg-[#E5E5EA] active:scale-[0.98] transition-all"
                    >
                      Up ▶
                    </button>
                  </div>

                  <div className="text-sm text-[#6C6C70] mt-3 font-medium">
                    Or use hardware buttons
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl font-extrabold leading-none mb-2 tracking-tight text-[#34C759]">
                    🤖 Cogito
                  </div>
                  <div className="text-2xl text-[#6C6C70] mt-2 font-semibold">
                    {isVoiceActive ? 'Listening...' : 'Ready to talk'}
                  </div>

                  {/* Speaking Animation */}
                  {isVoiceActive && (
                    <div className="flex gap-2 justify-center items-center mt-4">
                      <div className="w-3 h-8 bg-[#34C759] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                      <div className="w-3 h-12 bg-[#34C759] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-10 bg-[#34C759] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <div className="w-3 h-12 bg-[#34C759] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-8 bg-[#34C759] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-auto">
              {isVoiceActive ? (
                <button
                  onClick={stopConversation}
                  className="flex-1 py-5 bg-[#FF3B30] text-white rounded-[16px] text-lg font-semibold flex items-center justify-center shadow-md hover:bg-[#FF453A] active:scale-[0.98] transition-all"
                >
                  End Call
                </button>
              ) : (
                <button
                  onClick={startConversation}
                  disabled={isConnecting || isVoiceActive}
                  className="flex-1 py-5 bg-[#007AFF] text-white rounded-[16px] text-lg font-semibold flex items-center justify-center shadow-md hover:bg-[#0051D5] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Talk to Cogito'}
                </button>
              )}
            </div>
          </div>

          {/* Medicine Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#EFEDE8] flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">💊</span>
              <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Medicine</span>
            </div>

            {upcomingReminders.length > 0 ? (
              <div className="space-y-3 flex-1">
                {upcomingReminders.map((reminder: any, idx: number) => (
                  <div
                    key={reminder._id}
                    className={`border-2 rounded-2xl p-4 ${
                      idx === 0
                        ? 'bg-[#FFE5E5] border-[#FF3B30]'
                        : 'bg-[#E8F5E9] border-[#34C759]'
                    }`}
                  >
                    <div
                      className={`text-xs font-bold mb-2 tracking-wide uppercase ${
                        idx === 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                      }`}
                    >
                      {idx === 0 ? '⏰ COMING UP' : '✓ SCHEDULED'}
                    </div>
                    <div className="text-xl font-bold text-[#1C1C1E] mb-1 tracking-tight">
                      {reminder.title}
                    </div>
                    <div className="text-base text-[#6C6C70] font-medium">
                      {new Date(reminder.scheduledFor).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} today
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <div className="text-lg text-[#6C6C70] font-medium">All done!</div>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#EFEDE8] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📅</span>
                <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Today's Schedule</span>
              </div>
              {/* Add Routine Button */}
              <button
                onClick={() => setShowAddRoutineModal(true)}
                className="w-10 h-10 bg-[#007AFF] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#0051D5] active:scale-[0.95] transition-all"
                title="Add custom routine"
              >
                <span className="text-2xl leading-none">+</span>
              </button>
            </div>

            <div className="flex-1 space-y-2.5">
              {displayedRoutines.map((routine, idx) => (
                <div
                  key={`${routine.time}-${idx}`}
                  className={`p-3.5 ${routine.color} border-l-4 rounded-xl transition-all duration-500`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`text-sm font-bold tracking-wide ${routine.textColor}`}>
                        {routine.time}
                      </div>
                      <div className="text-base text-[#1C1C1E] mt-1 font-semibold">
                        {routine.activity}
                      </div>
                    </div>
                    <span className="text-2xl ml-2">{routine.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rotation indicator */}
            <div className="text-xs text-[#8E8E93] text-center mt-3 font-medium">
              Updates every 2.5 min • {routineIndex / 2 + 1} of {Math.ceil(allRoutines.length / 2)}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="grid grid-cols-2 gap-6 px-8 py-6 bg-[#FAF9F6] border-t border-[#E8E6E1]">
          <button className="py-6 bg-[#34C759] text-white rounded-[16px] text-xl font-semibold flex items-center justify-center shadow-md hover:bg-[#2FB350] active:scale-[0.98] transition-all">
            Call Nurse
          </button>
          <button className="py-6 bg-[#007AFF] text-white rounded-[16px] text-xl font-semibold flex items-center justify-center shadow-md hover:bg-[#0051D5] active:scale-[0.98] transition-all">
            Family Messages
          </button>
        </div>

      </div>

      {/* Medication Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-slideUp">
            {/* Alert Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FF3B30] to-[#FF453A] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-5xl">{currentAlert.pillIcon}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl">{currentAlert.icon}</span>
                </div>
              </div>
            </div>

            {/* Alert Time */}
            <div className="text-center mb-3">
              <div className="inline-block px-4 py-2 bg-[#FFE5E5] rounded-full">
                <span className="text-xl font-bold text-[#FF3B30]">⏰ {currentAlert.time}</span>
              </div>
            </div>

            {/* Alert Title */}
            <h2 className="text-3xl font-bold text-[#1C1C1E] text-center mb-3 tracking-tight">
              {currentAlert.title}
            </h2>

            {/* Alert Message */}
            <p className="text-xl text-[#6C6C70] text-center mb-8 leading-relaxed">
              {currentAlert.message}
            </p>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmAlert}
              className="w-full py-6 bg-gradient-to-r from-[#34C759] to-[#2FB350] text-white rounded-[20px] text-2xl font-bold shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all"
            >
              ✓ Confirm
            </button>

            {/* Helper Text */}
            <p className="text-center text-sm text-[#8E8E93] mt-4 font-medium">
              Press confirm after taking your medication
            </p>
          </div>
        </div>
      )}

      {/* Add Routine Modal */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg mx-4 animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#1C1C1E] tracking-tight">
                Add New Routine
              </h2>
              <button
                onClick={() => setShowAddRoutineModal(false)}
                className="w-8 h-8 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#8E8E93] hover:bg-[#E5E5EA] active:scale-[0.95] transition-all"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Routine Name */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">
                  Routine Name
                </label>
                <input
                  type="text"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                  placeholder="e.g., Video Call with Family"
                  className="w-full px-4 py-3 bg-[#F2F2F7] border-2 border-transparent rounded-xl text-lg focus:border-[#007AFF] focus:outline-none transition-all"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={newRoutine.time}
                  onChange={(e) => {
                    const time = e.target.value;
                    // Convert 24h to 12h format for display
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    const formattedTime = `${displayHour}:${minutes} ${ampm}`;
                    setNewRoutine({ ...newRoutine, time: formattedTime });
                  }}
                  className="w-full px-4 py-3 bg-[#F2F2F7] border-2 border-transparent rounded-xl text-lg focus:border-[#007AFF] focus:outline-none transition-all"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">
                  Choose Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['📞', '📺', '🎨', '📖', '☕', '🎯', '🎮', '🧩', '🌸'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewRoutine({ ...newRoutine, icon: emoji })}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        newRoutine.icon === emoji
                          ? 'bg-[#007AFF] shadow-lg scale-110'
                          : 'bg-[#F2F2F7] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Benefit/Description */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">
                  How does this help? (Optional)
                </label>
                <textarea
                  value={newRoutine.benefit}
                  onChange={(e) => setNewRoutine({ ...newRoutine, benefit: e.target.value })}
                  placeholder="e.g., Helps stay connected with loved ones"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#F2F2F7] border-2 border-transparent rounded-xl text-lg focus:border-[#007AFF] focus:outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddRoutineModal(false)}
                className="flex-1 py-4 bg-[#F2F2F7] text-[#1C1C1E] rounded-[16px] text-lg font-semibold hover:bg-[#E5E5EA] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoutine}
                disabled={!newRoutine.name || !newRoutine.time}
                className="flex-1 py-4 bg-[#007AFF] text-white rounded-[16px] text-lg font-semibold hover:bg-[#0051D5] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
