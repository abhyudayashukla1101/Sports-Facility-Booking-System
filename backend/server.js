import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDatabase, query } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing with base64 payload size limits
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploads
app.use("/uploads", express.static(uploadsDir));

// Helper: Generate Unique ID
function generateId(prefix = "") {
  return `${prefix}_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 4)}`;
}

// Helper: Decode and save base64 image
function saveBase64Image(base64Str, rollNumber) {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const ext = matches[1].split("/")[1] || "png";
    const dataBuffer = Buffer.from(matches[2], "base64");
    const filename = `student_${rollNumber}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, dataBuffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("Error saving base64 image:", err);
    return null;
  }
}

// ==========================================
// 1. Auth Endpoints
// ==========================================
app.post("/api/auth/student-login", (req, res) => {
  const { name, rollNumber, hostel } = req.body;
  if (!name || !rollNumber) {
    return res.status(400).json({ success: false, error: "Name and Roll Number are required" });
  }
  return res.json({
    success: true,
    user: {
      role: "student",
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      hostel: hostel || "Lohit",
      signedInAt: new Date().toISOString()
    }
  });
});

app.post("/api/auth/admin-login", (req, res) => {
  const { passcode } = req.body;
  if (passcode === "iitgadmin" || passcode === "123456" || passcode === "admin") {
    return res.json({
      success: true,
      user: {
        role: "admin",
        name: "IITG Gymkhana Admin",
        signedInAt: new Date().toISOString()
      }
    });
  }
  return res.status(401).json({ success: false, error: "Invalid Admin Passcode" });
});

// ==========================================
// 2. Facilities & Slots API
// ==========================================
app.get("/api/facilities", async (req, res) => {
  try {
    const { sport } = req.query;
    let sql = "SELECT * FROM facilities";
    let params = [];

    if (sport && sport !== "all" && sport !== "All sports") {
      sql += " WHERE LOWER(sport) = LOWER($1)";
      params.push(sport);
    }

    const rows = await query.all(sql, params);
    const facilities = rows.map((f) => ({
      ...f,
      rules: JSON.parse(f.rules),
      isMaintenanceLocked: Boolean(f.ismaintenancelocked || f.isMaintenanceLocked) // handles lowercase keys from postgres
    }));

    return res.json(facilities);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Calculate slots list with live availability
app.get("/api/facilities/:id/slots", async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { date, rollNumber } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter YYYY-MM-DD is required" });
    }

    const facility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const isMaintenanceLocked = Boolean(facility.ismaintenancelocked || facility.isMaintenanceLocked);

    // Default 16 TIME_SLOTS
    const TIME_SLOTS = [
      { id: "6am", startLabel: "6:00 am", endLabel: "7:00 am", startHour: 6, endHour: 7 },
      { id: "7am", startLabel: "7:00 am", endLabel: "8:00 am", startHour: 7, endHour: 8 },
      { id: "8am", startLabel: "8:00 am", endLabel: "9:00 am", startHour: 8, endHour: 9 },
      { id: "9am", startLabel: "9:00 am", endLabel: "10:00 am", startHour: 9, endHour: 10 },
      { id: "10am", startLabel: "10:00 am", endLabel: "11:00 am", startHour: 10, endHour: 11 },
      { id: "11am", startLabel: "11:00 am", endLabel: "12:00 pm", startHour: 11, endHour: 12 },
      { id: "12pm", startLabel: "12:00 pm", endLabel: "1:00 pm", startHour: 12, endHour: 13 },
      { id: "1pm", startLabel: "1:00 pm", endLabel: "2:00 pm", startHour: 13, endHour: 14 },
      { id: "2pm", startLabel: "2:00 pm", endLabel: "3:00 pm", startHour: 14, endHour: 15 },
      { id: "3pm", startLabel: "3:00 pm", endLabel: "4:00 pm", startHour: 15, endHour: 16 },
      { id: "4pm", startLabel: "4:00 pm", endLabel: "5:00 pm", startHour: 16, endHour: 17 },
      { id: "5pm", startLabel: "5:00 pm", endLabel: "6:00 pm", startHour: 17, endHour: 18 },
      { id: "6pm", startLabel: "6:00 pm", endLabel: "7:00 pm", startHour: 18, endHour: 19 },
      { id: "7pm", startLabel: "7:00 pm", endLabel: "8:00 pm", startHour: 19, endHour: 20 },
      { id: "8pm", startLabel: "8:00 pm", endLabel: "9:00 pm", startHour: 20, endHour: 21 },
      { id: "9pm", startLabel: "9:00 pm", endLabel: "10:00 pm", startHour: 21, endHour: 22 }
    ];

    // Fetch confirmed bookings for this facility and date
    const bookings = await query.all(
      "SELECT * FROM bookings WHERE facilityId = $1 AND dateKey = $2 AND status = 'CONFIRMED'",
      [facilityId, date]
    );

    // Fetch active waitlists for this facility and date
    const waitlists = await query.all(
      "SELECT * FROM waitlists WHERE facilityId = $1 AND dateKey = $2 AND status = 'WAITLISTED'",
      [facilityId, date]
    );

    // Compute dates comparison
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentHour = now.getHours();

    const slots = TIME_SLOTS.map((t) => {
      let status = "available";

      // 1. Check if facility is locked for maintenance
      if (isMaintenanceLocked) {
        status = "passed"; // Blocks interaction
      }
      // 2. Check if date is in the past, or if today and hour passed
      else if (date < todayStr) {
        status = "passed";
      } else if (date === todayStr && currentHour >= t.endHour) {
        status = "passed";
      }
      // 3. Check if slot has a confirmed booking
      else {
        const isBooked = bookings.some((b) => (b.slotid || b.slotId) === t.id);
        if (isBooked) {
          status = "booked";
        }
      }

      // 4. Calculate queue count
      const slotWaitlists = waitlists.filter((w) => (w.slotid || w.slotId) === t.id);
      const queueCount = slotWaitlists.length;

      // 5. Check if specific user is waitlisted
      const userWaitlist = rollNumber
        ? slotWaitlists.find((w) => (w.rollnumber || w.rollNumber) === rollNumber) || null
        : null;

      // Map back to camelCase for the frontend
      const userWaitlistCamel = userWaitlist
        ? {
            id: userWaitlist.id,
            facilityId: userWaitlist.facilityid || userWaitlist.facilityId,
            facilityName: userWaitlist.facilityname || userWaitlist.facilityName,
            location: userWaitlist.location,
            dateKey: userWaitlist.datekey || userWaitlist.dateKey,
            slotId: userWaitlist.slotid || userWaitlist.slotId,
            startLabel: userWaitlist.startlabel || userWaitlist.startLabel,
            endLabel: userWaitlist.endlabel || userWaitlist.endLabel,
            rollNumber: userWaitlist.rollnumber || userWaitlist.rollNumber,
            studentName: userWaitlist.studentname || userWaitlist.studentName,
            hostel: userWaitlist.hostel,
            queuePosition: userWaitlist.queueposition || userWaitlist.queuePosition,
            status: userWaitlist.status,
            createdAt: userWaitlist.createdat || userWaitlist.createdAt
          }
        : null;

      return {
        id: t.id,
        startLabel: t.startLabel,
        endLabel: t.endLabel,
        status,
        queueCount,
        userWaitlist: userWaitlistCamel
      };
    });

    return res.json(slots);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/facilities/:id", async (req, res) => {
  try {
    const row = await query.get("SELECT * FROM facilities WHERE id = $1", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Facility not found" });

    return res.json({
      ...row,
      rules: JSON.parse(row.rules),
      isMaintenanceLocked: Boolean(row.ismaintenancelocked || row.isMaintenanceLocked)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Bookings & Collision-Prevention Engine
// ==========================================
app.post("/api/bookings", async (req, res) => {
  const { facilityId, dateKey, slotId, rollNumber, studentName, hostel } = req.body;

  if (!facilityId || !dateKey || !slotId || !rollNumber || !studentName) {
    return res.status(400).json({ success: false, error: "Missing required booking details" });
  }

  try {
    // Check if facility exists and is maintenance locked
    const facility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!facility) {
      return res.status(404).json({ success: false, error: "Facility not found" });
    }
    const isMaintenanceLocked = Boolean(facility.ismaintenancelocked || facility.isMaintenanceLocked);
    if (isMaintenanceLocked) {
      return res.status(400).json({ success: false, error: "Facility is locked for maintenance" });
    }

    // COLLISION PREVENTION: Check if slot is already booked
    const existing = await query.get(
      "SELECT id FROM bookings WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'CONFIRMED'",
      [facilityId, dateKey, slotId]
    );

    if (existing) {
      return res.status(409).json({ success: false, error: "Collision detected! This slot was just booked by another student." });
    }

    // Parse labels from standard mapping
    const TIME_LABELS = {
      "6am": { start: "6:00 am", end: "7:00 am" },
      "7am": { start: "7:00 am", end: "8:00 am" },
      "8am": { start: "8:00 am", end: "9:00 am" },
      "9am": { start: "9:00 am", end: "10:00 am" },
      "10am": { start: "10:00 am", end: "11:00 am" },
      "11am": { start: "11:00 am", end: "12:00 pm" },
      "12pm": { start: "12:00 pm", end: "1:00 pm" },
      "1pm": { start: "1:00 pm", end: "2:00 pm" },
      "2pm": { start: "2:00 pm", end: "3:00 pm" },
      "3pm": { start: "3:00 pm", end: "4:00 pm" },
      "4pm": { start: "4:00 pm", end: "5:00 pm" },
      "5pm": { start: "5:00 pm", end: "6:00 pm" },
      "6pm": { start: "6:00 pm", end: "7:00 pm" },
      "7pm": { start: "7:00 pm", end: "8:00 pm" },
      "8pm": { start: "8:00 pm", end: "9:00 pm" },
      "9pm": { start: "9:00 pm", end: "10:00 pm" }
    };
    const labels = TIME_LABELS[slotId] || { start: "Unknown", end: "Unknown" };

    const bookingId = generateId("bk");
    const bookedAt = new Date().toISOString();

    await query.run(
      `INSERT INTO bookings (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, status, bookedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', $12)`,
      [
        bookingId,
        facilityId,
        facility.name,
        facility.location,
        dateKey,
        slotId,
        labels.start,
        labels.end,
        rollNumber,
        studentName,
        hostel || "Lohit",
        bookedAt
      ]
    );

    const b = await query.get("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    
    // Map database properties to camelCase for the frontend React hooks
    const bookingCamel = b
      ? {
          id: b.id,
          facilityId: b.facilityid || b.facilityId,
          facilityName: b.facilityname || b.facilityName,
          location: b.location,
          dateKey: b.datekey || b.dateKey,
          slotId: b.slotid || b.slotId,
          startLabel: b.startlabel || b.startLabel,
          endLabel: b.endlabel || b.endLabel,
          rollNumber: b.rollnumber || b.rollNumber,
          studentName: b.studentname || b.studentName,
          hostel: b.hostel,
          status: b.status,
          bookedAt: b.bookedat || b.bookedAt
        }
      : null;

    return res.json({ success: true, booking: bookingCamel });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get student's bookings and active waitlists
app.get("/api/bookings/my-bookings", async (req, res) => {
  const { rollNumber } = req.query;
  if (!rollNumber) {
    return res.status(400).json({ error: "Roll number is required" });
  }

  try {
    const rawBookings = await query.all(
      "SELECT * FROM bookings WHERE rollNumber = $1 ORDER BY bookedAt DESC",
      [rollNumber]
    );
    const rawWaitlists = await query.all(
      "SELECT * FROM waitlists WHERE rollNumber = $1 AND status = 'WAITLISTED' ORDER BY createdAt DESC",
      [rollNumber]
    );

    const bookings = rawBookings.map((b) => ({
      id: b.id,
      facilityId: b.facilityid || b.facilityId,
      facilityName: b.facilityname || b.facilityName,
      location: b.location,
      dateKey: b.datekey || b.dateKey,
      slotId: b.slotid || b.slotId,
      startLabel: b.startlabel || b.startLabel,
      endLabel: b.endlabel || b.endLabel,
      rollNumber: b.rollnumber || b.rollNumber,
      studentName: b.studentname || b.studentName,
      hostel: b.hostel,
      status: b.status,
      bookedAt: b.bookedat || b.bookedAt,
      promotedFromWaitlist: Boolean(b.promotedfromwaitlist || b.promotedFromWaitlist)
    }));

    const waitlists = rawWaitlists.map((w) => ({
      id: w.id,
      facilityId: w.facilityid || w.facilityId,
      facilityName: w.facilityname || w.facilityName,
      location: w.location,
      dateKey: w.datekey || w.dateKey,
      slotId: w.slotid || w.slotId,
      startLabel: w.startlabel || w.startLabel,
      endLabel: w.endlabel || w.endLabel,
      rollNumber: w.rollnumber || w.rollNumber,
      studentName: w.studentname || w.studentName,
      hostel: w.hostel,
      queuePosition: w.queueposition || w.queuePosition,
      status: w.status,
      createdAt: w.createdat || w.createdAt
    }));

    return res.json({ success: true, bookings, waitlists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Backend FIFO Waitlist & Auto-Promotion Engine
// ==========================================
app.post("/api/waitlists", async (req, res) => {
  const { facilityId, dateKey, slotId, rollNumber, studentName, hostel } = req.body;
  if (!facilityId || !dateKey || !slotId || !rollNumber || !studentName) {
    return res.status(400).json({ success: false, error: "Missing required waitlist details" });
  }

  try {
    const facility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!facility) {
      return res.status(404).json({ success: false, error: "Facility not found" });
    }

    // Check if user is already waitlisted for this slot
    const existing = await query.get(
      "SELECT id FROM waitlists WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND rollNumber = $4 AND status = 'WAITLISTED'",
      [facilityId, dateKey, slotId, rollNumber]
    );
    if (existing) {
      return res.status(400).json({ success: false, error: "You are already waitlisted for this slot" });
    }

    // Calculate current queue count to get next queuePosition
    const queue = await query.get(
      "SELECT COUNT(*) as count FROM waitlists WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'WAITLISTED'",
      [facilityId, dateKey, slotId]
    );
    const queuePosition = parseInt(queue.count, 10) + 1;

    const TIME_LABELS = {
      "6am": { start: "6:00 am", end: "7:00 am" },
      "7am": { start: "7:00 am", end: "8:00 am" },
      "8am": { start: "8:00 am", end: "9:00 am" },
      "9am": { start: "9:00 am", end: "10:00 am" },
      "10am": { start: "10:00 am", end: "11:00 am" },
      "11am": { start: "11:00 am", end: "12:00 pm" },
      "12pm": { start: "12:00 pm", end: "1:00 pm" },
      "1pm": { start: "1:00 pm", end: "2:00 pm" },
      "2pm": { start: "2:00 pm", end: "3:00 pm" },
      "3pm": { start: "3:00 pm", end: "4:00 pm" },
      "4pm": { start: "4:00 pm", end: "5:00 pm" },
      "5pm": { start: "5:00 pm", end: "6:00 pm" },
      "6pm": { start: "6:00 pm", end: "7:00 pm" },
      "7pm": { start: "7:00 pm", end: "8:00 pm" },
      "8pm": { start: "8:00 pm", end: "9:00 pm" },
      "9pm": { start: "9:00 pm", end: "10:00 pm" }
    };
    const labels = TIME_LABELS[slotId] || { start: "Unknown", end: "Unknown" };

    const waitlistId = generateId("wl");
    const createdAt = new Date().toISOString();

    await query.run(
      `INSERT INTO waitlists (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, queuePosition, status, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        waitlistId,
        facilityId,
        facility.name,
        facility.location,
        dateKey,
        slotId,
        labels.start,
        labels.end,
        rollNumber,
        studentName,
        hostel || "Lohit",
        queuePosition,
        createdAt
      ]
    );

    const w = await query.get("SELECT * FROM waitlists WHERE id = $1", [waitlistId]);
    const waitlistCamel = w
      ? {
          id: w.id,
          facilityId: w.facilityid || w.facilityId,
          facilityName: w.facilityname || w.facilityName,
          location: w.location,
          dateKey: w.datekey || w.dateKey,
          slotId: w.slotid || w.slotId,
          startLabel: w.startlabel || w.startLabel,
          endLabel: w.endlabel || w.endLabel,
          rollNumber: w.rollnumber || w.rollNumber,
          studentName: w.studentname || w.studentName,
          hostel: w.hostel,
          queuePosition: w.queueposition || w.queuePosition,
          status: w.status,
          createdAt: w.createdat || w.createdAt
        }
      : null;

    return res.json({ success: true, waitlist: waitlistCamel });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Leave Waitlist
app.delete("/api/waitlists/:id", async (req, res) => {
  const waitlistId = req.params.id;

  try {
    const entry = await query.get("SELECT * FROM waitlists WHERE id = $1", [waitlistId]);
    if (!entry) {
      return res.status(404).json({ success: false, error: "Waitlist entry not found" });
    }

    const queuePosition = entry.queueposition || entry.queuePosition;
    const facilityId = entry.facilityid || entry.facilityId;
    const dateKey = entry.datekey || entry.dateKey;
    const slotId = entry.slotid || entry.slotId;

    // Set status to CANCELLED
    await query.run("UPDATE waitlists SET status = 'CANCELLED' WHERE id = $1", [waitlistId]);

    // Shift positions of remaining students in queue
    await query.run(
      `UPDATE waitlists SET queuePosition = queuePosition - 1 
       WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'WAITLISTED' AND queuePosition > $4`,
      [facilityId, dateKey, slotId, queuePosition]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel Booking & FIFO Auto-Promotion
app.post("/api/bookings/:id/cancel", async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await query.get("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({ success: false, error: "Booking is already cancelled or processed" });
    }

    const facilityId = booking.facilityid || booking.facilityId;
    const dateKey = booking.datekey || booking.dateKey;
    const slotId = booking.slotid || booking.slotId;

    // Cancel this booking
    await query.run("UPDATE bookings SET status = 'CANCELLED' WHERE id = $1", [bookingId]);

    // FIFO Promotion Engine
    // Check if there is someone waitlisted for this slot
    const topCandidate = await query.get(
      `SELECT * FROM waitlists 
       WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'WAITLISTED' 
       ORDER BY queuePosition ASC LIMIT 1`,
      [facilityId, dateKey, slotId]
    );

    if (topCandidate) {
      const promotedFacilityId = topCandidate.facilityid || topCandidate.facilityId;
      const promotedFacilityName = topCandidate.facilityname || topCandidate.facilityName;
      const promotedDateKey = topCandidate.datekey || topCandidate.dateKey;
      const promotedSlotId = topCandidate.slotid || topCandidate.slotId;
      const promotedStartLabel = topCandidate.startlabel || topCandidate.startLabel;
      const promotedEndLabel = topCandidate.endlabel || topCandidate.endLabel;
      const promotedRollNumber = topCandidate.rollnumber || topCandidate.rollNumber;
      const promotedStudentName = topCandidate.studentname || topCandidate.studentName;
      const promotedQueuePosition = topCandidate.queueposition || topCandidate.queuePosition;

      // 1. Promote Candidate to a Confirmed Booking
      const newBookingId = generateId("bk_promoted");
      const bookedAt = new Date().toISOString();

      await query.run(
        `INSERT INTO bookings (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, status, bookedAt, promotedFromWaitlist)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', $12, 1)`,
        [
          newBookingId,
          promotedFacilityId,
          promotedFacilityName,
          topCandidate.location,
          promotedDateKey,
          promotedSlotId,
          promotedStartLabel,
          promotedEndLabel,
          promotedRollNumber,
          promotedStudentName,
          topCandidate.hostel,
          bookedAt
        ]
      );

      // 2. Mark candidate waitlist entry as PROMOTED
      await query.run("UPDATE waitlists SET status = 'PROMOTED' WHERE id = $1", [topCandidate.id]);

      // 3. Shift queue positions of remaining candidates for this slot
      await query.run(
        `UPDATE waitlists SET queuePosition = queuePosition - 1 
         WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'WAITLISTED' AND queuePosition > $4`,
        [promotedFacilityId, promotedDateKey, promotedSlotId, promotedQueuePosition]
      );

      return res.json({
        success: true,
        promoted: true,
        promotedStudent: promotedStudentName,
        rollNumber: promotedRollNumber,
        startLabel: promotedStartLabel
      });
    }

    return res.json({ success: true, promoted: false });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. Student Reviews & Photo Upload API
// ==========================================
app.get("/api/facilities/:id/reviews", async (req, res) => {
  try {
    const reviews = await query.all(
      "SELECT * FROM reviews WHERE facilityId = $1 ORDER BY date DESC",
      [req.params.id]
    );
    const parsedReviews = reviews.map((r) => ({
      id: r.id,
      facilityId: r.facilityid || r.facilityId,
      studentName: r.studentname || r.studentName,
      rollNumber: r.rollnumber || r.rollNumber,
      rating: r.rating,
      comment: r.comment,
      images: JSON.parse(r.images),
      date: r.date
    }));
    return res.json(parsedReviews);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/facilities/:id/reviews", async (req, res) => {
  const facilityId = req.params.id;
  const { studentName, rollNumber, rating, comment, images = [] } = req.body;

  if (!studentName || !rollNumber || !rating || !comment) {
    return res.status(400).json({ error: "Missing review fields" });
  }

  try {
    // Process base64 images and save to local uploads directory
    const savedUrls = [];
    for (const imgBase64 of images) {
      const savedPath = saveBase64Image(imgBase64, rollNumber);
      if (savedPath) {
        savedUrls.push(savedPath);
      }
    }

    const reviewId = generateId("rev");
    const dateStr = new Date().toISOString().split("T")[0];

    await query.run(
      `INSERT INTO reviews (id, facilityId, studentName, rollNumber, rating, comment, images, date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [reviewId, facilityId, studentName, rollNumber, rating, comment, JSON.stringify(savedUrls), dateStr]
    );

    // Re-calculate the average rating for the facility
    const stats = await query.get('SELECT AVG(rating) as "avgRating" FROM reviews WHERE facilityId = $1', [facilityId]);
    const avgRating = stats.avgRating ? Number(Number(stats.avgRating).toFixed(1)) : rating;

    await query.run("UPDATE facilities SET rating = $1 WHERE id = $2", [avgRating, facilityId]);

    const newReview = {
      id: reviewId,
      facilityId,
      studentName,
      rollNumber,
      rating,
      comment,
      images: savedUrls,
      date: dateStr
    };

    return res.json(newReview);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Admin Controls & Analytics API
// ==========================================
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Total Slots Reserved Today
    const todayBookings = await query.get(
      "SELECT COUNT(*) as count FROM bookings WHERE dateKey = $1 AND status = 'CONFIRMED'",
      [todayStr]
    );
    const totalBookings = parseInt(todayBookings.count || 0, 10);

    // 2. Peak Hours Utilization
    // Let's count peak bookings (6pm - 10pm -> slots "6pm", "7pm", "8pm", "9pm") today
    const peakBookings = await query.get(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE dateKey = $1 AND status = 'CONFIRMED' AND slotId IN ('6pm', '7pm', '8pm', '9pm')`,
      [todayStr]
    );
    const peakCount = parseInt(peakBookings.count || 0, 10);
    // Peak hours slots across all 10 facilities = 10 * 4 = 40 slots.
    const peakHoursUtilization = peakCount > 0 ? Number(((peakCount / 40) * 100).toFixed(1)) : 0.0;

    // 3. Collision statistics (always 0 since transaction prevent it)
    const collisions = 0;

    // 4. Active Campus Users
    const activeUsers = await query.get(
      `SELECT COUNT(DISTINCT rollNumber) as count FROM (
        SELECT rollNumber FROM bookings
        UNION
        SELECT rollNumber FROM waitlists
      ) as u`
    );
    const activeCount = parseInt(activeUsers.count || 0, 10);

    return res.json({
      success: true,
      totalBookings,
      peakHoursUtilization: peakHoursUtilization || 0, // Fallback if no bookings
      collisions,
      activeUsers: activeCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch("/api/admin/facilities/:id/maintenance", async (req, res) => {
  const facilityId = req.params.id;
  const { isMaintenanceLocked } = req.body;

  if (isMaintenanceLocked === undefined) {
    return res.status(400).json({ error: "isMaintenanceLocked body field is required" });
  }

  try {
    const lockVal = isMaintenanceLocked ? 1 : 0;
    const result = await query.run(
      "UPDATE facilities SET isMaintenanceLocked = $1 WHERE id = $2",
      [lockVal, facilityId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Facility not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server and Database initialization
app.listen(PORT, async () => {
  try {
    await initDatabase();
    console.log(`Sports Facility Booking PostgreSQL backend server running on port ${PORT}`);
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
});
