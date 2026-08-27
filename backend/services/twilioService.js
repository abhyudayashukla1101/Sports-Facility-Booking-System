import { query } from "../database.js";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

let twilioClient = null;

// Lazy initialization of Twilio client if credentials are present
async function getTwilioClient() {
  if (accountSid && authToken) {
    if (!twilioClient) {
      try {
        const twilio = (await import("twilio")).default;
        twilioClient = twilio(accountSid, authToken);
        console.log("Twilio SMS & WhatsApp client initialized successfully.");
      } catch (err) {
        console.warn("Failed to load Twilio module:", err.message);
      }
    }
    return twilioClient;
  }
  return null;
}

// Generate Unique Notification ID
function generateId(prefix = "notif") {
  return `${prefix}_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 4)}`;
}

/**
 * Dispatch notification across In-App Feed and Twilio SMS / WhatsApp
 */
export async function dispatchNotification({ rollNumber, studentName = null, title, message, type = "CONFIRMATION", phone = null }) {
  const notifId = generateId("notif");
  const createdAt = new Date().toISOString();

  // 1. Always save to In-App Notifications table
  try {
    await query.run(
      `INSERT INTO notifications (id, rollNumber, studentName, title, message, type, isRead, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)`,
      [notifId, rollNumber, studentName, title, message, type, createdAt]
    );
  } catch (dbErr) {
    console.error("Error saving notification to DB:", dbErr.message);
  }

  // Auto-resolve phone number from users table if not explicitly passed
  let targetPhone = phone;
  if (!targetPhone && rollNumber) {
    try {
      const userRow = await query.get("SELECT phone FROM users WHERE rollNumber = $1", [rollNumber]);
      if (userRow && userRow.phone) {
        targetPhone = userRow.phone;
      }
    } catch (e) {}
  }

  // 2. Dispatch Twilio SMS / WhatsApp if phone number & credentials available
  const client = await getTwilioClient();
  if (client && targetPhone) {
    const rawPhone = targetPhone.replace("whatsapp:", "").trim();
    const formattedPhone = rawPhone.startsWith("+") ? rawPhone : `+91${rawPhone}`;
    const whatsappPhone = `whatsapp:${formattedPhone}`;

    try {
      // Send SMS if fromPhone is configured
      if (fromPhone) {
        await client.messages.create({
          body: `[Playfield IITG] ${title}\n${message}`,
          from: fromPhone,
          to: formattedPhone
        });
        console.log(`[Twilio SMS Sent] to ${formattedPhone}: ${title}`);
      }

      // Send WhatsApp message if fromWhatsApp is configured
      if (fromWhatsApp) {
        const contentSid = process.env.TWILIO_CONTENT_SID;
        if (contentSid) {
          await client.messages.create({
            contentSid: contentSid,
            contentVariables: JSON.stringify({ "1": title, "2": message }),
            from: fromWhatsApp,
            to: whatsappPhone
          });
          console.log(`[Twilio WhatsApp Template Sent] to ${whatsappPhone}: ${title}`);
        } else {
          await client.messages.create({
            body: `*Playfield IITG Notification*\n\n*${title}*\n${message}`,
            from: fromWhatsApp,
            to: whatsappPhone
          });
          console.log(`[Twilio WhatsApp Sent] to ${whatsappPhone}: ${title}`);
        }
      }
    } catch (twilioErr) {
      console.warn(`[Twilio Dispatch Notice] ${twilioErr.message}`);
    }
  } else {
    console.log(`[Notification Dispatched (In-App)] [${type}] to Roll: ${rollNumber} | ${title}: ${message}`);
  }

  return { id: notifId, rollNumber, title, message, type, createdAt };
}

/**
 * Placeholder Webhook for future Twilio WhatsApp Chatbot Feature
 */
/**
 * Full Interactive Twilio WhatsApp Chatbot Engine
 */
