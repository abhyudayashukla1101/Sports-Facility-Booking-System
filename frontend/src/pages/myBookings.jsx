import { useBookings } from "../hooks/useBookings";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Building, Trash2, CheckCircle2, XCircle } from "lucide-react";
import EmptyState from "../components/EmptyState";

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your reserved sports slots across IIT Guwahati grounds
          </p>
        </div>
        <Link
          to="/"
          className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-md transition hover:brightness-110"
        >
          Book New Slot
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No bookings reserved yet."
            description="Browse sports grounds on campus and tap to reserve your first slot!"
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                      onClick={() => cancelBooking(b.id)}
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
  );
}