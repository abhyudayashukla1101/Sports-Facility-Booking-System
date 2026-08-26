import { useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Building, Trash2, CheckCircle2, XCircle, Hourglass, Zap } from "lucide-react";
import EmptyState from "../components/EmptyState";

export default function MyBookings() {
  const { bookings, waitlists, cancelBooking, cancelWaitlist } = useBookings();
  const [toastMessage, setToastMessage] = useState(null);

  const handleCancelBooking = (id) => {
    const result = cancelBooking(id);
    if (result.promoted) {
      setToastMessage(
        `Booking cancelled. Auto-promoted ${result.promotedStudent} (${result.rollNumber}) from Waitlist #1 to Confirmed!`
      );
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const activeWaitlists = waitlists.filter((w) => w.status === "WAITLISTED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-accent/40 bg-surface/95 p-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-bounce">
          <Zap className="h-5 w-5 text-accent shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            My Bookings & Waitlists
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your confirmed sports slots and active waitlist queue positions
          </p>
        </div>
        <Link
          to="/"
          className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-md transition hover:brightness-110"
        >
          Book New Slot
        </Link>
      </div>

      {/* Active Waitlists Section (If Any) */}
      {activeWaitlists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-white">
              Active Waitlist Queues ({activeWaitlists.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeWaitlists.map((w) => (
              <div
                key={w.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-accent/40 bg-accent/5 p-6 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-wide text-muted">
                      QUEUE ID: #{w.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[10px] font-extrabold text-accent uppercase">
                      Position #{w.queuePosition} in Line
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-bold text-white">
                    {w.facilityName}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs font-medium text-muted">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Calendar className="h-4 w-4 text-accent shrink-0" />
                      <span>{w.dateKey}</span>
                    </div>

                    <div className="flex items-center gap-2 text-accent font-bold">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{w.startLabel} – {w.endLabel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted" />
                      <span>{w.studentName} ({w.rollNumber})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 shrink-0 text-muted" />
                      <span>{w.hostel} Hostel</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border/60">
                  <button
                    onClick={() => cancelWaitlist(w.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-base/60 py-2 text-xs font-bold text-muted hover:text-white hover:border-booked/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Leave Waitlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Bookings Section */}
      <div>
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Confirmed Ground Reservations ({bookings.length})
        </h2>

        {bookings.length === 0 ? (
          <EmptyState
            title="No confirmed bookings reserved yet."
            description="Browse sports grounds on campus and tap to reserve your first slot!"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => {
              const isConfirmed = b.status === "CONFIRMED";

              return (
                <div
                  key={b.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-border bg-surface p-6 shadow-xl transition hover:border-surface-border/80"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tracking-wide text-muted">
                        ID: #{b.id}
                      </span>
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-available/15 border border-available/30 px-2.5 py-0.5 text-[10px] font-bold text-available uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed
                          {b.promotedFromWaitlist && " (Auto-Promoted)"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-booked/15 border border-booked/30 px-2.5 py-0.5 text-[10px] font-bold text-booked uppercase">
                          <XCircle className="h-3 w-3" /> Cancelled
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-xl font-bold text-white">
                      {b.facilityName}
                    </h3>

                    <div className="mt-3 space-y-2 text-xs font-medium text-muted">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Calendar className="h-4 w-4 text-accent shrink-0" />
                        <span>{b.dateKey}</span>
                      </div>

                      <div className="flex items-center gap-2 text-available font-bold">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{b.startLabel} – {b.endLabel}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted" />
                        <span className="truncate">{b.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted" />
                        <span>{b.studentName} ({b.rollNumber})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 shrink-0 text-muted" />
                        <span>{b.hostel} Hostel</span>
                      </div>
                    </div>
                  </div>

                  {isConfirmed && (
                    <div className="mt-6 pt-4 border-t border-surface-border/60">
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-booked/30 bg-booked/10 py-2 text-xs font-bold text-booked hover:bg-booked hover:text-white transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Cancel Reservation
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
