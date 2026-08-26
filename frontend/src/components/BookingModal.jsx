import { useState } from "react";
import { X, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function BookingModal({ facility, slot, dateObj, onClose, onConfirm }) {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState(user?.name || "");
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || "");
  const [hostel, setHostel] = useState(user?.hostel || "Lohit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !rollNumber.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        studentName,
        rollNumber,
        hostel
      });
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Confirm Slot Reservation
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              {facility.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-border hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="m-5 rounded-xl border border-surface-border/60 bg-base/60 p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Date:</span>
            <span className="font-semibold text-white">
              {dateObj.dayName}, {dateObj.dayNum} {dateObj.monthName}
            </span>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="text-muted">Time Slot:</span>
            <span className="font-bold text-available bg-available/10 px-2.5 py-0.5 rounded-full border border-available/20">
              {slot.startLabel} – {slot.endLabel}
            </span>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="text-muted">Location:</span>
            <span className="text-xs font-medium text-white truncate max-w-[200px]">
              {facility.location}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-white space-y-1">
            <div className="font-bold text-accent">Authenticated Student Profile:</div>
            <div>Name: <span className="font-semibold">{studentName}</span></div>
            <div>Roll No: <span className="font-semibold">{rollNumber}</span></div>
            <div>Hostel: <span className="font-semibold">{hostel} Hostel</span></div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] text-muted">
              <ShieldCheck className="h-4 w-4 text-available shrink-0" />
              <span>Anti double-booking engine active. Slot locks instantly.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Locking slot...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirm & Lock Slot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
