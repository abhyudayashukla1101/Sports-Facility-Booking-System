import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Clock, Star, ArrowLeft, CheckCircle, Info, MessageSquarePlus, User, X, ZoomIn, Hourglass } from "lucide-react";
import { useFacility } from "../hooks/useFacilities";
import { getUpcomingDates } from "../data/facilities";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../hooks/useAuth";
import { useReviews } from "../hooks/useReviews";
import { useSlots } from "../hooks/useSlots";
import BookingModal from "../components/BookingModal";
import LoginModal from "../components/LoginModal";
import ReviewModal from "../components/ReviewModal";
import WaitlistModal from "../components/WaitlistModal";

export default function SlotGrid() {
  const { id } = useParams();
  const { data: facility, isLoading } = useFacility(id);
  const { addBooking, joinWaitlist, cancelWaitlist } = useBookings();
  const { user } = useAuth();
  const { getReviewsForFacility, getAverageRating, addReview } = useReviews(id);

  const dates = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  // Load slots grid dynamically from server
  const { data: slots = [], isLoading: isLoadingSlots } = useSlots(id, selectedDate.dateKey);

  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [selectedSlotForWaitlist, setSelectedSlotForWaitlist] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  if (isLoading || isLoadingSlots) {
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

  const facilityReviews = getReviewsForFacility(facility.id);
  const avgRating = getAverageRating(facility.id, facility.rating);
  const openCount = slots.filter((s) => s.status === "available").length;

  const handleSlotClick = (slot) => {
    if (slot.status === "passed") return;

    if (slot.status === "available") {
      if (!user) {
        setPendingSlot(slot);
        setShowLoginPrompt(true);
        return;
      }
      setSelectedSlotForBooking(slot);
      return;
    }

    // Overbooked / BOOKED slot -> Waitlist flow
    if (slot.status === "booked") {
      if (!user) {
        setPendingSlot(slot);
        setShowLoginPrompt(true);
        return;
      }

      const userWaitlist = slot.userWaitlist;
      if (userWaitlist) {
        setToastMessage(`You are already in queue (Position #${userWaitlist.queuePosition}) for this slot.`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      setSelectedSlotForWaitlist(slot);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginPrompt(false);
    if (pendingSlot) {
      if (pendingSlot.status === "available") {
        setSelectedSlotForBooking(pendingSlot);
      } else if (pendingSlot.status === "booked") {
        setSelectedSlotForWaitlist(pendingSlot);
      }
      setPendingSlot(null);
    }
  };

  const handleBookingConfirm = async (studentDetails) => {
    try {
      await addBooking({
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
    } catch (err) {
      setToastMessage(`Booking failed: ${err.message}`);
    }

    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleWaitlistConfirm = async (studentDetails) => {
    try {
      const entry = await joinWaitlist({
        facilityId: facility.id,
        facilityName: facility.name,
        location: facility.location,
        dateKey: selectedDate.dateKey,
        slotId: selectedSlotForWaitlist.id,
        startLabel: selectedSlotForWaitlist.startLabel,
        endLabel: selectedSlotForWaitlist.endLabel,
        studentName: studentDetails.studentName,
        rollNumber: studentDetails.rollNumber,
        hostel: studentDetails.hostel
      });

      setToastMessage(
        `Joined waitlist! You are Position #${entry.queuePosition} in line for ${selectedSlotForWaitlist.startLabel} slot.`
      );
      setSelectedSlotForWaitlist(null);
    } catch (err) {
      setToastMessage(`Waitlist failed: ${err.message}`);
    }

    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await addReview(reviewData);
      setShowReviewModal(false);
      setToastMessage("Thank you! Your review with photos has been published.");
    } catch (err) {
      setToastMessage(`Failed to submit review: ${err.message}`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowReviewModal(true);
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
              <Star className="h-4 w-4 fill-current" strokeWidth={0} /> {avgRating} ({facilityReviews.length} reviews)
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
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Pick a slot</h2>
                  <p className="mt-1 text-sm font-medium text-muted">
                    <span className="text-available font-bold">{openCount} slots open</span> on this day
                  </p>
                </div>

                {/* Status Legend Bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted bg-surface/60 border border-surface-border/60 rounded-full px-4 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-available" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-booked" /> Booked
                  </span>
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <Hourglass className="h-3 w-3" /> Join Waitlist
                  </span>
                </div>
              </div>

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
                const queueCount = slot.queueCount ?? 0;
                const userWaitlist = slot.userWaitlist ?? null;

                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isPassed
                        ? "border-surface-border/40 bg-surface/30 opacity-40 cursor-not-allowed"
                        : isBooked
                        ? userWaitlist
                          ? "border-accent/50 bg-accent/5 hover:border-accent cursor-pointer shadow-md shadow-accent/10"
                          : "border-booked/40 bg-booked/5 hover:border-booked hover:bg-surface-hover cursor-pointer shadow-md hover:shadow-booked/10"
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

                    <div className="mt-4 flex flex-col gap-1">
                      {isPassed && (
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                          PASSED
                        </span>
                      )}
                      {isBooked && (
                        <div className="w-full space-y-2 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="inline-block rounded-full bg-booked/20 border border-booked/40 px-2.5 py-0.5 text-[10px] font-extrabold text-booked uppercase tracking-wider">
                              BOOKED
                            </span>
                            {queueCount > 0 && (
                              <span className={`text-[10px] font-extrabold ${userWaitlist ? "text-accent" : "text-booked"}`}>
                                {queueCount} in queue
                              </span>
                            )}
                          </div>

                          {userWaitlist ? (
                            /* TURN YELLOW AFTER JOINING WAITLIST + LEAVE WAITLIST OPTION */
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-accent bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-foreground shadow-md animate-fadeIn">
                                <Hourglass className="h-3.5 w-3.5" /> Waitlist Position #{userWaitlist.queuePosition}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelWaitlist(userWaitlist.id);
                                  setToastMessage("You left the waitlist for this slot.");
                                  setTimeout(() => setToastMessage(null), 3000);
                                }}
                                className="w-full flex items-center justify-center gap-1 py-0.5 text-[11px] font-bold text-muted hover:text-booked transition group/leave"
                              >
                                <X className="h-3 w-3 group-hover/leave:scale-110" /> Leave Waitlist
                              </button>
                            </div>
                          ) : (
                            /* STAY RED BEFORE JOINING WAITLIST */
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlotClick(slot);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-booked/50 bg-booked/15 text-booked hover:bg-booked hover:text-white px-3 py-2 text-xs font-bold shadow-md transition active:scale-95"
                            >
                              <Hourglass className="h-3.5 w-3.5" /> Join Waitlist
                            </button>
                          )}
                        </div>
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

            {/* Student Reviews Section */}
            <div className="mt-12 pt-8 border-t border-surface-border/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Student Reviews & Photos
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted">
                    <span className="flex items-center gap-1 font-bold text-accent">
                      <Star className="h-4 w-4 fill-current" strokeWidth={0} /> {avgRating} out of 5
                    </span>
                    <span>• {facilityReviews.length} student reviews</span>
                  </div>
                </div>

                <button
                  onClick={handleWriteReviewClick}
                  className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-md transition hover:brightness-110"
                >
                  <MessageSquarePlus className="h-4 w-4" /> Write a Review
                </button>
              </div>

              {facilityReviews.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-surface-border bg-surface/50 p-6 text-center text-xs text-muted">
                  No reviews submitted yet for this facility. Be the first student to leave feedback!
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {facilityReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-surface-border bg-surface/80 p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
                            <User className="h-4 w-4" />
                          </span>
                          <div>
                            <span className="text-sm font-bold text-white block">
                              {rev.studentName}
                            </span>
                            <span className="text-[10px] text-muted block">
                              Roll No: {rev.rollNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating
                                  ? "fill-accent text-accent"
                                  : "text-surface-border fill-surface"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-muted/90 leading-relaxed pl-10">
                        "{rev.comment}"
                      </p>

                      {rev.images && rev.images.length > 0 && (
                        <div className="pl-10 pt-1 flex flex-wrap gap-2">
                          {rev.images.map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setLightboxImage(imgSrc)}
                              className="relative group h-20 w-24 rounded-xl overflow-hidden border border-surface-border cursor-pointer shadow-sm hover:border-accent/60 transition"
                            >
                              <img
                                src={imgSrc}
                                alt="Student upload"
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                <ZoomIn className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-muted/60 pl-10 font-mono">
                        Posted on {rev.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <span>IIT Guwahati Queue Policy</span>
              </div>
              <p className="leading-relaxed">
                If a slot is booked, you can join the queue. When the booking is cancelled, Position #1 on the waitlist is automatically promoted to Confirmed.
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
          subtitle="Please sign in to proceed"
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

      {/* Waitlist Modal */}
      {selectedSlotForWaitlist && (
        <WaitlistModal
          facility={facility}
          slot={selectedSlotForWaitlist}
          dateObj={selectedDate}
          queueCount={selectedSlotForWaitlist.queueCount ?? 0}
          onClose={() => setSelectedSlotForWaitlist(null)}
          onConfirm={handleWaitlistConfirm}
        />
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <ReviewModal
          facility={facility}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Lightbox Image View Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-surface-border bg-base p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightboxImage} alt="Ground detail" className="max-h-[85vh] w-full object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
