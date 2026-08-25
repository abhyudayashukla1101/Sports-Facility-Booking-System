import { useState } from "react";
import { X, User, CreditCard, Building, ShieldCheck, Key, GraduationCap, Lock } from "lucide-react";
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
  "Umiam"
];

export default function LoginModal({ onClose, onSuccess, initialTab = "student", subtitle = null }) {
  const { loginAsStudent, loginAsAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // "student" | "admin"

  // Student Form State
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [hostel, setHostel] = useState("Lohit");

  // Admin Form State
  const [passcode, setPasscode] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !rollNumber.trim()) return;

    const loggedInUser = loginAsStudent({
      name: studentName,
      rollNumber,
      hostel
    });

    if (onSuccess) onSuccess(loggedInUser);
    onClose();
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminError("");

    const result = loginAsAdmin(passcode.trim());
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      onClose();
    } else {
      setAdminError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/40">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Playfield IIT Guwahati
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              Account Authentication
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

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 p-2 m-4 rounded-xl bg-base border border-surface-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setAdminError("");
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === "student"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Login as Student
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setAdminError("");
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === "admin"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Login as Admin
          </button>
        </div>

        {/* Student Form */}
        {activeTab === "student" && (
          <form onSubmit={handleStudentSubmit} className="px-5 pb-6 space-y-4">
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
          </form>
        )}

        {/* Admin Form */}
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

            {adminError && (
              <div className="rounded-xl border border-booked/40 bg-booked/10 p-3 text-xs font-semibold text-booked">
                {adminError}
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
