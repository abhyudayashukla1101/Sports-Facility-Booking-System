import { useState } from "react";
import { X, Clock, Users, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function WaitlistModal({ facility, slot, dateObj, queueCount, onClose, onConfirm }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const position = queueCount + 1;

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        studentName: user.name,
        rollNumber: user.rollNumber,
        hostel: user.hostel
      });
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Slot Overbooked • Waitlist Queue
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

        <div className="p-5 space-y-4">
          {/* Queue Position Pill */}
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 p-4">
            <div>
              <span className="text-xs font-semibold text-muted block">Your Calculated Queue Spot:</span>
              <span className="font-display text-2xl font-extrabold text-accent">
                Position #{position} in Line
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-black text-lg">
              #{position}
            </div>
          </div>

          {/* Slot Details */}
          <div className="rounded-xl border border-surface-border/60 bg-base/60 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Date:</span>
              <span className="font-semibold text-white">
                {dateObj.dayName}, {dateObj.dayNum} {dateObj.monthName}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Time Slot:</span>
              <span className="font-bold text-booked bg-booked/10 px-2.5 py-0.5 rounded-full border border-booked/20">
                {slot.startLabel} – {slot.endLabel} (Booked)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Current Queue Length:</span>
              <span className="font-semibold text-accent">
                {queueCount} student(s) waiting ahead
              </span>
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="rounded-xl border border-surface-border/60 bg-base/40 p-3 text-xs text-muted space-y-1">
            <div>Student: <span className="font-semibold text-white">{user?.name}</span></div>
            <div>Roll Number: <span className="font-semibold text-white">{user?.rollNumber}</span></div>
            <div>Hostel: <span className="font-semibold text-white">{user?.hostel} Hostel</span></div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-muted">
            <ShieldAlert className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>If the current booking is cancelled, you will be automatically promoted to Confirmed status.</span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Joining Queue...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Confirm & Join Queue (Position #{position})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
