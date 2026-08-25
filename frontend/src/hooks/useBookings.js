import { useState, useEffect } from "react";

const STORAGE_KEY = "playfield_iitg_bookings";

const INITIAL_BOOKINGS = [
  {
    id: "bk_101",
    facilityId: "badminton-hall",
    facilityName: "Badminton Hall",
    location: "SAC Indoor Hall, First Floor",
    dateKey: new Date().toISOString().split("T")[0],
    startLabel: "8:00 pm",
    endLabel: "9:00 pm",
    rollNumber: "220101045",
    studentName: "Abhyudaya Shukla",
    hostel: "Lohit",
    status: "CONFIRMED",
    bookedAt: new Date().toISOString()
  }
];

export function useBookings() {
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error("Failed to save bookings to localStorage", e);
    }
  }, [bookings]);

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
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
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
    addBooking,
    cancelBooking,
    isSlotBooked
  };
}
