import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { AudioProvider } from "./context/AudioProvider";
import { ReminderProvider } from "./context/ReminderProvider";
import { RuthDashboard } from "./pages/RuthDashboard";
import { AdminInsights } from "./pages/AdminInsights";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <ReminderProvider>
          <div className="min-h-screen bg-slate-950 text-white">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
              <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-accent">Cogito Smart Radio</p>
                  <h1 className="text-4xl font-black">Ruth’s Smart Companion</h1>
                  <p className="text-white/70">Voice-powered reminders, music, and caregiver insights.</p>
                </div>
                <nav className="flex gap-4 text-lg font-semibold">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `px-5 py-2 rounded-full ${isActive ? "bg-accent text-slate-900" : "bg-white/10"}`
                    }
                  >
                    Ruth View
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `px-5 py-2 rounded-full ${isActive ? "bg-accent text-slate-900" : "bg-white/10"}`
                    }
                  >
                    Settings
                  </NavLink>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `px-5 py-2 rounded-full ${isActive ? "bg-accent text-slate-900" : "bg-white/10"}`
                    }
                  >
                    Care Insights
                  </NavLink>
                </nav>
              </header>
              <Routes>
                <Route path="/" element={<RuthDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminInsights />} />
              </Routes>
            </div>
          </div>
        </ReminderProvider>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
