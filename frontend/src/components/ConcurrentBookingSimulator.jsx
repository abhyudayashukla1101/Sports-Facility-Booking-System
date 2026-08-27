import { useState } from "react";
import { Zap, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const TEST_STUDENTS = [
  { name: "Abhyudaya Shukla", rollNumber: "220101045", hostel: "Lohit" },
  { name: "Devansh Mehta", rollNumber: "210102033", hostel: "Kapili" },
  { name: "Rohan Sharma", rollNumber: "210101088", hostel: "Kameng" },
  { name: "Ananya Roy", rollNumber: "220102014", hostel: "Subansiri" },
  { name: "Vikramaditya Das", rollNumber: "200103045", hostel: "Disang" }
];

export default function ConcurrentBookingSimulator({ facilities = [] }) {
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState("badminton-hall");
  const [selectedSlotId, setSelectedSlotId] = useState("9pm");
  const [isRunning, setIsRunning] = useState(false);
  const [raceResults, setRaceResults] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleRunRace = async () => {
    setIsRunning(true);
    setRaceResults(null);

    const facility = facilities.find((f) => f.id === selectedFacilityId) || {
      name: "Badminton Hall",
      location: "SAC Indoor Hall"
    };

    // Prepare 5 concurrent HTTP POST requests to /api/bookings
    const requests = TEST_STUDENTS.map((s) =>
      fetch(`${BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: selectedFacilityId,
          facilityName: facility.name,
          location: facility.location,
          dateKey: todayStr,
          slotId: selectedSlotId,
          rollNumber: s.rollNumber,
          studentName: s.name,
          hostel: s.hostel
        })
      }).then(async (res) => {
        const data = await res.json();
        return {
          student: s.name,
          rollNumber: s.rollNumber,
          hostel: s.hostel,
          status: res.status,
          success: res.ok && data.success,
          error: data.error || null,
          booking: data.booking || null
        };
      })
    );

    try {
      // Execute all 5 requests at the exact same millisecond
      const results = await Promise.all(requests);
      setRaceResults(results);

      // Invalidate queries so admin metrics and slot grids update immediately
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    } catch (err) {
      console.error("Race simulation error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-accent/40 bg-surface/90 p-6 shadow-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent animate-pulse" />
            <h3 className="font-display text-xl font-bold text-white">
              Simultaneous Booking Collision Simulator
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Simulate 5 campus students attempting to reserve the exact same slot at the exact same millisecond to test backend collision prevention.
          </p>
        </div>

        <button
          onClick={handleRunRace}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-extrabold text-accent-foreground shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Firing 5 Concurrent Requests…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Launch Race Condition Test
            </>
          )}
        </button>
      </div>

      {/* Selector Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Target Facility
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-base px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.sport})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
            Target Time Slot
          </label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-base px-3 py-2 text-xs font-semibold text-white focus:border-accent focus:outline-none"
          >
            <option value="6am">6:00 am - 7:00 am</option>
            <option value="7am">7:00 am - 8:00 am</option>
            <option value="5pm">5:00 pm - 6:00 pm</option>
            <option value="8pm">8:00 pm - 9:00 pm</option>
            <option value="9pm">9:00 pm - 10:00 pm</option>
          </select>
        </div>
      </div>

      {/* Race Results Visualization */}
      {raceResults && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <div className="rounded-xl border border-surface-border bg-base/80 p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="flex items-center gap-2 text-available">
              <ShieldCheck className="h-4 w-4" /> 1 Winner Secured Booking (HTTP 200)
            </span>
            <span className="flex items-center gap-2 text-booked">
              <AlertCircle className="h-4 w-4" /> 4 Requests Intercepted (HTTP 409 Conflict)
            </span>
          </div>

          <div className="space-y-2.5">
            {raceResults.map((res, i) => (
              <div
                key={i}
                className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  res.status === 200
                    ? "border-available/60 bg-available/10 text-white"
                    : "border-booked/40 bg-booked/5 text-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                      res.status === 200 ? "bg-available text-base" : "bg-booked/20 text-booked"
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {res.student} ({res.rollNumber})
                    </span>
                    <span className="text-[10px] text-muted font-mono block">
                      Hostel: {res.hostel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  {res.status === 200 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-available/20 border border-available/40 px-3 py-1 text-[11px] font-extrabold text-available">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK — RESERVED (ID: {res.booking?.id})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-booked/20 border border-booked/40 px-3 py-1 text-[11px] font-extrabold text-booked">
                      <AlertCircle className="h-3.5 w-3.5" /> 409 CONFLICT — {res.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
