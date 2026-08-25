// Central API client.
// Right now this reads from local mock data so the UI can be built before
// the backend exists. Once the FastAPI/Express backend is up, only the
// bodies of these functions change — nothing that imports them needs to.

import { MOCK_FACILITIES } from "../data/facilities";

const USE_MOCKS = true; // flip to false once VITE_API_BASE_URL is live
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFacilities({ sport } = {}) {
  if (USE_MOCKS) {
    await delay(250);
    if (!sport || sport === "all") return MOCK_FACILITIES;
    return MOCK_FACILITIES.filter(
      (f) => f.sport.toLowerCase() === sport.toLowerCase()
    );
  }
  const res = await fetch(`${BASE_URL}/facilities${sport ? `?sport=${sport}` : ""}`);
  if (!res.ok) throw new Error("Failed to load facilities");
  return res.json();
}

export async function getFacilityById(id) {
  if (USE_MOCKS) {
    await delay(200);
    const facility = MOCK_FACILITIES.find((f) => f.id === id);
    if (!facility) throw new Error("Facility not found");
    return facility;
  }
  const res = await fetch(`${BASE_URL}/facilities/${id}`);
  if (!res.ok) throw new Error("Failed to load facility");
  return res.json();
}

export async function getSlots(facilityId, date) {
  if (USE_MOCKS) {
    await delay(200);
    const facility = MOCK_FACILITIES.find((f) => f.id === facilityId);
    return facility?.slotsByDate?.[date] ?? [];
  }
  const res = await fetch(`${BASE_URL}/facilities/${facilityId}/slots?date=${date}`);
  if (!res.ok) throw new Error("Failed to load slots");
  return res.json();
}

export async function createBooking({ slotId, facilityId }) {
  if (USE_MOCKS) {
    await delay(400);
    // simulate the occasional race-loss for demo purposes
    const lost = Math.random() < 0.08;
    if (lost) {
      const err = new Error("Slot was just booked by someone else");
      err.code = "SLOT_TAKEN";
      throw err;
    }
    return { id: `bkg_${Date.now()}`, slotId, facilityId, status: "confirmed" };
  }
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, facilityId }),
  });
  if (res.status === 409) {
    const err = new Error("Slot was just booked by someone else");
    err.code = "SLOT_TAKEN";
    throw err;
  }
  if (!res.ok) throw new Error("Booking failed");
  return res.json();
}