import { useEffect, useState } from "react";
import { fetchMedications, createMedication, updateMedication, deleteMedication } from "../api/medications";
import { fetchReminders, createReminder, updateReminder } from "../api/reminders";
import { DEFAULT_PROFILE_ID } from "../config";
import type { Medication, Reminder } from "../types";
import { format } from "date-fns";

export const Settings = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meds, rems] = await Promise.all([
        fetchMedications(DEFAULT_PROFILE_ID),
        fetchReminders(DEFAULT_PROFILE_ID),
      ]);
      setMedications(meds);
      setReminders(rems);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const timeStr = formData.get("preferredTime") as string;
    // Convert time string (HH:mm) to a full datetime for today
    let preferredTime: string | undefined = undefined;
    if (timeStr) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      preferredTime = today.toISOString();
    }

    const data = {
      profileId: DEFAULT_PROFILE_ID,
      name: formData.get("name") as string,
      dosage: formData.get("dosage") as string,
      instructions: formData.get("instructions") as string,
      preferredTime,
      takeWithFood: formData.get("takeWithFood") === "on",
      notes: formData.get("notes") as string,
    };

    try {
      if (editingMed) {
        await updateMedication(editingMed.id, data);
      } else {
        await createMedication(data);
      }
      setShowMedForm(false);
      setEditingMed(null);
      loadData();
    } catch (err) {
      console.error("Failed to save medication", err);
      alert("Failed to save medication. Please try again.");
    }
  };

  const handleSaveReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const scheduledAt = formData.get("scheduledAt") as string;
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();

    const data = {
      profileId: DEFAULT_PROFILE_ID,
      medicationId: formData.get("medicationId") as string || null,
      label: formData.get("label") as string,
      scheduledAt: scheduledDate.toISOString(),
      recurrence: formData.get("recurrence") as string || null,
      snoozeMinutes: parseInt(formData.get("snoozeMinutes") as string) || 10,
    };

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, data);
      } else {
        await createReminder(data);
      }
      setShowReminderForm(false);
      setEditingReminder(null);
      loadData();
    } catch (err) {
      console.error("Failed to save reminder", err);
      alert("Failed to save reminder. Please try again.");
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;
    try {
      await deleteMedication(id);
      loadData();
    } catch (err) {
      console.error("Failed to delete medication", err);
      alert("Failed to delete medication. Please try again.");
    }
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMed(med);
    setShowMedForm(true);
  };

  const handleEditReminder = (rem: Reminder) => {
    setEditingReminder(rem);
    setShowReminderForm(true);
  };

  if (loading) {
    return <div className="text-white text-xl">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold">Settings</h1>
        <p className="text-white/70">Manage medications and reminders for Ruth</p>
      </header>

      {/* Medications Section */}
      <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Medications</h2>
          <button
            onClick={() => {
              setEditingMed(null);
              setShowMedForm(true);
            }}
            className="bg-accent text-slate-900 font-semibold px-6 py-3 rounded-full text-lg"
          >
            + Add Medication
          </button>
        </div>

        {showMedForm && (
          <form onSubmit={handleSaveMedication} className="bg-slate-800/50 rounded-2xl p-6 mb-6 space-y-4" key={editingMed?.id || "new"}>
            <h3 className="text-xl font-bold">{editingMed ? "Edit" : "Add"} Medication</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingMed?.name || ""}
                  placeholder="Enter medication name"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  defaultValue={editingMed?.dosage || ""}
                  placeholder="e.g., 5mg"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Instructions</label>
                <textarea
                  name="instructions"
                  defaultValue={editingMed?.instructions || ""}
                  placeholder="Enter instructions for taking this medication"
                  rows={3}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Preferred Time</label>
                <input
                  type="time"
                  name="preferredTime"
                  defaultValue={
                    editingMed?.preferredTime
                      ? format(new Date(editingMed.preferredTime), "HH:mm")
                      : ""
                  }
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="takeWithFood"
                  defaultChecked={editingMed?.takeWithFood || false}
                  className="w-5 h-5 accent-accent"
                />
                <label className="text-sm font-semibold">Take with food</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingMed?.notes || ""}
                  placeholder="Additional notes or reminders"
                  rows={2}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none resize-y"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-white font-semibold px-6 py-2 rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMedForm(false);
                  setEditingMed(null);
                }}
                className="bg-slate-600 text-white font-semibold px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-slate-800/50 rounded-2xl p-4 flex justify-between items-start"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold">{med.name}</h3>
                {med.dosage && <p className="text-white/70">Dosage: {med.dosage}</p>}
                {med.instructions && <p className="text-white/60 text-sm mt-1">{med.instructions}</p>}
                {med.preferredTime && (
                  <p className="text-accent text-sm mt-1">
                    Preferred time: {format(new Date(med.preferredTime), "h:mm a")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditMedication(med)}
                  className="bg-accent text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMedication(med.id)}
                  className="bg-danger text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {medications.length === 0 && (
            <p className="text-white/60 text-center py-8">No medications added yet.</p>
          )}
        </div>
      </section>

      {/* Reminders Section */}
      <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reminders</h2>
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowReminderForm(true);
            }}
            className="bg-accent text-slate-900 font-semibold px-6 py-3 rounded-full text-lg"
          >
            + Add Reminder
          </button>
        </div>

        {showReminderForm && (
          <form onSubmit={handleSaveReminder} className="bg-slate-800/50 rounded-2xl p-6 mb-6 space-y-4" key={editingReminder?.id || "new"}>
            <h3 className="text-xl font-bold">{editingReminder ? "Edit" : "Add"} Reminder</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Label *</label>
                <input
                  type="text"
                  name="label"
                  required
                  defaultValue={editingReminder?.label || ""}
                  placeholder="e.g., Take Donepezil"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Medication</label>
                <select
                  name="medicationId"
                  defaultValue={editingReminder?.medication?.id || ""}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                >
                  <option value="">None</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Scheduled Time *</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  defaultValue={
                    editingReminder?.scheduledAt
                      ? format(new Date(editingReminder.scheduledAt), "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Recurrence</label>
                <select
                  name="recurrence"
                  defaultValue={editingReminder?.recurrence || ""}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                >
                  <option value="">Once</option>
                  <option value="DAILY">Daily</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Snooze Minutes</label>
                <input
                  type="number"
                  name="snoozeMinutes"
                  min="1"
                  defaultValue={editingReminder?.snoozeMinutes || 10}
                  placeholder="10"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-white font-semibold px-6 py-2 rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReminderForm(false);
                  setEditingReminder(null);
                }}
                className="bg-slate-600 text-white font-semibold px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="bg-slate-800/50 rounded-2xl p-4 flex justify-between items-start"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold">{rem.label}</h3>
                {rem.medication && <p className="text-white/70">Medication: {rem.medication.name}</p>}
                <p className="text-accent text-sm mt-1">
                  {format(new Date(rem.scheduledAt), "MMM d, h:mm a")} • {rem.recurrence || "Once"}
                </p>
              </div>
              <button
                onClick={() => handleEditReminder(rem)}
                className="bg-accent text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm"
              >
                Edit
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="text-white/60 text-center py-8">No reminders added yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

