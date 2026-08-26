import { MOCK_FACILITIES } from "../data/facilities";

const USE_MOCKS = true;
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFacilities({ sport } = {}) {
  if (USE_MOCKS) {
    await delay(150);
    if (!sport || sport === "all" || sport === "All sports") return MOCK_FACILITIES;
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
    await delay(150);
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
    await delay(150);
    const facility = MOCK_FACILITIES.find((f) => f.id === facilityId);
    return facility?.slotsByDate?.[date] ?? [];
  }
  const res = await fetch(`${BASE_URL}/facilities/${facilityId}/slots?date=${date}`);
  if (!res.ok) throw new Error("Failed to load slots");
  return res.json();
}
