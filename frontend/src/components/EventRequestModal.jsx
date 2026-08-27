import { useState } from "react";
import { X, Calendar, Trophy, Send, Clock, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { requestEventApproval } from "../api/client";
import { getUpcomingDates } from "../data/facilities";

export default function EventRequestModal({ facility, onClose, onSuccess }) {
  const { user } = useAuth();
  const dates = getUpcomingDates();

  const [eventName, setEventName] = useState("Inter-Hostel Badminton Tournament");
  const [studentName, setStudentName] = useState(user?.name || "");
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || "");
  const [selectedDateKey, setSelectedDateKey] = useState(dates[0].dateKey);
  const [selectedSlotId, setSelectedSlotId] = useState("8pm");
  const [purpose, setPurpose] = useState("Inter-hostel matches requiring dedicated court reservation");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName || !rollNumber || !eventName || !purpose) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await requestEventApproval({
        facilityId: facility.id,
        studentName: studentName.trim(),
        rollNumber: rollNumber.trim(),
        eventName: eventName.trim(),
        dateKey: selectedDateKey,
        slotId: selectedSlotId,
        purpose: purpose.trim()
      });

      onSuccess("Event booking request submitted for Gymkhana Admin approval!");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit event request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-white hover:bg-surface-border transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Request Tournament / Event Approval
            </h3>
            <p className="text-xs text-muted">
              Submit a dedicated booking request for {facility.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-booked/40 bg-booked/10 p-3 text-xs font-semibold text-booked">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-muted font-bold uppercase tracking-wider mb-1">
              Event / Tournament Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Inter-Hostel Championship Finals"
              className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted font-bold uppercase tracking-wider mb-1">
                Organizer Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-muted font-bold uppercase tracking-wider mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Roll No"
                className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted font-bold uppercase tracking-wider mb-1">
                Target Date
              </label>
              <select
                value={selectedDateKey}
                onChange={(e) => setSelectedDateKey(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none"
              >
                {dates.map((d) => (
                  <option key={d.dateKey} value={d.dateKey}>
                    {d.dayName} {d.dayNum} {d.monthName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-muted font-bold uppercase tracking-wider mb-1">
                Time Slot
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none"
              >
                <option value="5pm">5:00 pm - 6:00 pm</option>
                <option value="6pm">6:00 pm - 7:00 pm</option>
                <option value="7pm">7:00 pm - 8:00 pm</option>
                <option value="8pm">8:00 pm - 9:00 pm</option>
                <option value="9pm">9:00 pm - 10:00 pm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-muted font-bold uppercase tracking-wider mb-1">
              Purpose & Match Details
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe event scope, host hostel/club, and required setup..."
              className="w-full rounded-xl border border-surface-border bg-base px-3 py-2.5 text-white focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-xs font-extrabold text-accent-foreground shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting Request…" : "Submit Event Request for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
