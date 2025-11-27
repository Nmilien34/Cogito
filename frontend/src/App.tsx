import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AudioProvider } from "./context/AudioProvider";
import { ReminderProvider } from "./context/ReminderProvider";
import { VapiProvider } from "./context/VapiProvider";
import { KioskDashboard } from "./pages/KioskDashboard";
import { RuthDashboard } from "./pages/RuthDashboard";
import { AdminInsights } from "./pages/AdminInsights";
import { Settings } from "./pages/Settings";

// Layout wrapper to conditionally show navigation
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isKioskMode = location.pathname === '/';

  if (isKioskMode) {
    // Kiosk mode - no navigation, full screen
    return <>{children}</>;
  }

  // Admin/Settings mode - with navigation
  return (
    <div className="min-h-screen bg-paper text-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold">Cogito Smart Radio</p>
            <h1 className="text-4xl font-black text-gray-800">Ruth's Smart Companion</h1>
            <p className="text-gray-600">Voice-powered reminders, music, and caregiver insights.</p>
          </div>
          <nav className="flex gap-4 text-lg font-semibold">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full ${isActive ? "bg-accent text-white" : "bg-gray-200 text-gray-700"}`
              }
            >
              Kiosk View
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full ${isActive ? "bg-accent text-white" : "bg-gray-200 text-gray-700"}`
              }
            >
              Full Dashboard
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full ${isActive ? "bg-accent text-white" : "bg-gray-200 text-gray-700"}`
              }
            >
              Settings
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-5 py-2 rounded-full ${isActive ? "bg-accent text-white" : "bg-gray-200 text-gray-700"}`
              }
            >
              Care Insights
            </NavLink>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <ReminderProvider>
          <VapiProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<KioskDashboard />} />
                <Route path="/dashboard" element={<RuthDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminInsights />} />
              </Routes>
            </Layout>
          </VapiProvider>
        </ReminderProvider>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
