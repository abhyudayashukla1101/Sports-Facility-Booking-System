import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Clock, Star, ArrowLeft, CheckCircle, Info, Lock } from "lucide-react";
import { useFacility } from "../hooks/useFacilities";
import { getUpcomingDates, buildFacilitySlots } from "../data/facilities";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../hooks/useAuth";
import BookingModal from "../components/BookingModal";
import LoginModal from "../components/LoginModal";

export default function SlotGrid() {
  const { id } = useParams();
  const { data: facility, isLoading } = useFacility(id);
  const { bookings, addBooking, isSlotBooked } = useBookings();
  const { user } = useAuth();

  const dates = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="mt-4 font-medium">Loading facility slots...</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted">
        <h2 className="font-display text-2xl font-bold text-white">Facility not found</h2>
        <Link to="/" className="mt-4 inline-block text-accent hover:underline">
          Return to facilities
        </Link>
      </div>
    );
  }

  // Build base slots for date
  const rawSlots = buildFacilitySlots(facility.id, selectedDate.dateKey, selectedDate.isToday);

  // Compute final slot status including locally booked slots
  const slots = rawSlots.map((s) => {
    const isLocallyBooked = isSlotBooked(facility.id, selectedDate.dateKey, s.id);
    if (isLocallyBooked) {
      return { ...s, status: "booked" };
    }
    return s;
  });

  const openCount = slots.filter((s) => s.status === "available").length;

  const handleSlotClick = (slot) => {
    if (slot.status !== "available") return;

    // Check authentication requirement before booking slot
    if (!user) {
      setPendingSlot(slot);
      setShowLoginPrompt(true);
      return;
    }

    setSelectedSlotForBooking(slot);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setShowLoginPrompt(false);
    if (pendingSlot) {
      setSelectedSlotForBooking(pendingSlot);
      setPendingSlot(null);
    }
  };

  const handleBookingConfirm = (studentDetails) => {
    addBooking({
      facilityId: facility.id,
      facilityName: facility.name,
      location: facility.location,
      dateKey: selectedDate.dateKey,
      slotId: selectedSlotForBooking.id,
      startLabel: selectedSlotForBooking.startLabel,
      endLabel: selectedSlotForBooking.endLabel,
      studentName: studentDetails.studentName,
      rollNumber: studentDetails.rollNumber,
      hostel: studentDetails.hostel
    });

    setToastMessage(
      `Slot locked! ${selectedSlotForBooking.startLabel} - ${selectedSlotForBooking.endLabel} booked for Roll No. ${studentDetails.rollNumber}`
    );
    setSelectedSlotForBooking(null);

    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-available/30 bg-surface/95 p-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle className="h-5 w-5 text-available shrink-0" />
          <span>{toastMessage}</span>
          <Link
            to="/bookings"
            className="ml-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground hover:brightness-110"
          >
            View Bookings
          </Link>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative border-b border-surface-border bg-base overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('${facility.image}')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-base/50 via-base/80 to-base" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted hover:text-white transition uppercase group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to facilities
            </Link>
          </div>

          <div>
            <span className="inline-block rounded-full bg-accent px-3.5 py-1 text-[11px] font-extrabold text-accent-foreground uppercase tracking-wider shadow-md">
              {facility.sport}
            </span>
          </div>

          <h1 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl">
            {facility.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-muted">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted" /> {facility.location}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted" /> Up to {facility.capacity} players
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted" /> {facility.slotDuration}
            </span>
            <span className="flex items-center gap-1.5 text-accent font-bold">
              <Star className="h-4 w-4 fill-current" strokeWidth={0} /> {facility.rating}
            </span>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted/90 sm:text-base">
            {facility.description}
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column: Date Selector & Slot Grid */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Pick a slot</h2>
              <p className="mt-1 text-sm font-medium text-muted">
                <span className="text-available font-bold">{openCount} slots open</span> on this day
              </p>

              {/* Date Selector Row */}
              <div className="mt-5 flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {dates.map((d) => {
                  const isSelected = selectedDate.dateKey === d.dateKey;
                  return (
                    <button
                      key={d.dateKey}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center justify-center min-w-[76px] px-3 py-3 rounded-2xl font-display transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20 font-bold scale-[1.02]"
                          : "bg-surface/90 border border-surface-border text-muted hover:text-white hover:border-muted/50"
                      }`}
                    >
                      <span className="text-[10px] tracking-wider uppercase font-semibold">
                        {d.dayName}
                      </span>
                      <span className="text-xl font-extrabold leading-tight">
                        {d.dayNum}
                      </span>
                      <span className="text-[10px] tracking-wider uppercase font-semibold">
                        {d.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Column Slot Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
              {slots.map((slot) => {
                const isPassed = slot.status === "passed";
                const isBooked = slot.status === "booked";
                const isAvailable = slot.status === "available";

                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isPassed
                        ? "border-surface-border/40 bg-surface/30 opacity-40 cursor-not-allowed"
                        : isBooked
                        ? "border-booked/40 bg-booked/5 cursor-not-allowed"
                        : "border-surface-border bg-surface hover:border-available/60 hover:bg-surface-hover cursor-pointer shadow-md hover:shadow-available/5"
                    }`}
                  >
                    <div>
                      <div className="text-base font-bold text-white">
                        {slot.startLabel}
                      </div>
                      <div className="text-xs text-muted font-medium mt-0.5">
                        to {slot.endLabel}
                      </div>
                    </div>

                    <div className="mt-4">
                      {isPassed && (
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                          PASSED
                        </span>
                      )}
                      {isBooked && (
                        <span className="inline-block rounded-full bg-booked/15 border border-booked/30 px-2.5 py-0.5 text-[10px] font-bold text-booked uppercase tracking-wider">
                          BOOKED
                        </span>
                      )}
                      {isAvailable && (
                        <span className="inline-block rounded-full bg-available/15 border border-available/30 px-2.5 py-0.5 text-[10px] font-bold text-available uppercase tracking-wider group-hover:bg-available group-hover:text-base transition">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Rules Card & Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xl">
              <h3 className="font-display text-lg font-bold text-white mb-4">
                Facility rules
              </h3>

              <ul className="space-y-3">
                {facility.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-muted">
                    <CheckCircle className="h-5 w-5 text-available shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-surface-border/60 bg-base/50 p-5 text-xs text-muted space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold">
                <Info className="h-4 w-4 shrink-0" />
                <span>IIT Guwahati Gymkhana Policy</span>
              </div>
              <p className="leading-relaxed">
                Authentication required before booking. Slots open 7 days in advance. Please cancel at least 1 hour prior if you cannot attend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Requirement Modal */}
      {showLoginPrompt && (
        <LoginModal
          onClose={() => {
            setShowLoginPrompt(false);
            setPendingSlot(null);
          }}
          onSuccess={handleLoginSuccess}
          initialTab="student"
          subtitle="Please sign in to lock your slot"
        />
      )}

      {/* Booking Confirmation Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          facility={facility}
          slot={selectedSlotForBooking}
          dateObj={selectedDate}
          onClose={() => setSelectedSlotForBooking(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
}