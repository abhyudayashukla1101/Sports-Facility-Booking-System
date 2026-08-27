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

export async function registerStudent({ name, rollNumber, hostel, phone, passcode }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rollNumber, hostel, phone, passcode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
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

export async function getMyBookings(rollNumber, studentName) {
  const query = new URLSearchParams({ rollNumber });
  if (studentName) query.append("studentName", studentName);
  const res = await fetch(`${BASE_URL}/api/bookings/my-bookings?${query.toString()}`);
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

export async function getMaintenanceWindows() {
  const res = await fetch(`${BASE_URL}/api/admin/maintenance-windows`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load maintenance windows");
  return data.windows;
}

export async function createMaintenanceWindow({ facilityId, startDate, endDate, reason, slotIds }) {
  const res = await fetch(`${BASE_URL}/api/admin/maintenance-windows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facilityId, startDate, endDate, reason, slotIds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to schedule maintenance window");
  return data.window;
}

export async function deleteMaintenanceWindow(id) {
  const res = await fetch(`${BASE_URL}/api/admin/maintenance-windows/${id}`, {
    method: "DELETE"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete maintenance window");
  return data;
}

export async function requestEventApproval({ facilityId, studentName, rollNumber, eventName, dateKey, slotId, purpose }) {
  const res = await fetch(`${BASE_URL}/api/bookings/request-approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facilityId, studentName, rollNumber, eventName, dateKey, slotId, purpose })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit event approval request");
  return data.approval;
}

export async function getEventApprovals() {
  const res = await fetch(`${BASE_URL}/api/admin/approvals`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load event approvals");
  return data.approvals;
}

export async function processEventApproval(id, { action, rejectionReason }) {
  const res = await fetch(`${BASE_URL}/api/admin/approvals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, rejectionReason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to process event approval");
  return data;
}

export async function getNotifications(rollNumber, studentName) {
  const query = new URLSearchParams({ rollNumber });
  if (studentName) query.append("studentName", studentName);
  const res = await fetch(`${BASE_URL}/api/notifications?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load notifications");
  return data;
}

export async function markNotificationRead(id) {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to mark notification read");
  return data;
}

export async function clearNotifications(rollNumber, studentName) {
  const query = new URLSearchParams({ rollNumber });
  if (studentName) query.append("studentName", studentName);
  const res = await fetch(`${BASE_URL}/api/notifications/clear?${query.toString()}`, {
    method: "DELETE"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to clear notifications");
  return data;
}

export async function updateBookingAttendance(bookingId, attendanceStatus) {
  const res = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/attendance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendanceStatus })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update attendance status");
  return data;
}

export async function getRecommendations({ facilityId, dateKey, slotId }) {
  const res = await fetch(
    `${BASE_URL}/api/recommendations?facilityId=${facilityId}&dateKey=${dateKey}&slotId=${slotId}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch recommendations");
  return data;
}

