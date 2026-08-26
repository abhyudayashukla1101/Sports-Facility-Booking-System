const USE_MOCKS = false;
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getFacilities({ sport } = {}) {
  const url = `${BASE_URL}/api/facilities${sport ? `?sport=${sport}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load facilities");
  return res.json();
}

export async function getFacilityById(id) {
  const res = await fetch(`${BASE_URL}/api/facilities/${id}`);
  if (!res.ok) throw new Error("Failed to load facility");
  return res.json();
}

export async function getSlots(facilityId, date, rollNumber = null) {
  const query = new URLSearchParams({ date });
  if (rollNumber) query.append("rollNumber", rollNumber);
  
  const res = await fetch(`${BASE_URL}/api/facilities/${facilityId}/slots?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to load slots");
  return res.json();
}

export async function createBooking({ facilityId, dateKey, slotId, rollNumber, studentName, hostel }) {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facilityId, dateKey, slotId, rollNumber, studentName, hostel })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create booking");
  return data;
}

export async function cancelBooking(bookingId) {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: "POST"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel booking");
  return data;
}

export async function getMyBookings(rollNumber) {
  const res = await fetch(`${BASE_URL}/api/bookings/my-bookings?rollNumber=${rollNumber}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load bookings");
  return data;
}

export async function joinWaitlist({ facilityId, dateKey, slotId, rollNumber, studentName, hostel }) {
  const res = await fetch(`${BASE_URL}/api/waitlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facilityId, dateKey, slotId, rollNumber, studentName, hostel })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to join waitlist");
  return data;
}

export async function cancelWaitlist(waitlistId) {
  const res = await fetch(`${BASE_URL}/api/waitlists/${waitlistId}`, {
    method: "DELETE"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel waitlist");
  return data;
}

export async function getReviews(facilityId) {
  const res = await fetch(`${BASE_URL}/api/facilities/${facilityId}/reviews`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function addReview(facilityId, reviewData) {
  const res = await fetch(`${BASE_URL}/api/facilities/${facilityId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit review");
  return data;
}

export async function getAnalytics() {
  const res = await fetch(`${BASE_URL}/api/admin/analytics`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load analytics");
  return data;
}

export async function toggleMaintenance(facilityId, isMaintenanceLocked) {
  const res = await fetch(`${BASE_URL}/api/admin/facilities/${facilityId}/maintenance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isMaintenanceLocked })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to toggle maintenance status");
  return data;
}

