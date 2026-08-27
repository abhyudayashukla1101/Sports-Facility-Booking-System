export const SPORTS = [
  "All sports",
  "Badminton",
  "Basketball",
  "Cricket",
  "Football",
  "Gym",
  "Squash",
  "Swimming",
  "Table Tennis",
  "Tennis",
  "Volleyball"
];

export function getUpcomingDates() {
  const dates = [];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    dates.push({
      dateKey,
      isToday: i === 0,
      dayName: i === 0 ? "TODAY" : days[d.getDay()],
      dayNum: d.getDate(),
      monthName: months[d.getMonth()]
    });
  }
  return dates;
}

const TIME_SLOTS = [
  { id: "6am", startLabel: "6:00 am", endLabel: "7:00 am" },
  { id: "7am", startLabel: "7:00 am", endLabel: "8:00 am" },
  { id: "8am", startLabel: "8:00 am", endLabel: "9:00 am" },
  { id: "9am", startLabel: "9:00 am", endLabel: "10:00 am" },
  { id: "10am", startLabel: "10:00 am", endLabel: "11:00 am" },
  { id: "11am", startLabel: "11:00 am", endLabel: "12:00 pm" },
  { id: "12pm", startLabel: "12:00 pm", endLabel: "1:00 pm" },
  { id: "1pm", startLabel: "1:00 pm", endLabel: "2:00 pm" },
  { id: "2pm", startLabel: "2:00 pm", endLabel: "3:00 pm" },
  { id: "3pm", startLabel: "3:00 pm", endLabel: "4:00 pm" },
  { id: "4pm", startLabel: "4:00 pm", endLabel: "5:00 pm" },
  { id: "5pm", startLabel: "5:00 pm", endLabel: "6:00 pm" },
  { id: "6pm", startLabel: "6:00 pm", endLabel: "7:00 pm" },
  { id: "7pm", startLabel: "7:00 pm", endLabel: "8:00 pm" },
  { id: "8pm", startLabel: "8:00 pm", endLabel: "9:00 pm" },
  { id: "9pm", startLabel: "9:00 pm", endLabel: "10:00 pm" }
];

export function buildFacilitySlots(facilityId, dateKey, isToday) {
  const currentHour = new Date().getHours();

  return TIME_SLOTS.map((time, idx) => {
    const slotStartHour = 6 + idx;
    const slotEndHour = slotStartHour + 1;

    let status = "available";

    if (isToday) {
      if (currentHour >= slotEndHour) {
        status = "passed";
      } else {
        if (slotStartHour === 19 || slotStartHour === 20 || (idx + facilityId.length) % 4 === 0) {
          status = "booked";
        } else {
          status = "available";
        }
      }
    } else {
      if ((idx + facilityId.length) % 4 === 0) {
        status = "booked";
      } else {
        status = "available";
      }
    }

    return {
      ...time,
      status
    };
  });
}