export async function handleWhatsAppWebhook(req, res) {
  const { From, Body } = req.body || {};
  const rawMsg = (Body || "").trim();
  const upperMsg = rawMsg.toUpperCase();
  const rawPhone = (From || "").replace("whatsapp:", "").trim();

  console.log(`[Twilio WhatsApp Chatbot] Received message from ${From}: "${rawMsg}"`);

  let replyText = "";
  const todayStr = new Date().toISOString().split("T")[0];

  // Try to resolve student by phone number
  let student = null;
  try {
    if (rawPhone) {
      student = await query.get(
        "SELECT * FROM users WHERE phone LIKE $1 OR phone = $2",
        [`%${rawPhone.slice(-10)}%`, rawPhone]
      );
    }
  } catch (e) {}

  // 1. COMMAND: SLOTS / 1
  if (upperMsg === "SLOTS" || upperMsg === "1") {
    try {
      const facilities = await query.all("SELECT id, name, sport FROM facilities");
      let slotsText = "🏟️ *IITG Today Available Facilities & Open Slots*\n\n";

      for (const fac of facilities) {
        const booked = await query.all(
          "SELECT slotId FROM bookings WHERE facilityId = $1 AND dateKey = $2 AND status = 'CONFIRMED'",
          [fac.id, todayStr]
        );
        const bookedSet = new Set(booked.map((b) => b.slotid || b.slotId));
        const allSlots = ["6am", "7am", "8am", "9am", "4pm", "5pm", "6pm", "7pm", "8pm"];
        const openSlots = allSlots.filter((s) => !bookedSet.has(s));

        slotsText += `*${fac.name}* (${fac.sport}):\n`;
        slotsText += openSlots.length > 0 ? `Open: ${openSlots.join(", ")}\n\n` : `Fully Booked today 🔴\n\n`;
      }

      slotsText += "To reserve, reply: *BOOK <FacilityName> <SlotId>*\nExample: *BOOK Badminton 5pm*";
      replyText = slotsText;
    } catch (err) {
      replyText = "Error fetching slots: " + err.message;
    }
  }
  // 2. COMMAND: MY BOOKINGS / 2
  else if (upperMsg.includes("MY BOOKING") || upperMsg === "2" || upperMsg === "MYBOOKINGS") {
    if (!student) {
      replyText = "⚠️ Phone number not registered. Please sign in on http://localhost:3000 to link your account.";
    } else {
      try {
        const bookings = await query.all(
          "SELECT * FROM bookings WHERE rollNumber = $1 AND status = 'CONFIRMED' ORDER BY dateKey ASC",
          [student.rollnumber || student.rollNumber]
        );

        if (bookings.length === 0) {
          replyText = `📋 Hi ${student.name}, you have no active court reservations. Reply *SLOTS* to check available courts!`;
        } else {
          replyText = `📋 *Active Campus Bookings for ${student.name}*:\n\n`;
          bookings.forEach((b) => {
            replyText += `• *${b.facilityname || b.facilityName}*\n  Date: ${b.datekey || b.dateKey} (${b.startlabel || b.startLabel})\n  Ref: ${b.id}\n\n`;
          });
        }
      } catch (err) {
        replyText = "Error loading bookings: " + err.message;
      }
    }
  }
  // 3. COMMAND: STATUS / 3
  else if (upperMsg.includes("STATUS") || upperMsg === "3") {
    try {
      const windows = await query.all("SELECT * FROM maintenance_windows WHERE endDate >= $1", [todayStr]);
      if (windows.length === 0) {
        replyText = "🟢 *All IITG Sports Facilities are Operational*! Normal hours 6:00 AM – 10:00 PM.";
      } else {
        replyText = "🚧 *IITG Ground Maintenance Status*:\n\n";
        windows.forEach((w) => {
          replyText += `• *Facility*: ${w.facilityid || w.facilityId}\n  Window: ${w.startdate || w.startDate} to ${w.enddate || w.endDate}\n  Reason: ${w.reason}\n\n`;
        });
      }
    } catch (err) {
      replyText = "Error checking status: " + err.message;
    }
  }
  // 4. COMMAND: BOOK <Facility> <Slot>
  else if (upperMsg.startsWith("BOOK")) {
    const parts = rawMsg.split(" ");
    if (parts.length < 3) {
      replyText = "⚠️ Format: *BOOK <FacilityKeyword> <SlotId>*\nExample: *BOOK Badminton 5pm*";
    } else {
      const facKeyword = parts[1].toLowerCase();
      const slotId = parts[2].toLowerCase();

      try {
        const targetFac = await query.get(
          "SELECT * FROM facilities WHERE LOWER(id) LIKE $1 OR LOWER(name) LIKE $1 OR LOWER(sport) LIKE $1",
          [`%${facKeyword}%`]
        );

        if (!targetFac) {
          replyText = `❌ Facility '${parts[1]}' not found. Reply *SLOTS* to see valid grounds.`;
        } else {
          const studentName = student ? student.name : "WhatsApp User";
          const studentRoll = student ? (student.rollnumber || student.rollNumber) : "220101045";
          const studentHostel = student ? student.hostel : "Lohit";

          // Perform booking creation
          const bookingId = `bk_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 4)}`;
          const TIME_LABELS = {
            "6am": "6:00 am - 7:00 am",
            "7am": "7:00 am - 8:00 am",
            "8am": "8:00 am - 9:00 am",
            "9am": "9:00 am - 10:00 am",
            "4pm": "4:00 pm - 5:00 pm",
            "5pm": "5:00 pm - 6:00 pm",
            "6pm": "6:00 pm - 7:00 pm",
            "7pm": "7:00 pm - 8:00 pm",
            "8pm": "8:00 pm - 9:00 pm"
          };
          const slotLabel = TIME_LABELS[slotId] || `${slotId} slot`;

          const existing = await query.get(
            "SELECT id FROM bookings WHERE facilityId = $1 AND dateKey = $2 AND slotId = $3 AND status = 'CONFIRMED'",
            [targetFac.id, todayStr, slotId]
          );

          if (existing) {
            replyText = `🔴 *Slot Booked*: ${targetFac.name} at ${slotId} is full for today. Reply *SLOTS* for open times.`;
          } else {
            await query.run(
              `INSERT INTO bookings (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, status, bookedAt)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', $12)`,
              [
                bookingId,
                targetFac.id,
                targetFac.name,
                targetFac.location,
                todayStr,
                slotId,
                slotLabel.split(" - ")[0],
                slotLabel.split(" - ")[1] || "End",
                studentRoll,
                studentName,
                studentHostel,
                new Date().toISOString()
              ]
            );

            replyText = `🎉 *Booking Confirmed via WhatsApp*!\n\nFacility: ${targetFac.name}\nDate: ${todayStr}\nTime: ${slotLabel}\nRef: ${bookingId}\nStudent: ${studentName}`;
          }
        }
      } catch (err) {
        replyText = "Booking failed: " + err.message;
      }
    }
  }
  // DEFAULT: MENU / HI / HELP
  else {
    const studentGreeting = student ? `Hi ${student.name}!` : "Welcome!";
    replyText = `🎾 *IIT Guwahati Sports Facilities WhatsApp Bot* 🏸\n\n${studentGreeting} Reply with any command:\n\n1️⃣ *SLOTS* - View today's open courts\n2️⃣ *MY BOOKINGS* - Check your reservations\n3️⃣ *STATUS* - Ground upkeep status\n4️⃣ *BOOK <Facility> <Slot>* - Reserve (e.g. *BOOK Badminton 5pm*)\n\nOr visit: http://localhost:3000`;
  }

  res.type("text/xml");
  return res.send(`
    <Response>
      <Message>${replyText}</Message>
    </Response>
  `);
}
