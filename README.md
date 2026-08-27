# 🏆 Playfield IITG — Campus Sports Facility Booking & Analytics Platform

[![Hackathon Project](https://img.shields.io/badge/Hackathon-IIT%20Guwahati%20Gymkhana-orange.svg)](#-built-in-a-hackathon)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](backend/server.js)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-blue.svg)](frontend/)
[![AI-Powered](https://img.shields.io/badge/AI-Groq%20SDK%20%7C%20Llama%203-purple.svg)](backend/services/groqService.js)
[![Notifications](https://img.shields.io/badge/Alerts-Twilio%20SMS%20%26%20WhatsApp-red.svg)](backend/services/twilioService.js)

**Playfield IITG** is an end-to-end full-stack campus sports facility reservation, concurrency control, and intelligent operations platform engineered specifically for **IIT Guwahati Gymkhana Sports Complex**.

It solves real-world campus sports infrastructure bottlenecks—eliminating manual line-up queues, preventing double-booking conflicts, automating waitlist promotions, sending real-time SMS/WhatsApp updates, and providing AI-powered analytics insights to campus sports officers.

---

## 🚀 Built in a Hackathon

Playfield IITG was conceived, designed, and built during an intensive **Hackathon** to solve the high-concurrency reservation problem faced by thousands of campus students competing for limited sports slots (e.g., Badminton, Football, Basketball, Gym, Cricket) every day.

### The Challenge
- **Massive Traffic Spikes**: At slot opening times (e.g., 6:00 AM / 8:00 PM), hundreds of students tap "Book Now" simultaneously on the exact same court and time slot.
- **Manual & Opaque Queueing**: Traditional paper logs or static forms resulted in double bookings, disputes, and unutilized empty courts due to no-shows.
- **Lack of Analytics**: Campus sports managers had no visibility into overall ground utilization, peak demand windows, or hostel-wise participation.

### The Solution
A high-throughput, concurrency-safe sports management system featuring:
1. **Intelligent SQL Collision Engine** to prevent race conditions at database level.
2. **Automated Waitlist & Promotion Pipeline** with instant multi-channel alerts (Twilio SMS/WhatsApp + In-App).
3. **Groq AI Executive Advisory System** powered by Llama-3 for sports complex management.
4. **Operations & Tournament Approval Suite** for Gymkhana executives.

---

## ✨ Key Features

### 📅 Real-Time Slot Booking System
- **10+ Campus Facilities**: SAC Badminton Hall (4 courts), Basketball Court, Main Football Turf, Cricket Ground, SAC Gymnasium, Tennis Courts, Squash Court, Volleyball Court, Olympic Swimming Pool, Table Tennis Arena.
- **Flexible Time Slots**: Live availability indicators (`AVAILABLE`, `BOOKED`, `WAITLISTED`, `MAINTENANCE`).
- **Student Authentication**: Passcode-based authentication with Roll Number & Hostel mapping (Lohit, Kapili, Kameng, Subansiri, Disang, Brahmaputra, Dihing, etc.).

### ⚡ Race Condition Prevention & Collision Engine
- **Transactional Integrity**: Uses database-level unique indices (`idx_unique_confirmed_booking ON bookings (facilityId, dateKey, slotId) WHERE status = 'CONFIRMED'`) and atomic state transitions to guarantee **zero double-bookings**.
- **Interactive Concurrency Simulator**: Built-in UI widget & CLI script (`node scripts/test-concurrent-booking.js`) that fires 5 simultaneous `POST` requests at the exact same millisecond to demonstrate 1 success (HTTP 200) and 4 handled conflicts (HTTP 409).

### ⏳ Automated Waitlist Promotion Engine
- When a facility slot is fully booked, students can join the **Waitlist** with queue positions (#1, #2, etc.).
- When a student cancels their confirmed booking:
  1. The system automatically fetches the candidate with queue position #1.
  2. Promotes the candidate to `CONFIRMED` status automatically.
  3. Dispatches immediate **Twilio SMS**, **WhatsApp message**, and **In-App Notification**.

### 📱 Multi-Channel Notification Center
- **In-App Notification Feed**: Unread counts, read/unread state toggles, and clear actions.
- **Twilio SMS Alerts**: Instant booking receipts and promotion notices delivered to student mobile numbers.
- **Twilio WhatsApp Integration**: Formatted template notifications delivered directly to WhatsApp.

### 🤖 AI-Powered Executive Analytics (Groq SDK + Llama 3)
- Real-time aggregation of **Total Active Bookings**, **Overall Utilization Rate (%)**, **Peak Demand Hours**, **No-Show Rate (%)**, and **Top Demanded Ground**.
- Automated operational recommendations powered by **Groq SDK** (`llama-3.1-8b-instant` / `llama-3.3-70b-versatile`) advising sports managers on court reallocation, net expansions, and no-show policies.

### 🛡️ Admin & Operations Management Dashboard
- **Maintenance Locking**: Lock specific courts or ground slots for emergency maintenance or repairs.
- **Inter-Hostel Event & Tournament Approvals**: Process approval/rejection requests submitted by student sports secretaries for campus events (e.g., Spardha 2026).
- **Attendance & Penalty Enforcement**: Mark student attendance (`ATTENDED` vs `NO-SHOW`) to enforce court discipline.

### ⭐ Student Ratings & Reviews
- Rate facilities on a 5-star scale with text reviews and image attachments.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 (Vite)** | Single Page Application UI rendering |
| **Styling** | **Tailwind CSS + PostCSS** | Modern responsive dark-mode campus UI |
| **Icons & UI** | **Lucide React** | High quality vector icon sets |
| **State & Data Fetching**| **TanStack React Query v5** | Server state caching & automatic query invalidation |
| **Routing** | **React Router DOM v6** | Client-side page navigation |
| **Backend Runtime** | **Node.js (ES Modules)** | Asynchronous event-driven server runtime |
| **Web Server** | **Express.js** | RESTful API routes & webhook handlers |
| **Database Engine** | **SQLite3 / PostgreSQL** | Dual-engine support (SQLite local file / Postgres production pool) |
| **AI Inference** | **Groq SDK (Llama 3)** | Executive analytics recommendations generation |
| **Notifications** | **Twilio API** | Multi-channel SMS and WhatsApp notification delivery |
| **Environment Config** | **dotenv** | Configurable API keys & credentials |

---

## 📁 Repository Structure

```
Sports-Facility-Booking-System/
├── backend/
│   ├── services/
│   │   ├── groqService.js       # Groq AI Llama 3 analytics integration
│   │   └── twilioService.js     # Twilio SMS & WhatsApp notification engine
│   ├── database.js              # Dual SQLite/Postgres query layer & migrations
│   ├── server.js                # Express API routes & concurrency handling
│   ├── package.json
│   └── .env                     # Server & API key configuration
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios / fetch API clients
│   │   ├── components/          # Reusable UI components & modals
│   │   ├── hooks/               # Custom React hooks & Auth context
│   │   ├── pages/               # Landing, Facilities, Slot Grid, Analytics
│   │   ├── app.jsx              # Main routes & Admin guards
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── scripts/
│   └── test-concurrent-booking.js # CLI script for race-condition simulation
└── README.md
```

---

## 💻 Instructions for How to Use / Run on Your Computer

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher) — [Download Node.js](https://nodejs.org/)
- **npm** (v9.0.0 or higher)
- **Git**

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/abhyudayashukla1101/Sports-Facility-Booking-System.git
cd Sports-Facility-Booking-System
```

---

### Step 2: Set Up & Run Backend Server

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration (`.env`):
   The backend comes pre-configured with SQLite database fallback out-of-the-box. You can inspect or update `backend/.env`:
   ```env
   PORT=8000
   GROQ_API_KEY=your_groq_api_key_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+18005550199
   TWILIO_WHATSAPP_NUMBER=+14155238886
   ```
   *(Note: If Groq or Twilio credentials are not set, the system gracefully falls back to built-in analytics algorithms and in-app notifications without crashing).*

4. Start the Backend Server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The backend API will start on **`http://localhost:8000`** and automatically seed initial campus facilities into `sports_booking.db`.

---

### Step 3: Set Up & Run Frontend Application

1. Open a new terminal window/tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

### Step 4: Login & Demo Credentials

#### 👨‍🎓 Student Sign In / Registration
- Click **"Student Sign In"** or **"Register"** in the top navigation bar.
- Demo Roll Numbers: `220101045` (Abhyudaya), `210102033` (Devansh), `210101088` (Rohan)
- Default Student Passcode: `student123` (or register a new student account).

#### 🛡️ Admin / Sports Officer Access
- Click **"Admin Dashboard"** in the navigation bar.
- Admin Passcode: **`iitgadmin`** (or `123456` / `admin`)
- Access real-time usage metrics, AI recommendations, maintenance locks, and event approvals.

---

### Step 5: Testing Concurrency & Race Conditions

You can run the simultaneous booking race test using either of two methods:

#### Method A: Via Web UI Simulator
1. Log in to the application and navigate to **Admin Dashboard**.
2. Scroll to the **Simultaneous Booking Collision Simulator** component.
3. Select a target facility and time slot, then click **"Launch Race Condition Test"**.
4. Observe 5 concurrent requests fired at the exact same millisecond, resulting in 1 HTTP 200 Success and 4 HTTP 409 Conflicts.

#### Method B: Via CLI Script
Run the automated test script from the project root:
```bash
node scripts/test-concurrent-booking.js
```

---

## 🎯 Summary API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/student-login` | `POST` | Authenticate student by roll number & passcode |
| `/api/auth/register` | `POST` | Register new campus student account |
| `/api/auth/admin-login` | `POST` | Authenticate Gymkhana Admin |
| `/api/facilities` | `GET` | Fetch list of all campus sports facilities |
| `/api/facilities/:id/slots` | `GET` | Fetch real-time slot grid & status for a date |
| `/api/bookings` | `POST` | Reserve a facility slot (Atomic concurrency control) |
| `/api/bookings/my-bookings` | `GET` | Retrieve student's active & past bookings |
| `/api/bookings/:id/cancel` | `POST` | Cancel booking & auto-promote top waitlist candidate |
| `/api/waitlists` | `POST` | Join slot waitlist queue |
| `/api/admin/analytics` | `GET` | Aggregate facility metrics & Groq AI insights |
| `/api/admin/facilities/:id/maintenance` | `PATCH` | Lock/unlock ground for maintenance |
| `/api/admin/approvals` | `GET/PATCH` | Manage inter-hostel tournament approval requests |
| `/api/notifications` | `GET` | Retrieve student in-app notifications feed |

---

## 🤝 Contributing & License

Built with ❤️ for **IIT Guwahati Gymkhana Sports Complex**. Open-source under the MIT License.