export const MOCK_FACILITIES = [
  {
    id: "badminton-hall",
    name: "Badminton Hall",
    sport: "Badminton",
    rating: 4.9,
    location: "SAC Indoor Hall, First Floor",
    capacity: 8,
    slotDuration: "60-min slots",
    hours: "6:00–22:00",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop",
    description: "Four wooden indoor courts with anti-glare lighting inside the SAC hall.",
    rules: [
      "Indoor shoes compulsory",
      "Shuttles not provided",
      "Switch off lights after use"
    ]
  },
  {
    id: "basketball-court",
    name: "Basketball Court",
    sport: "Basketball",
    rating: 4.6,
    location: "Behind SAC Building",
    capacity: 12,
    slotDuration: "60-min slots",
    hours: "6:00–22:00",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop",
    description: "Outdoor full court with floodlights for evening play.",
    rules: [
      "No metal studs",
      "Report damaged nets to admin",
      "Switch off lights after use"
    ]
  },
  {
    id: "main-football-ground",
    name: "Main Football Ground",
    sport: "Football",
    rating: 4.7,
    location: "Sports Complex Central Field",
    capacity: 22,
    slotDuration: "90-min slots",
    hours: "6:00–21:00",
    image: "https://th.bing.com/th/id/OIP.PcS87Zvz1Szgur626VBMtAHaEK?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
    description: "Full-size turf ground with floodlights, used for matches and practice.",
    rules: [
      "Studs only, no bare cleats on turf",
      "No food or drink on turf",
      "Coordinate with team captain before booking"
    ]
  },
  {
    id: "sac-cricket-ground",
    name: "SAC Cricket Ground",
    sport: "Cricket",
    rating: 4.8,
    location: "Sports Complex, near Lohit Hostel",
    capacity: 22,
    slotDuration: "120-min slots",
    hours: "6:00–21:00",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop",
    description: "Full cricket ground with practice nets on the side.",
    rules: [
      "Book nets separately for practice",
      "No tennis-ball cricket on match days",
      "Roll the pitch cover back after use"
    ]
  },
  {
    id: "sac-gymnasium",
    name: "SAC Gymnasium",
    sport: "Gym",
    rating: 4.8,
    location: "SAC Ground Floor",
    capacity: 30,
    slotDuration: "60-min slots",
    hours: "5:00–22:00",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop",
    description: "Free weights, machines, and cardio equipment across two rooms.",
    rules: [
      "Gym attire and shoes required",
      "Wipe down equipment after use",
      "Re-rack weights"
    ]
  },
  {
    id: "squash-court",
    name: "Squash Court",
    sport: "Squash",
    rating: 4.5,
    location: "SAC Indoor Hall",
    capacity: 4,
    slotDuration: "60-min slots",
    hours: "6:00–22:00",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1200&auto=format&fit=crop",
    description: "Two glass-backed squash courts, racquets available on request.",
    rules: [
      "Non-marking shoes only",
      "Eye protection recommended",
      "Max 2 players per slot"
    ]
  },
  {
    id: "swimming-pool",
    name: "Swimming Pool",
    sport: "Swimming",
    rating: 4.6,
    location: "Aquatics Complex",
    capacity: 24,
    slotDuration: "60-min slots",
    hours: "6:00–20:00",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop",
    description: "Eight-lane outdoor pool, lifeguard on duty during all open slots.",
    rules: [
      "Shower before entering",
      "Swim cap mandatory",
      "No diving in shallow end"
    ]
  },
  {
    id: "table-tennis-room",
    name: "Table Tennis Room",
    sport: "Table Tennis",
    rating: 4.5,
    location: "SAC Indoor Hall, Ground Floor",
    capacity: 12,
    slotDuration: "60-min slots",
    hours: "6:00–22:00",
    image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=1200&auto=format&fit=crop",
    description: "Six tables in a climate-controlled room, paddles available at the counter.",
    rules: [
      "Bring your own paddle or borrow at counter",
      "Max 4 players per table",
      "Quiet hours after 9pm"
    ]
  },
  {
    id: "tennis-court",
    name: "Tennis Court",
    sport: "Tennis",
    rating: 4.7,
    location: "SAC Tennis Complex",
    capacity: 6,
    slotDuration: "60-min slots",
    hours: "6:00–22:00",
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop",
    description: "Two hard courts near the hostel wing, lit for night play.",
    rules: [
      "Non-marking shoes only",
      "Singles or doubles bookings allowed",
      "Return court to admin if unused after 10 min"
    ]
  },
  {
    id: "volleyball-court",
    name: "Volleyball Court",
    sport: "Volleyball",
    rating: 4.4,
    location: "Sports Complex, East Field",
    capacity: 12,
    slotDuration: "60-min slots",
    hours: "6:00–21:00",
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1200&auto=format&fit=crop",
    description: "Sand and hard-court volleyball setups side by side.",
    rules: [
      "Bare feet allowed on sand court only",
      "Nets must be re-tensioned after use",
      "No spikes on hard court"
    ]
  }
];
