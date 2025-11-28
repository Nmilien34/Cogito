/**
 * Kiosk Dashboard - Beautiful 7" Interface
 *
 * Inspired by iOS design language - clean, polished, accessible
 */

import { useState, useEffect } from "react";
import { useVapi } from "../context/VapiProvider";
import { useRemindersContext } from "../context/ReminderProvider";

export const KioskDashboard = () => {
  const { status, hardwareMode, startConversation, stopConversation } = useVapi();
  const { reminders } = useRemindersContext();

  const [currentTime, setCurrentTime] = useState(new Date());

  const isVoiceActive = status === 'connected';
  const isConnecting = status !== 'idle' && status !== 'disconnected' && status !== 'connected';
  const upcomingReminders = reminders?.filter((r: any) => !r.completed).slice(0, 2) || [];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
            <img
              src="https://img.sanishtech.com/u/67a7b7d6583f701a106d7cad17cf47cc.jpg"
              alt="Ruth's profile"
              className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white"
            />
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
                  <div
                    className="text-6xl font-extrabold leading-none mb-2 tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    98.5 FM
                  </div>
                  <div className="text-2xl text-[#1C1C1E] font-semibold mt-1">
                    WBLS
                  </div>
                  <div className="text-lg text-[#6C6C70] mt-2 font-medium">
                    Use hardware buttons
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="text-6xl font-extrabold leading-none mb-2 tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Voice AI
                  </div>
                  <div className="text-xl text-[#6C6C70] mt-2 font-medium">
                    {isVoiceActive ? 'Listening...' : 'Ready to talk'}
                  </div>
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
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">📅</span>
              <span className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Today</span>
            </div>

            <div className="flex-1 space-y-2.5">
              <div className="p-3.5 bg-[#FFF9E6] border-l-4 border-[#FFD60A] rounded-xl">
                <div className="text-sm text-[#D4A400] font-bold tracking-wide">3:00 PM</div>
                <div className="text-base text-[#1C1C1E] mt-1 font-semibold">Music Hour</div>
              </div>
              <div className="p-3.5 bg-[#FFF9E6] border-l-4 border-[#FFD60A] rounded-xl">
                <div className="text-sm text-[#D4A400] font-bold tracking-wide">5:30 PM</div>
                <div className="text-base text-[#1C1C1E] mt-1 font-semibold">Dinner Time</div>
              </div>
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
    </div>
  );
};
