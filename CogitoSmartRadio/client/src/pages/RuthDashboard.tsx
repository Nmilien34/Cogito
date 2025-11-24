import { RadioPlayer } from "../components/RadioPlayer";
import { ReminderList } from "../components/ReminderList";
import { VoiceCommander } from "../components/VoiceCommander";
import { AccessibilityMetrics } from "../components/AccessibilityMetrics";
import { ReminderModal } from "../components/ReminderModal";
import { DevSimulator } from "../components/DevSimulator";
import { VapiControls } from "../components/VapiControls";

/**
 * Ruth Dashboard
 *
 * Main interface for Ruth's FM Radio + Voice AI Companion
 * - FM Radio Controller: Physical TEA5767 radio chip control
 * - Voice AI: Vapi-powered companion for conversation and reminders
 * - Medication Reminders: Core elderly care feature
 * - Accessibility: Large buttons, high contrast, voice commands
 */

export const RuthDashboard = () => {
  return (
    <div className="space-y-6">
      {/* FM Radio Controller & Accessibility Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RadioPlayer />
        <AccessibilityMetrics />
      </div>

      {/* Voice AI Companion Controls */}
      <VapiControls />

      {/* Medication Reminders - Core Feature */}
      <ReminderList />

      {/* Voice Commands & Development Tools */}
      <VoiceCommander />
      <DevSimulator />

      {/* Reminder Modal */}
      <ReminderModal />
    </div>
  );
};

