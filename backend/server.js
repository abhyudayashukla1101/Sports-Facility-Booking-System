import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDatabase, query } from "./database.js";
import { dispatchNotification, handleWhatsAppWebhook } from "./services/twilioService.js";
import { generateGroqAnalyticsInsights } from "./services/groqService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing with base64 payload size limits
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploads and images
app.use("/uploads", express.static(uploadsDir));
app.use("/images", express.static(path.join(__dirname, "public", "images")));

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
app.post("/api/auth/student-login", async (req, res) => {
  const { name, rollNumber, hostel } = req.body;
  if (!name || !rollNumber) {
    return res.status(400).json({ success: false, error: "Name and Roll Number are required" });
  }

  const trimmedRoll = rollNumber.trim();
  const trimmedName = name.trim();

  try {
    const existingUser = await query.get("SELECT * FROM users WHERE LOWER(rollNumber) = LOWER($1)", [trimmedRoll]);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: `No registered account found for Roll Number '${trimmedRoll}'. Please click 'Create an account' to register first.`
      });
    }

    const registeredName = existingUser.name || existingUser.studentName;
    if (registeredName && registeredName.toLowerCase() !== trimmedName.toLowerCase()) {
      return res.status(409).json({
        success: false,
        error: `Roll Number '${trimmedRoll}' is registered to student '${registeredName}'. Please enter your registered account name.`
      });
    }

    return res.json({
      success: true,
      user: {
        role: "student",
        name: existingUser.name,
        rollNumber: existingUser.rollnumber || existingUser.rollNumber,
        hostel: existingUser.hostel || hostel || "Lohit",
        phone: existingUser.phone,
        signedInAt: new Date().toISOString()
      }
    });
  } catch (dbErr) {
    return res.status(500).json({ success: false, error: dbErr.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, rollNumber, hostel, phone, passcode } = req.body;
  if (!name || !rollNumber || !hostel) {
    return res.status(400).json({ success: false, error: "Name, Roll Number, and Hostel are required" });
  }

  try {
    const existing = await query.get("SELECT rollNumber FROM users WHERE rollNumber = $1", [rollNumber.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this Roll Number already exists. Please sign in." });
    }

    const createdAt = new Date().toISOString();
    await query.run(
      `INSERT INTO users (rollNumber, name, hostel, phone, passcode, role, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        rollNumber.trim(),
        name.trim(),
        hostel,
        phone || null,
        passcode || "student123",
        "student",
        createdAt
      ]
    );

    return res.json({
      success: true,
      user: {
        role: "student",
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        hostel,
        phone: phone || null,
        signedInAt: createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
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

    // Fetch maintenance windows for this facility and date
    const allWindows = await query.all(
      "SELECT * FROM maintenance_windows WHERE facilityId = $1",
      [facilityId]
    );

    const activeWindows = allWindows.filter((w) => {
      const sDate = w.startdate || w.startDate;
      const eDate = w.enddate || w.endDate;
      return sDate <= date && eDate >= date;
    });

    // Compute dates comparison
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentHour = now.getHours();

    const slots = TIME_SLOTS.map((t) => {
      let status = "available";
      let maintenanceReason = null;

      // 1. Check if facility is locked for maintenance or falls in a maintenance window
      const matchedWindow = activeWindows.find((w) => {
        const slotsList = JSON.parse(w.slotids || w.slotIds || "[]");
        return slotsList.includes("all") || slotsList.includes(t.id);
      });

      if (isMaintenanceLocked || matchedWindow) {
        status = "maintenance";
        maintenanceReason = isMaintenanceLocked
          ? "Facility locked for maintenance by Gymkhana Admin"
          : matchedWindow.reason;
      }
      // 2. Check if date is in the past, or if today and hour passed
      else if (date < todayStr) {
        status = "passed";
      } else if (date === todayStr && currentHour >= t.endHour) {
        status = "passed";
      }
      // 3. Check if slot has a confirmed booking
      const slotBooking = bookings.find((b) => (b.slotid || b.slotId) === t.id) || null;
      if (slotBooking && !isMaintenanceLocked && date >= todayStr) {
        status = "booked";
      }

      // 4. Calculate queue count
      const slotWaitlists = waitlists.filter((w) => (w.slotid || w.slotId) === t.id);
      const queueCount = slotWaitlists.length;

      // 5. Check if specific user is waitlisted or booked
      const userWaitlist = rollNumber
        ? slotWaitlists.find((w) => (w.rollnumber || w.rollNumber) === rollNumber) || null
        : null;

      const userBooking = (rollNumber && slotBooking && ((slotBooking.rollnumber || slotBooking.rollNumber) === rollNumber))
        ? {
            id: slotBooking.id,
            facilityId: slotBooking.facilityid || slotBooking.facilityId,
            dateKey: slotBooking.datekey || slotBooking.dateKey,
            slotId: slotBooking.slotid || slotBooking.slotId,
            rollNumber: slotBooking.rollnumber || slotBooking.rollNumber
          }
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
        maintenanceReason,
        closureEndDate: matchedWindow ? (matchedWindow.enddate || matchedWindow.endDate) : null,
        queueCount,
        userWaitlist: userWaitlistCamel,
        userBooking
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
// Smart Allocation Recommendation Engine
// ==========================================
app.get("/api/recommendations", async (req, res) => {
  const { facilityId, dateKey, slotId } = req.query;
  if (!facilityId || !dateKey || !slotId) {
    return res.status(400).json({ success: false, error: "facilityId, dateKey, and slotId are required" });
  }

  try {
    const targetFacility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!targetFacility) {
      return res.status(404).json({ success: false, error: "Facility not found" });
    }

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

    const targetSlotObj = TIME_SLOTS.find((s) => s.id === slotId) || TIME_SLOTS[0];
    const targetHour = targetSlotObj.startHour;

    const recommendations = [];

    // Helper: Check if slot is available for given facility & date
    const isSlotAvailable = async (facId, dKey, sId) => {
      const fac = await query.get("SELECT * FROM facilities WHERE id = $1", [facId]);
      if (!fac || fac.ismaintenancelocked || fac.isMaintenanceLocked) return false;

      // Check maintenance windows
      const windows = await query.all("SELECT * FROM maintenance_windows WHERE facilityId = $1", [facId]);
      const isWindowLocked = windows.some((w) => {
        const sD = w.startdate || w.startDate;
        const eD = w.enddate || w.endDate;
        const sList = JSON.parse(w.slotids || w.slotIds || "[]");
        return sD <= dKey && eD >= dKey && (sList.includes("all") || sList.includes(sId));
      });
      if (isWindowLocked) return false;

      // Check existing confirmed booking
      const booking = await query.get(
        "SELECT id FROM bookings WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'CONFIRMED'",
        [facId, dKey, sId]
      );
      return !booking;
    };

    // 1. ADJACENT TIME SLOTS (Same facility & date)
    const otherSlots = TIME_SLOTS.filter((s) => s.id !== slotId).sort(
      (a, b) => Math.abs(a.startHour - targetHour) - Math.abs(b.startHour - targetHour)
    );

    for (const slotCandidate of otherSlots) {
      if (recommendations.length >= 2) break;
      const available = await isSlotAvailable(facilityId, dateKey, slotCandidate.id);
      if (available) {
        const hourDiff = Math.abs(slotCandidate.startHour - targetHour);
        const direction = slotCandidate.startHour < targetHour ? "earlier" : "later";
        recommendations.push({
          id: `rec_adj_${slotCandidate.id}`,
          type: "ADJACENT_SLOT",
          facilityId,
          facilityName: targetFacility.name,
          sport: targetFacility.sport,
          location: targetFacility.location,
          dateKey,
          slotId: slotCandidate.id,
          startLabel: slotCandidate.startLabel,
          endLabel: slotCandidate.endLabel,
          matchScore: "95%",
          reason: `${hourDiff}h ${direction} on ${targetFacility.name}`,
          badgeText: `${hourDiff}h ${direction}`
        });
      }
    }

    // 2. ALTERNATIVE FACILITIES (Same sport / nearby grounds on same date & time)
    const otherFacilities = await query.all(
      "SELECT * FROM facilities WHERE id != $1 AND (LOWER(sport) = LOWER($2) OR LOWER(location) LIKE LOWER($3))",
      [facilityId, targetFacility.sport, `%${targetFacility.location.split(',')[0]}%`]
    );

    for (const altFac of otherFacilities) {
      if (recommendations.length >= 4) break;
      const available = await isSlotAvailable(altFac.id, dateKey, slotId);
      if (available) {
        recommendations.push({
          id: `rec_fac_${altFac.id}_${slotId}`,
          type: "ALTERNATIVE_FACILITY",
          facilityId: altFac.id,
          facilityName: altFac.name,
          sport: altFac.sport,
          location: altFac.location,
          dateKey,
          slotId,
          startLabel: targetSlotObj.startLabel,
          endLabel: targetSlotObj.endLabel,
          matchScore: "90%",
          reason: `Same ${targetSlotObj.startLabel} slot at ${altFac.name}`,
          badgeText: `Alt Ground`
        });
      }
    }

    // 3. UPCOMING DATES (Same facility & time slot tomorrow/day after)
    const currDateObj = new Date(dateKey);
    for (let offset = 1; offset <= 3; offset++) {
      if (recommendations.length >= 5) break;
      const nextDate = new Date(currDateObj);
      nextDate.setDate(nextDate.getDate() + offset);
      const nextDateKey = nextDate.toISOString().split("T")[0];

      const available = await isSlotAvailable(facilityId, nextDateKey, slotId);
      if (available) {
        recommendations.push({
          id: `rec_date_${nextDateKey}_${slotId}`,
          type: "UPCOMING_DATE",
          facilityId,
          facilityName: targetFacility.name,
          sport: targetFacility.sport,
          location: targetFacility.location,
          dateKey: nextDateKey,
          slotId,
          startLabel: targetSlotObj.startLabel,
          endLabel: targetSlotObj.endLabel,
          matchScore: "85%",
          reason: `Same ${targetSlotObj.startLabel} slot on ${nextDateKey}`,
          badgeText: offset === 1 ? "Tomorrow" : `In ${offset} days`
        });
      }
    }

    return res.json({
      success: true,
      requested: {
        facilityId,
        facilityName: targetFacility.name,
        dateKey,
        slotId,
        startLabel: targetSlotObj.startLabel
      },
      recommendations
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
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
        }
      : null;

    // Dispatch confirmation notification
    dispatchNotification({
      rollNumber,
      title: "Slot Reserved! 🎾",
      message: `Your booking for ${facility.name} on ${dateKey} (${labels.start} – ${labels.end}) is CONFIRMED. Ref: ${bookingId}`,
      type: "CONFIRMATION"
    });

    return res.json({ success: true, booking: bookingCamel });
  } catch (err) {
    if (err.message && (err.message.includes("UNIQUE") || err.message.includes("constraint") || err.code === "23505")) {
      return res.status(409).json({ success: false, error: "Collision detected! This slot was just booked by another student." });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get student's bookings and active waitlists
app.get("/api/bookings/my-bookings", async (req, res) => {
  const { rollNumber, studentName } = req.query;
  if (!rollNumber) {
    return res.status(400).json({ error: "Roll number is required" });
  }

  const trimmedRoll = rollNumber.trim();
  const trimmedName = studentName ? studentName.trim() : null;

  try {
    let sqlBookings = "SELECT * FROM bookings WHERE LOWER(rollNumber) = LOWER($1)";
    let sqlWaitlists = "SELECT * FROM waitlists WHERE LOWER(rollNumber) = LOWER($1) AND status = 'WAITLISTED'";
    const params = [trimmedRoll];

    if (trimmedName) {
      sqlBookings += " AND LOWER(studentName) = LOWER($2)";
      sqlWaitlists += " AND LOWER(studentName) = LOWER($2)";
      params.push(trimmedName);
    }

    sqlBookings += " ORDER BY bookedAt DESC";
    sqlWaitlists += " ORDER BY createdAt DESC";

    const rawBookings = await query.all(sqlBookings, params);
    const rawWaitlists = await query.all(sqlWaitlists, params);

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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
        "WAITLISTED",
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
        }
      : null;

    dispatchNotification({
      rollNumber,
      title: `Joined Waitlist (Position #${queuePosition}) ⏳`,
      message: `You are in line at position #${queuePosition} for ${facility.name} on ${dateKey} (${labels.start}).`,
      type: "WAITLIST"
    });

    return res.json({ success: true, waitlist: waitlistCamel, entry: waitlistCamel });
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

      // Dispatch promotion notification to promoted candidate
      dispatchNotification({
        rollNumber: promotedRollNumber,
        title: "Waitlist Auto-Promoted! ⚡",
        message: `Great news! Your waitlist position #1 for ${promotedFacilityName} on ${promotedDateKey} (${promotedStartLabel}) has been auto-promoted to a Confirmed Booking!`,
        type: "PROMOTION"
      });

      // Dispatch cancellation notification to original user
      dispatchNotification({
        rollNumber: booking.rollnumber || booking.rollNumber,
        title: "Booking Cancelled",
        message: `Your reservation for ${booking.facilityname || booking.facilityName} on ${dateKey} (${booking.startlabel || booking.startLabel}) has been cancelled.`,
        type: "CANCELLATION"
      });

      return res.json({
        success: true,
        promoted: true,
        promotedStudent: promotedStudentName,
        rollNumber: promotedRollNumber,
        startLabel: promotedStartLabel
      });
    }

    // Dispatch cancellation notification to original user (no waitlist candidate)
    dispatchNotification({
      rollNumber: booking.rollnumber || booking.rollNumber,
      title: "Booking Cancelled",
      message: `Your reservation for ${booking.facilityname || booking.facilityName} on ${dateKey} (${booking.startlabel || booking.startLabel}) has been cancelled.`,
      type: "CANCELLATION"
    });

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
    const todayBookingsRow = await query.get(
      "SELECT COUNT(*) as count FROM bookings WHERE dateKey = $1 AND status = 'CONFIRMED'",
      [todayStr]
    );
    const totalBookings = parseInt(todayBookingsRow ? todayBookingsRow.count : 0, 10);

    // 2. Active Campus Users
    const activeUsersRow = await query.get(
      `SELECT COUNT(DISTINCT rollNumber) as count FROM (
        SELECT rollNumber FROM bookings
        UNION
        SELECT rollNumber FROM waitlists
      ) as u`
    );
    const activeCount = parseInt(activeUsersRow ? activeUsersRow.count : 0, 10);

    // 3. Hourly Peak Hours Distribution (6am to 9pm)
    const TIME_SLOTS_LIST = [
      { id: "6am", label: "6:00 AM" },
      { id: "7am", label: "7:00 AM" },
      { id: "8am", label: "8:00 AM" },
      { id: "9am", label: "9:00 AM" },
      { id: "10am", label: "10:00 AM" },
      { id: "11am", label: "11:00 AM" },
      { id: "12pm", label: "12:00 PM" },
      { id: "1pm", label: "1:00 PM" },
      { id: "2pm", label: "2:00 PM" },
      { id: "3pm", label: "3:00 PM" },
      { id: "4pm", label: "4:00 PM" },
      { id: "5pm", label: "5:00 PM" },
      { id: "6pm", label: "6:00 PM" },
      { id: "7pm", label: "7:00 PM" },
      { id: "8pm", label: "8:00 PM" },
      { id: "9pm", label: "9:00 PM" }
    ];

    const slotCounts = await query.all(
      `SELECT slotId, COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED' GROUP BY slotId`
    );

    const slotMap = {};
    slotCounts.forEach((r) => {
      slotMap[r.slotid || r.slotId] = parseInt(r.count, 10);
    });

    const maxSlotCount = Math.max(...Object.values(slotMap), 1);

    const peakHoursDistribution = TIME_SLOTS_LIST.map((slot) => {
      const count = slotMap[slot.id] || 0;
      return {
        slotId: slot.id,
        label: slot.label,
        count,
        percent: Number(((count / maxSlotCount) * 100).toFixed(0))
      };
    });

    // 4. Facility Utilization per Ground / Sport
    const facilitiesList = await query.all("SELECT id, name, sport FROM facilities");
    const facilityCounts = await query.all(
      `SELECT facilityId, COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED' GROUP BY facilityId`
    );
    const facilityMap = {};
    facilityCounts.forEach((r) => {
      facilityMap[r.facilityid || r.facilityId] = parseInt(r.count, 10);
    });

    const facilityUtilization = facilitiesList.map((f) => {
      const bCount = facilityMap[f.id] || 0;
      // 16 slots per day available capacity
      const utilizationRate = Math.min(100, Number(((bCount / 16) * 100).toFixed(1)));
      return {
        id: f.id,
        name: f.name,
        sport: f.sport,
        bookedCount: bCount,
        utilizationRate
      };
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);

    // 5. No-Show & Attendance Metrics
    const attendanceRows = await query.all(
      `SELECT attendanceStatus, COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED' GROUP BY attendanceStatus`
    );

    let attended = 0;
    let noShow = 0;
    let pending = 0;

    attendanceRows.forEach((r) => {
      const status = (r.attendancestatus || r.attendanceStatus || "PENDING").toUpperCase();
      const c = parseInt(r.count, 10);
      if (status === "ATTENDED") attended += c;
      else if (status === "NO_SHOW") noShow += c;
      else pending += c;
    });

    const totalProcessedAttendance = attended + noShow;
    const noShowRate = totalProcessedAttendance > 0
      ? Number(((noShow / totalProcessedAttendance) * 100).toFixed(1))
      : 0.0;

    const overallUtilizationRate = facilityUtilization.length > 0
      ? Number((facilityUtilization.reduce((acc, curr) => acc + curr.utilizationRate, 0) / facilityUtilization.length).toFixed(1))
      : 0.0;

    // Peak hour label
    const peakSlot = [...peakHoursDistribution].sort((a, b) => b.count - a.count)[0];
    const peakHourLabel = peakSlot ? `${peakSlot.label} (${peakSlot.count} bookings)` : "6:00 PM - 9:00 PM";
    const topDemandedFacility = facilityUtilization[0]?.name || "Badminton Hall";

    // 6. Groq AI Executive Insights Generation
    const aiInsights = await generateGroqAnalyticsInsights({
      totalBookings,
      overallUtilizationRate,
      peakHourLabel,
      noShowRate,
      topDemandedFacility
    });

    // 7. Fetch Today's Bookings for Ground Staff Check-In
    const todaysBookingsRaw = await query.all(
      `SELECT * FROM bookings WHERE dateKey = $1 AND status = 'CONFIRMED' ORDER BY slotId ASC`,
      [todayStr]
    );

    const todaysBookings = todaysBookingsRaw.map((b) => ({
      id: b.id,
      facilityId: b.facilityid || b.facilityId,
      facilityName: b.facilityname || b.facilityName,
      dateKey: b.datekey || b.dateKey,
      slotId: b.slotid || b.slotId,
      startLabel: b.startlabel || b.startLabel,
      endLabel: b.endlabel || b.endLabel,
      studentName: b.studentname || b.studentName,
      rollNumber: b.rollnumber || b.rollNumber,
      attendanceStatus: b.attendancestatus || b.attendanceStatus || "PENDING"
    }));

    return res.json({
      success: true,
      totalBookings,
      overallUtilizationRate,
      activeUsers: activeCount,
      collisions: 0,
      peakHoursDistribution,
      facilityUtilization,
      noShowStats: {
        attended,
        noShow,
        pending,
        noShowRate
      },
      aiInsights,
      todaysBookings
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Update Booking Attendance (Mark Attended / Mark No-Show)
app.patch("/api/admin/bookings/:id/attendance", async (req, res) => {
  const bookingId = req.params.id;
  const { attendanceStatus } = req.body; // 'ATTENDED' | 'NO_SHOW' | 'PENDING'

  if (!attendanceStatus || !["ATTENDED", "NO_SHOW", "PENDING"].includes(attendanceStatus)) {
    return res.status(400).json({ success: false, error: "Valid attendanceStatus is required" });
  }

  try {
    await query.run(
      "UPDATE bookings SET attendanceStatus = $1 WHERE id = $2",
      [attendanceStatus, bookingId]
    );
    return res.json({ success: true, bookingId, attendanceStatus });
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

    try {
      const facility = await query.get("SELECT name FROM facilities WHERE id = $1", [facilityId]);
      const facilityName = facility ? facility.name : "Sports Facility";

      // Query all registered campus student accounts across users, bookings, and waitlists
      const allUsers = await query.all(`
        SELECT DISTINCT rollNumber, name FROM (
          SELECT rollNumber, name FROM users
          UNION
          SELECT rollNumber, studentName as name FROM bookings
          UNION
          SELECT rollNumber, studentName as name FROM waitlists
        ) as u WHERE rollNumber IS NOT NULL AND rollNumber != ''
      `);

      if (lockVal === 1) {
        allUsers.forEach((student) => {
          const rNum = student.rollnumber || student.rollNumber;
          const sName = student.name || student.studentname || student.studentName || null;

          dispatchNotification({
            rollNumber: rNum,
            studentName: sName,
            title: `Facility Maintenance Alert: ${facilityName} 🛠️`,
            message: `Notice: ${facilityName} has been temporarily locked for maintenance by Gymkhana Admin. Expected to re-open shortly.`,
            type: "CANCELLATION"
          });
        });
      } else {
        allUsers.forEach((student) => {
          const rNum = student.rollnumber || student.rollNumber;
          const sName = student.name || student.studentname || student.studentName || null;

          dispatchNotification({
            rollNumber: rNum,
            studentName: sName,
            title: `Ground Re-Opened & Clear to Use: ${facilityName} ✅`,
            message: `Good news! Maintenance on ${facilityName} is complete. The ground is clear to use and open for slot reservations!`,
            type: "CONFIRMATION"
          });
        });
      }
    } catch (notifErr) {
      console.warn("Notice dispatch error:", notifErr.message);
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Operations: Maintenance Windows & Event Approvals
// ==========================================
app.get("/api/admin/maintenance-windows", async (req, res) => {
  try {
    const windows = await query.all("SELECT * FROM maintenance_windows ORDER BY createdAt DESC");
    const parsed = windows.map((w) => ({
      id: w.id,
      facilityId: w.facilityid || w.facilityId,
      facilityName: w.facilityname || w.facilityName,
      startDate: w.startdate || w.startDate,
      endDate: w.enddate || w.endDate,
      reason: w.reason,
      slotIds: JSON.parse(w.slotids || w.slotIds || "[]"),
      createdAt: w.createdat || w.createdAt
    }));
    return res.json({ success: true, windows: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/maintenance-windows", async (req, res) => {
  const { facilityId, startDate, endDate, reason, slotIds = ["all"] } = req.body;
  if (!facilityId || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, error: "Missing required maintenance window fields" });
  }

  try {
    const facility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!facility) {
      return res.status(404).json({ success: false, error: "Facility not found" });
    }

    const id = generateId("mw");
    const createdAt = new Date().toISOString();

    await query.run(
      `INSERT INTO maintenance_windows (id, facilityId, facilityName, startDate, endDate, reason, slotIds, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, facilityId, facility.name, startDate, endDate, reason, JSON.stringify(slotIds), createdAt]
    );

    const window = await query.get("SELECT * FROM maintenance_windows WHERE id = $1", [id]);

    // Dispatch in-app and Twilio SMS/WhatsApp notifications to all registered students
    try {
      const allUsers = await query.all(`
        SELECT DISTINCT rollNumber, name FROM (
          SELECT rollNumber, name FROM users
          UNION
          SELECT rollNumber, studentName as name FROM bookings
          UNION
          SELECT rollNumber, studentName as name FROM waitlists
        ) as u WHERE rollNumber IS NOT NULL AND rollNumber != ''
      `);

      allUsers.forEach((student) => {
        const rNum = student.rollnumber || student.rollNumber;
        const sName = student.name || student.studentname || student.studentName || null;

        dispatchNotification({
          rollNumber: rNum,
          studentName: sName,
          title: `Facility Closure Notice: ${facility.name} 🛠️`,
          message: `Notice: ${facility.name} will be closed from ${startDate} to ${endDate}. Reason: ${reason}. Facilities will be accessible again from ${endDate}.`,
          type: "CANCELLATION"
        });
      });
    } catch (notifErr) {
      console.warn("Notice dispatch error:", notifErr.message);
    }

    return res.json({
      success: true,
      window: {
        id: window.id,
        facilityId: window.facilityid || window.facilityId,
        facilityName: window.facilityname || window.facilityName,
        startDate: window.startdate || window.startDate,
        endDate: window.enddate || window.endDate,
        reason: window.reason,
        slotIds: JSON.parse(window.slotids || window.slotIds || "[]"),
        createdAt: window.createdat || window.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/admin/maintenance-windows/:id", async (req, res) => {
  try {
    const window = await query.get("SELECT * FROM maintenance_windows WHERE id = $1", [req.params.id]);
    await query.run("DELETE FROM maintenance_windows WHERE id = $1", [req.params.id]);

    if (window) {
      const facilityName = window.facilityname || window.facilityName || "Sports Facility";
      try {
        const allUsers = await query.all(`
          SELECT DISTINCT rollNumber, name FROM (
            SELECT rollNumber, name FROM users
            UNION
            SELECT rollNumber, studentName as name FROM bookings
            UNION
            SELECT rollNumber, studentName as name FROM waitlists
          ) as u WHERE rollNumber IS NOT NULL AND rollNumber != ''
        `);

        allUsers.forEach((student) => {
          const rNum = student.rollnumber || student.rollNumber;
          const sName = student.name || student.studentname || student.studentName || null;

          dispatchNotification({
            rollNumber: rNum,
            studentName: sName,
            title: `Ground Clear to Use: ${facilityName} ✅`,
            message: `Good news! Scheduled maintenance for ${facilityName} has ended/cleared. Ground is now open and available for reservations!`,
            type: "CONFIRMATION"
          });
        });
      } catch (notifErr) {
        console.warn("Notice dispatch error:", notifErr.message);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/bookings/request-approval", async (req, res) => {
  const { facilityId, studentName, rollNumber, eventName, dateKey, slotId, purpose } = req.body;
  if (!facilityId || !studentName || !rollNumber || !eventName || !dateKey || !slotId || !purpose) {
    return res.status(400).json({ success: false, error: "Missing required event approval fields" });
  }

  try {
    const facility = await query.get("SELECT * FROM facilities WHERE id = $1", [facilityId]);
    if (!facility) {
      return res.status(404).json({ success: false, error: "Facility not found" });
    }

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

    const id = generateId("appr");
    const requestedAt = new Date().toISOString();

    await query.run(
      `INSERT INTO event_approvals (id, facilityId, facilityName, studentName, rollNumber, eventName, dateKey, slotId, startLabel, endLabel, purpose, status, requestedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', $12)`,
      [
        id,
        facilityId,
        facility.name,
        studentName,
        rollNumber,
        eventName,
        dateKey,
        slotId,
        labels.start,
        labels.end,
        purpose,
        requestedAt
      ]
    );

    const approval = await query.get("SELECT * FROM event_approvals WHERE id = $1", [id]);
    return res.json({ success: true, approval });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/admin/approvals", async (req, res) => {
  try {
    const rows = await query.all("SELECT * FROM event_approvals ORDER BY requestedAt DESC");
    const approvals = rows.map((a) => ({
      id: a.id,
      facilityId: a.facilityid || a.facilityId,
      facilityName: a.facilityname || a.facilityName,
      studentName: a.studentname || a.studentName,
      rollNumber: a.rollnumber || a.rollNumber,
      eventName: a.eventname || a.eventName,
      dateKey: a.datekey || a.dateKey,
      slotId: a.slotid || a.slotId,
      startLabel: a.startlabel || a.startLabel,
      endLabel: a.endlabel || a.endLabel,
      purpose: a.purpose,
      status: a.status,
      requestedAt: a.requestedat || a.requestedAt,
      processedAt: a.processedat || a.processedAt,
      rejectionReason: a.rejectionreason || a.rejectionReason
    }));
    return res.json({ success: true, approvals });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch("/api/admin/approvals/:id", async (req, res) => {
  const approvalId = req.params.id;
  const { action, rejectionReason } = req.body;

  if (!action || (action !== "APPROVE" && action !== "REJECT")) {
    return res.status(400).json({ success: false, error: "Action must be 'APPROVE' or 'REJECT'" });
  }

  try {
    const approval = await query.get("SELECT * FROM event_approvals WHERE id = $1", [approvalId]);
    if (!approval) {
      return res.status(404).json({ success: false, error: "Approval request not found" });
    }

    const processedAt = new Date().toISOString();

    if (action === "REJECT") {
      await query.run(
        "UPDATE event_approvals SET status = 'REJECTED', processedAt = $1, rejectionReason = $2 WHERE id = $3",
        [processedAt, rejectionReason || "Rejected by Gymkhana Admin", approvalId]
      );

      dispatchNotification({
        rollNumber: approval.rollnumber || approval.rollNumber,
        title: "Event Request Update",
        message: `Your event request '${approval.eventname || approval.eventName}' was rejected: ${rejectionReason || "Slot unavailable"}`,
        type: "EVENT_APPROVAL"
      });

      return res.json({ success: true, status: "REJECTED" });
    }

    // Action === 'APPROVE'
    const facilityId = approval.facilityid || approval.facilityId;
    const dateKey = approval.datekey || approval.dateKey;
    const slotId = approval.slotid || approval.slotId;
    const studentName = approval.studentname || approval.studentName;
    const rollNumber = approval.rollnumber || approval.rollNumber;
    const startLabel = approval.startlabel || approval.startLabel;
    const endLabel = approval.endlabel || approval.endLabel;
    const facilityName = approval.facilityname || approval.facilityName;

    const bookingId = generateId("bk_event");

    await query.run(
      `INSERT INTO bookings (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, status, bookedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', $12)`,
      [
        bookingId,
        facilityId,
        facilityName,
        "Campus Sports Complex",
        dateKey,
        slotId,
        startLabel,
        endLabel,
        rollNumber,
        studentName,
        "Event Organizers",
        processedAt
      ]
    );

    await query.run(
      "UPDATE event_approvals SET status = 'APPROVED', processedAt = $1 WHERE id = $2",
      [processedAt, approvalId]
    );

    dispatchNotification({
      rollNumber,
      title: "Event Request Approved! 🏆",
      message: `Your event request '${approval.eventname || approval.eventName}' for ${facilityName} on ${dateKey} (${startLabel}) has been APPROVED by Gymkhana Admin!`,
      type: "EVENT_APPROVAL"
    });

    return res.json({ success: true, status: "APPROVED", bookingId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. Notifications & Twilio Webhook API
// ==========================================
app.get("/api/notifications", async (req, res) => {
  const { rollNumber, studentName } = req.query;
  if (!rollNumber) {
    return res.status(400).json({ success: false, error: "Roll number is required" });
  }

  const trimmedRoll = rollNumber.trim();
  const trimmedName = studentName ? studentName.trim() : null;

  try {
    let sql = "SELECT * FROM notifications WHERE LOWER(rollNumber) = LOWER($1)";
    const params = [trimmedRoll];

    if (trimmedName) {
      sql += " AND (LOWER(studentName) = LOWER($2) OR studentName IS NULL OR studentName = '')";
      params.push(trimmedName);
    }

    sql += " ORDER BY createdAt DESC LIMIT 50";

    const rows = await query.all(sql, params);
    const notifications = rows.map((n) => ({
      id: n.id,
      rollNumber: n.rollnumber || n.rollNumber,
      studentName: n.studentname || n.studentName,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: Boolean(n.isread || n.isRead),
      createdAt: n.createdat || n.createdAt
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    await query.run("UPDATE notifications SET isRead = 1 WHERE id = $1", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/notifications/clear", async (req, res) => {
  const { rollNumber, studentName } = req.query;
  if (!rollNumber) {
    return res.status(400).json({ success: false, error: "Roll number is required" });
  }

  const trimmedRoll = rollNumber.trim();
  const trimmedName = studentName ? studentName.trim() : null;

  try {
    let sql = "DELETE FROM notifications WHERE LOWER(rollNumber) = LOWER($1)";
    const params = [trimmedRoll];

    if (trimmedName) {
      sql += " AND (LOWER(studentName) = LOWER($2) OR studentName IS NULL OR studentName = '')";
      params.push(trimmedName);
    }

    await query.run(sql, params);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Twilio WhatsApp Chatbot Webhook Endpoint (Future Chatbot Feature)
app.post("/api/notifications/twilio-webhook", handleWhatsAppWebhook);

// Serve frontend static build files if dist exists (Unified Single-Port Deployment)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Start Server and Database initialization
app.listen(PORT, async () => {
  try {
    await initDatabase();
    console.log(`Sports Facility Booking PostgreSQL backend server running on port ${PORT}`);
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
});
