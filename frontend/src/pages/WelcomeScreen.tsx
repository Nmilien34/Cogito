/**
 * Welcome Screen - Initial landing page
 * Beautiful iOS-inspired welcome screen for Ruth
 */

import { useNavigate } from 'react-router-dom';

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/kiosk');
  };

  return (
    <div className="w-screen h-screen bg-[#FAF9F6] flex items-center justify-center overflow-hidden">
      <div className="text-center px-8">
        {/* Profile Picture */}
        <div className="mb-8 flex justify-center">
          <img
            src="https://img.sanishtech.com/u/67a7b7d6583f701a106d7cad17cf47cc.jpg"
            alt="Ruth's profile"
            className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white"
          />
        </div>

        {/* Welcome Message */}
        <h1 className="text-6xl font-bold text-[#1C1C1E] mb-4 tracking-tight">
          Welcome, Ruth!
        </h1>

        <p className="text-2xl text-[#6C6C70] mb-12 font-medium">
          Your smart radio companion is ready
        </p>

        {/* Get Started Button */}
        <button
          onClick={handleGetStarted}
          className="px-16 py-6 bg-[#1C1C1E] text-white text-2xl font-bold rounded-[20px] shadow-2xl hover:bg-[#2C2C2E] active:scale-95 transition-all"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
