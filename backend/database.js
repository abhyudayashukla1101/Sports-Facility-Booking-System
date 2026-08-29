import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "sports_booking.db");

let isPg = false;
let pool = null;
let sqliteDb = null;

// Convert PostgreSQL $1, $2 parameter placeholders to SQLite ? placeholders
function toSqliteSql(sql) {
  return sql.replace(/\$\d+/g, "?");
}

// Promisified SQL query interface supporting both SQLite and PostgreSQL
export const query = {
  async run(sql, params = []) {
    if (isPg && pool) {
      const result = await pool.query(sql, params);
      return { changes: result.rowCount };
    }
    return new Promise((resolve, reject) => {
      sqliteDb.run(toSqliteSql(sql), params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  async get(sql, params = []) {
    if (isPg && pool) {
      const result = await pool.query(sql, params);
      return result.rows[0] || null;
    }
    return new Promise((resolve, reject) => {
      sqliteDb.get(toSqliteSql(sql), params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  },

  async all(sql, params = []) {
    if (isPg && pool) {
      const result = await pool.query(sql, params);
      return result.rows;
    }
    return new Promise((resolve, reject) => {
      sqliteDb.all(toSqliteSql(sql), params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  async exec(sql) {
    if (isPg && pool) {
      await pool.query(sql);
      return;
    }
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export async function initDatabase() {
  // Try PostgreSQL if explicitly requested in ENV
  if (process.env.USE_POSTGRES === "true") {
    try {
      pool = new pg.Pool({
        host: process.env.PGHOST || "localhost",
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "sports_booking"
      });
      await pool.query("SELECT 1");
      isPg = true;
      console.log("Connected to PostgreSQL database");
    } catch (pgErr) {
      console.warn("PostgreSQL connection failed, falling back to SQLite:", pgErr.message);
      isPg = false;
      pool = null;
    }
  }

  if (!isPg) {
    sqliteDb = new sqlite3.Database(dbPath);
    sqliteDb.run("PRAGMA foreign_keys = ON;");
    console.log("Connected to SQLite database at:", dbPath);
  }

  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      rollNumber VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      hostel VARCHAR(255) NOT NULL,
      phone VARCHAR(255),
      passcode VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL DEFAULT 'student',
      createdAt VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sport VARCHAR(255) NOT NULL,
      rating DOUBLE PRECISION NOT NULL,
      location VARCHAR(255) NOT NULL,
      capacity INT NOT NULL,
      slotDuration VARCHAR(255) NOT NULL,
      hours VARCHAR(255) NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      rules TEXT NOT NULL,
      isMaintenanceLocked INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(255) PRIMARY KEY,
      facilityId VARCHAR(255) NOT NULL,
      facilityName VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      dateKey VARCHAR(255) NOT NULL,
      slotId VARCHAR(255) NOT NULL,
      startLabel VARCHAR(255) NOT NULL,
      endLabel VARCHAR(255) NOT NULL,
      rollNumber VARCHAR(255) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      hostel VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL DEFAULT 'CONFIRMED',
      attendanceStatus VARCHAR(255) NOT NULL DEFAULT 'PENDING',
      bookedAt VARCHAR(255) NOT NULL,
      promotedFromWaitlist INT DEFAULT 0,
      FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS waitlists (
      id VARCHAR(255) PRIMARY KEY,
      facilityId VARCHAR(255) NOT NULL,
      facilityName VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      dateKey VARCHAR(255) NOT NULL,
      slotId VARCHAR(255) NOT NULL,
      startLabel VARCHAR(255) NOT NULL,
      endLabel VARCHAR(255) NOT NULL,
      rollNumber VARCHAR(255) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      hostel VARCHAR(255) NOT NULL,
      queuePosition INT NOT NULL,
      status VARCHAR(255) NOT NULL DEFAULT 'WAITLISTED',
      createdAt VARCHAR(255) NOT NULL,
      FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(255) PRIMARY KEY,
      facilityId VARCHAR(255) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      rollNumber VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      images TEXT NOT NULL,
      date VARCHAR(255) NOT NULL,
      FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_windows (
      id VARCHAR(255) PRIMARY KEY,
      facilityId VARCHAR(255) NOT NULL,
      facilityName VARCHAR(255) NOT NULL,
      startDate VARCHAR(255) NOT NULL,
      endDate VARCHAR(255) NOT NULL,
      reason TEXT NOT NULL,
      slotIds TEXT NOT NULL,
      createdAt VARCHAR(255) NOT NULL,
      FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_approvals (
      id VARCHAR(255) PRIMARY KEY,
      facilityId VARCHAR(255) NOT NULL,
      facilityName VARCHAR(255) NOT NULL,
      studentName VARCHAR(255) NOT NULL,
      rollNumber VARCHAR(255) NOT NULL,
      eventName VARCHAR(255) NOT NULL,
      dateKey VARCHAR(255) NOT NULL,
      slotId VARCHAR(255) NOT NULL,
      startLabel VARCHAR(255) NOT NULL,
      endLabel VARCHAR(255) NOT NULL,
      purpose TEXT NOT NULL,
      status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
      requestedAt VARCHAR(255) NOT NULL,
      processedAt VARCHAR(255),
      rejectionReason TEXT,
      FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(255) PRIMARY KEY,
      rollNumber VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(255) NOT NULL,
      isRead INT DEFAULT 0,
      createdAt VARCHAR(255) NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_booking 
    ON bookings (facilityId, dateKey, slotId) 
    WHERE status = 'CONFIRMED';
  `);

  // Migration: Add attendanceStatus column if missing
  try {
    await query.run("ALTER TABLE bookings ADD COLUMN attendanceStatus VARCHAR(255) DEFAULT 'PENDING'");
  } catch (mErr) {
    // Ignore if column already exists
  }

  // Migration: Add studentName column to notifications if missing
  try {
    await query.run("ALTER TABLE notifications ADD COLUMN studentName VARCHAR(255)");
  } catch (mErr) {
    // Ignore if column already exists
  }

  // Seed default data if facilities table is empty
  const MOCK_FACILITIES = [
    {
      id: "badminton-hall",
      name: "Badminton Hall",
      sport: "Badminton",
      rating: 4.9,
      location: "SAC Indoor Hall, First Floor",
      capacity: 8,
      slotDuration: "60-min slots",
      hours: "6:00–22:00",
      image: "/images/facilities/badminton-hall.jpg",
      description: "Four wooden indoor courts with anti-glare lighting inside the SAC hall.",
      rules: ["Indoor shoes compulsory", "Shuttles not provided", "Switch off lights after use"]
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
      image: "/images/facilities/basketball-court.jpg",
      description: "Outdoor full court with floodlights for evening play.",
      rules: ["No metal studs", "Report damaged nets to admin", "Switch off lights after use"]
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
      image: "/images/facilities/main-football-ground.jpg",
      description: "Full-size turf ground with floodlights, used for matches and practice.",
      rules: ["Studs only, no bare cleats on turf", "No food or drink on turf", "Coordinate with team captain before booking"]
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
      image: "/images/facilities/sac-cricket-ground.jpg",
      description: "Full cricket ground with practice nets on the side.",
      rules: ["Book nets separately for practice", "No tennis-ball cricket on match days", "Roll the pitch cover back after use"]
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
      rules: ["Gym attire and shoes required", "Wipe down equipment after use", "Re-rack weights"]
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
      image: "/images/facilities/squash-court.jpg",
      description: "Two glass-backed squash courts, racquets available on request.",
      rules: ["Non-marking shoes only", "Eye protection recommended", "Max 2 players per slot"]
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
      image: "/images/facilities/swimming-pool.jpg",
      description: "Eight-lane outdoor pool, lifeguard on duty during all open slots.",
      rules: ["Shower before entering", "Swim cap mandatory", "No diving in shallow end"]
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
      image: "/images/facilities/table-tennis-room.png",
      description: "Six tables in a climate-controlled room, paddles available at the counter.",
      rules: ["Bring your own paddle or borrow at counter", "Max 4 players per table", "Quiet hours after 9pm"]
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
      image: "/images/facilities/tennis-court.jpg",
      description: "Two hard courts near the hostel wing, lit for night play.",
      rules: ["Non-marking shoes only", "Singles or doubles bookings allowed", "Return court to admin if unused after 10 min"]
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
      rules: ["Bare feet allowed on sand court only", "Nets must be re-tensioned after use", "No spikes on hard court"]
    }
  ];

  const facilityCount = await query.get("SELECT COUNT(*) as count FROM facilities");
  const fCount = parseInt(facilityCount ? facilityCount.count : 0, 10);
  if (fCount === 0) {
    console.log("Seeding initial facility data...");
    for (const f of MOCK_FACILITIES) {
      await query.run(
        `INSERT INTO facilities (id, name, sport, rating, location, capacity, slotDuration, hours, image, description, rules) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          f.id,
          f.name,
          f.sport,
          f.rating,
          f.location,
          f.capacity,
          f.slotDuration,
          f.hours,
          f.image,
          f.description,
          JSON.stringify(f.rules)
        ]
      );
    }
  } else {
    // Update existing facilities to real image URLs
    for (const f of MOCK_FACILITIES) {
      await query.run(
        `UPDATE facilities SET image = $1 WHERE id = $2`,
        [f.image, f.id]
      );
    }
  }

  // Keep existing local databases in sync when a seeded facility image is replaced.
  await query.run(
    "UPDATE facilities SET image = $1 WHERE id = $2 AND image = $3",
    [
      "https://plus.unsplash.com/premium_photo-1684713510655-e6e31536168d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "main-football-ground",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop"
    ]
  );

  // Seed default reviews if reviews table is empty
  const reviewCount = await query.get("SELECT COUNT(*) as count FROM reviews");
  const rCount = parseInt(reviewCount ? reviewCount.count : 0, 10);
  if (rCount === 0) {
    console.log("Seeding initial review data...");
    const INITIAL_REVIEWS = [
      {
        id: "rev_1",
        facilityId: "badminton-hall",
        studentName: "Rohan Sharma",
        rollNumber: "210101088",
        rating: 5,
        comment: "The wooden courts are in pristine condition! Anti-glare lighting makes evening matches amazing.",
        images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop"],
        date: "2026-08-20"
      },
      {
        id: "rev_2",
        facilityId: "badminton-hall",
        studentName: "Ananya Roy",
        rollNumber: "220102014",
        rating: 4,
        comment: "Courts are well maintained. Make sure to bring your own non-marking indoor shoes!",
        images: [],
        date: "2026-08-22"
      },
      {
        id: "rev_3",
        facilityId: "sac-gymnasium",
        studentName: "Vikramaditya Das",
        rollNumber: "200103045",
        rating: 5,
        comment: "Great variety of free weights and cardio equipment. Clean environment.",
        images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop"],
        date: "2026-08-18"
      },
      {
        id: "rev_4",
        facilityId: "main-football-ground",
        studentName: "Priyanjali Borgohain",
        rollNumber: "220108012",
        rating: 5,
        comment: "Floodlights are super bright for late evening practice sessions under the stars!",
        images: ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"],
        date: "2026-08-23"
      }
    ];

    for (const r of INITIAL_REVIEWS) {
      await query.run(
        `INSERT INTO reviews (id, facilityId, studentName, rollNumber, rating, comment, images, date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [r.id, r.facilityId, r.studentName, r.rollNumber, r.rating, r.comment, JSON.stringify(r.images), r.date]
      );
    }
  }

  // Seed default bookings if bookings table is empty
  const bookingCount = await query.get("SELECT COUNT(*) as count FROM bookings");
  const bCount = parseInt(bookingCount ? bookingCount.count : 0, 10);
  if (bCount === 0) {
    console.log("Seeding initial booking data...");
    const todayStr = new Date().toISOString().split("T")[0];
    await query.run(
      `INSERT INTO bookings (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, status, bookedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'CONFIRMED', $12)`,
      [
        "bk_101",
        "badminton-hall",
        "Badminton Hall",
        "SAC Indoor Hall, First Floor",
        todayStr,
        "7pm",
        "7:00 pm",
        "8:00 pm",
        "220101045",
        "Abhyudaya Shukla",
        "Lohit",
        new Date().toISOString()
      ]
    );

    // Seed default waitlist corresponding to the booking above
    await query.run(
      `INSERT INTO waitlists (id, facilityId, facilityName, location, dateKey, slotId, startLabel, endLabel, rollNumber, studentName, hostel, queuePosition, status, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'WAITLISTED', $13)`,
      [
        "wl_501",
        "badminton-hall",
        "Badminton Hall",
        "SAC Indoor Hall, First Floor",
        todayStr,
        "7pm",
        "7:00 pm",
        "8:00 pm",
        "210102033",
        "Devansh Mehta",
        "Kapili",
        1,
        new Date().toISOString()
      ]
    );
  }
}

export default pool;
