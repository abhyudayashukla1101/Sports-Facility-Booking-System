import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, CreditCard, Building, ShieldCheck, Key, GraduationCap, Lock, Phone, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const HOSTELS = [
  "Lohit",
  "Kapili",
  "Barak",
  "Brahmaputra",
  "Dihing",
  "Kameng",
  "Manas",
  "Siang",
  "Subansiri",
  "Dhansiri",
  "Disang",
  "Umiam",
  "Torsa",
  "Dibang"
];

export default function LoginModal({ onClose, onSuccess, initialTab = "student", subtitle = null }) {
  const { loginAsStudent, registerStudentAccount, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // "student" | "admin" | "register"
  const [authError, setAuthError] = useState("");

  // Student Sign In State
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [hostel, setHostel] = useState("Lohit");

  // Registration State
  const [regName, setRegName] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regHostel, setRegHostel] = useState("Lohit");
  const [regPhone, setRegPhone] = useState("");
  const [regPasscode, setRegPasscode] = useState("");

  // Admin State
  const [passcode, setPasscode] = useState("");

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!studentName.trim() || !rollNumber.trim()) return;

    const result = await loginAsStudent({
      name: studentName,
      rollNumber,
      hostel
    });

    if (result.success && result.user) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    } else {
      setAuthError(result.error || "No registered account found. Please click 'Create an account' to register first.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!regName.trim() || !regRoll.trim()) {
      setAuthError("Name and Roll Number are required.");
      return;
    }

    const result = await registerStudentAccount({
      name: regName,
      rollNumber: regRoll,
      hostel: regHostel,
      phone: regPhone,
      passcode: regPasscode
    });

    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    } else {
      setAuthError(result.error || "Registration failed.");
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    const result = await loginAsAdmin(passcode.trim());
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
      navigate("/admin");
    } else {
      setAuthError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/40">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Playfield IIT Guwahati
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              {activeTab === "register" ? "Create New Account" : "Account Authentication"}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-available font-semibold">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-border hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1.5 m-4 rounded-xl bg-base border border-surface-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setAuthError("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition ${
              activeTab === "student"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setAuthError("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition ${
              activeTab === "register"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Register
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setAuthError("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition ${
              activeTab === "admin"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </button>
        </div>

        {/* TAB 1: STUDENT SIGN IN */}
        {activeTab === "student" && (
          <form onSubmit={handleStudentSubmit} className="px-5 pb-6 space-y-4">
            {authError && (
              <div className="rounded-xl border border-booked/40 bg-booked/10 p-3 text-xs font-semibold text-booked animate-fadeIn flex flex-col gap-1">
                <span>{authError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError("");
                    setActiveTab("register");
                  }}
                  className="text-left font-bold text-accent hover:underline mt-1"
                >
                  → Click here to Register a new account
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhyudaya Shukla"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                IITG Roll Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 220101045"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Hostel
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2.5 pl-9 pr-3 text-sm text-white focus:border-accent focus:outline-none"
                >
                  {HOSTELS.map((h) => (
                    <option key={h} value={h} className="bg-surface text-white">
                      {h} Hostel
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95"
            >
              Sign in as Student
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-muted">New student at IITG? </span>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className="text-xs font-bold text-accent hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: STUDENT REGISTRATION (NEW ACCOUNT) */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="px-5 pb-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanshu Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                IITG Roll Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 230101001"
                  value={regRoll}
                  onChange={(e) => setRegRoll(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Hostel Residence
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <select
                  value={regHostel}
                  onChange={(e) => setRegHostel(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2 pl-9 pr-3 text-sm text-white focus:border-accent focus:outline-none"
                >
                  {HOSTELS.map((h) => (
                    <option key={h} value={h} className="bg-surface text-white">
                      {h} Hostel
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Mobile Number (for SMS & WhatsApp Alerts)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Passcode / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="password"
                  placeholder="Set account passcode"
                  value={regPasscode}
                  onChange={(e) => setRegPasscode(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-booked/40 bg-booked/10 p-3 text-xs font-semibold text-booked">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Create Student Account
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-muted">Already registered? </span>
              <button
                type="button"
                onClick={() => setActiveTab("student")}
                className="text-xs font-bold text-accent hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADMIN LOGIN */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminSubmit} className="px-5 pb-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Admin Security Passcode
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="password"
                  required
                  placeholder="Enter admin passcode (e.g. iitgadmin)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-base/90 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                Demo admin passcode: <code className="text-accent font-mono font-bold">iitgadmin</code> or <code className="text-accent font-mono font-bold">123456</code>
              </p>
            </div>

            {authError && (
              <div className="rounded-xl border border-booked/40 bg-booked/10 p-3 text-xs font-semibold text-booked">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95"
            >
              <Lock className="h-4 w-4" /> Sign in as Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
