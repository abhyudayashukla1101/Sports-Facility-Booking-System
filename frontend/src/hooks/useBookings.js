import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  createBooking,
  cancelBooking as apiCancelBooking,
  joinWaitlist as apiJoinWaitlist,
  cancelWaitlist as apiCancelWaitlist,
  getMyBookings
} from "../api/client";

export function useBookings() {
  const { user } = useAuth();
  const rollNumber = user?.rollNumber;
  const queryClient = useQueryClient();

  // Query: Get logged-in user's bookings and waitlists from server
  const { data = { bookings: [], waitlists: [] } } = useQuery({
    queryKey: ["myBookings", rollNumber],
    queryFn: () => getMyBookings(rollNumber),
    enabled: Boolean(rollNumber)
  });

  const bookings = data.bookings ?? [];
  const waitlists = data.waitlists ?? [];

  // Mutation: Create Booking
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings", rollNumber] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  // Mutation: Cancel Booking (promotes top waitlist candidate on backend)
  const cancelBookingMutation = useMutation({
    mutationFn: apiCancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings", rollNumber] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  // Mutation: Join Waitlist
  const joinWaitlistMutation = useMutation({
    mutationFn: apiJoinWaitlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings", rollNumber] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  // Mutation: Cancel Waitlist (Leave queue)
  const cancelWaitlistMutation = useMutation({
    mutationFn: apiCancelWaitlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings", rollNumber] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  // Wrappers to match existing function signatures
  const addBooking = async (bookingDetails) => {
    const res = await createBookingMutation.mutateAsync(bookingDetails);
    return res.booking;
  };

  const cancelBooking = async (bookingId) => {
    return cancelBookingMutation.mutateAsync(bookingId);
  };

  const joinWaitlist = async (waitlistDetails) => {
    const res = await joinWaitlistMutation.mutateAsync(waitlistDetails);
    return res.waitlist;
  };

  const cancelWaitlist = async (waitlistId) => {
    return cancelWaitlistMutation.mutateAsync(waitlistId);
  };

  // Local helper functions to support legacy calls if any
  const getWaitlistQueueCount = (facilityId, dateKey, slotId) => {
    return waitlists.filter(
      (w) =>
        w.facilityId === facilityId &&
        w.dateKey === dateKey &&
        w.slotId === slotId &&
        w.status === "WAITLISTED"
    ).length;
  };

  const getUserWaitlistEntry = (facilityId, dateKey, slotId, studentRoll) => {
    const roll = studentRoll || rollNumber;
    if (!roll) return null;
    return waitlists.find(
      (w) =>
        w.facilityId === facilityId &&
        w.dateKey === dateKey &&
        w.slotId === slotId &&
        w.rollNumber === roll &&
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
