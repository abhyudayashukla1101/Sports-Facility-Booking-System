import { useState, useEffect } from "react";

const BOOKINGS_STORAGE_KEY = "playfield_iitg_bookings";
const WAITLIST_STORAGE_KEY = "playfield_iitg_waitlists";

const INITIAL_BOOKINGS = [
  {
    id: "bk_101",
    facilityId: "badminton-hall",
    facilityName: "Badminton Hall",
    location: "SAC Indoor Hall, First Floor",
    dateKey: new Date().toISOString().split("T")[0],
    slotId: "7pm",
    startLabel: "7:00 pm",
    endLabel: "8:00 pm",
    rollNumber: "220101045",
    studentName: "Abhyudaya Shukla",
    hostel: "Lohit",
    status: "CONFIRMED",
    bookedAt: new Date().toISOString()
  }
];

const INITIAL_WAITLISTS = [
  {
    id: "wl_501",
    facilityId: "badminton-hall",
    facilityName: "Badminton Hall",
    location: "SAC Indoor Hall, First Floor",
    dateKey: new Date().toISOString().split("T")[0],
    slotId: "7pm",
    startLabel: "7:00 pm",
    endLabel: "8:00 pm",
    rollNumber: "210102033",
    studentName: "Devansh Mehta",
    hostel: "Kapili",
    queuePosition: 1,
    status: "WAITLISTED",
    createdAt: new Date().toISOString()
  }
];

export function useBookings() {
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [waitlists, setWaitlists] = useState(() => {
    try {
      const saved = localStorage.getItem(WAITLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_WAITLISTS;
    } catch {
      return INITIAL_WAITLISTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error("Failed to save bookings to localStorage", e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlists));
    } catch (e) {
      console.error("Failed to save waitlists to localStorage", e);
    }
  }, [waitlists]);

  const addBooking = (newBooking) => {
    const bookingItem = {
      id: `bk_${Date.now().toString().slice(-6)}`,
      status: "CONFIRMED",
      bookedAt: new Date().toISOString(),
      ...newBooking
    };
    setBookings((prev) => [bookingItem, ...prev]);
    return bookingItem;
  };

  const cancelBooking = (bookingId) => {
    let cancelledBooking = null;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          cancelledBooking = b;
          return { ...b, status: "CANCELLED" };
        }
        return b;
      })
    );

    // AUTO-PROMOTION ENGINE:
    // Check if there is an active waitlist for this specific slot
    if (cancelledBooking) {
      const { facilityId, dateKey, slotId } = cancelledBooking;

      // Find eligible waitlisted entries sorted by queuePosition
      const activeWaitlist = waitlists
        .filter(
          (w) =>
            w.facilityId === facilityId &&
            w.dateKey === dateKey &&
            w.slotId === slotId &&
            w.status === "WAITLISTED"
        )
        .sort((a, b) => a.queuePosition - b.queuePosition);

      if (activeWaitlist.length > 0) {
        const topCandidate = activeWaitlist[0];

        // 1. Promote top candidate to confirmed booking
        const promotedBooking = {
          id: `bk_promoted_${Date.now().toString().slice(-5)}`,
          facilityId: topCandidate.facilityId,
          facilityName: topCandidate.facilityName,
          location: topCandidate.location,
          dateKey: topCandidate.dateKey,
          slotId: topCandidate.slotId,
          startLabel: topCandidate.startLabel,
          endLabel: topCandidate.endLabel,
          rollNumber: topCandidate.rollNumber,
          studentName: topCandidate.studentName,
          hostel: topCandidate.hostel,
          status: "CONFIRMED",
          bookedAt: new Date().toISOString(),
          promotedFromWaitlist: true
        };

        setBookings((prev) => [promotedBooking, ...prev]);

        // 2. Mark candidate waitlist as PROMOTED & adjust positions of remaining candidates
        setWaitlists((prev) =>
          prev.map((w) => {
            if (w.id === topCandidate.id) {
              return { ...w, status: "PROMOTED" };
            }
            if (
              w.facilityId === facilityId &&
              w.dateKey === dateKey &&
              w.slotId === slotId &&
              w.status === "WAITLISTED" &&
              w.queuePosition > topCandidate.queuePosition
            ) {
              return { ...w, queuePosition: w.queuePosition - 1 };
            }
            return w;
          })
        );

        return {
          promoted: true,
          promotedStudent: topCandidate.studentName,
          rollNumber: topCandidate.rollNumber,
          startLabel: topCandidate.startLabel
        };
      }
    }

    return { promoted: false };
  };

  const joinWaitlist = (newWaitlist) => {
    // Calculate current position
    const currentQueue = waitlists.filter(
      (w) =>
        w.facilityId === newWaitlist.facilityId &&
        w.dateKey === newWaitlist.dateKey &&
        w.slotId === newWaitlist.slotId &&
        w.status === "WAITLISTED"
    );

    const queuePosition = currentQueue.length + 1;

    const item = {
      id: `wl_${Date.now().toString().slice(-6)}`,
      queuePosition,
      status: "WAITLISTED",
      createdAt: new Date().toISOString(),
      ...newWaitlist
    };

    setWaitlists((prev) => [item, ...prev]);
    return item;
  };

  const cancelWaitlist = (waitlistId) => {
    let target = null;
    setWaitlists((prev) => {
      return prev.map((w) => {
        if (w.id === waitlistId) {
          target = w;
          return { ...w, status: "CANCELLED" };
        }
        return w;
      });
    });

    if (target) {
      setWaitlists((prev) =>
        prev.map((w) => {
          if (
            w.facilityId === target.facilityId &&
            w.dateKey === target.dateKey &&
            w.slotId === target.slotId &&
            w.status === "WAITLISTED" &&
            w.queuePosition > target.queuePosition
          ) {
            return { ...w, queuePosition: w.queuePosition - 1 };
          }
          return w;
        })
      );
    }
  };

  const getWaitlistQueueCount = (facilityId, dateKey, slotId) => {
    return waitlists.filter(
      (w) =>
        w.facilityId === facilityId &&
        w.dateKey === dateKey &&
        w.slotId === slotId &&
        w.status === "WAITLISTED"
    ).length;
  };

  const getUserWaitlistEntry = (facilityId, dateKey, slotId, rollNumber) => {
    if (!rollNumber) return null;
    return waitlists.find(
      (w) =>
        w.facilityId === facilityId &&
        w.dateKey === dateKey &&
        w.slotId === slotId &&
        w.rollNumber === rollNumber &&
        w.status === "WAITLISTED"
    );
  };

  const isSlotBooked = (facilityId, dateKey, slotId) => {
    return bookings.some(
      (b) =>
        b.facilityId === facilityId &&
        b.dateKey === dateKey &&
        b.slotId === slotId &&
        b.status === "CONFIRMED"
    );
  };

  return {
    bookings,
    waitlists,
    addBooking,
    cancelBooking,
    joinWaitlist,
    cancelWaitlist,
    getWaitlistQueueCount,
    getUserWaitlistEntry,
    isSlotBooked
  };
}
