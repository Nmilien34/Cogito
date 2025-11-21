import { RadioPlayer } from "../components/RadioPlayer";
import { ReminderList } from "../components/ReminderList";
import { VoiceCommander } from "../components/VoiceCommander";
import { PlaylistPanel } from "../components/PlaylistPanel";
import { AccessibilityMetrics } from "../components/AccessibilityMetrics";
import { ReminderModal } from "../components/ReminderModal";
import { DevSimulator } from "../components/DevSimulator";

export const RuthDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <RadioPlayer />
        <AccessibilityMetrics />
      </div>
      <ReminderList />
      <VoiceCommander />
      <PlaylistPanel />
      <DevSimulator />
      <ReminderModal />
    </div>
  );
};

