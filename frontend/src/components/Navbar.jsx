import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Zap, LogOut, User, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-surface-border bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-md shadow-accent/10 transition group-hover:scale-105">
              <Zap className="h-5 w-5" fill="currentColor" strokeWidth={0} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold tracking-tight text-white">
                Playfield
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-muted">
                IIT GUWAHATI
              </span>
            </span>
          </NavLink>

          {!isAdmin && (
            <nav className="hidden items-center gap-1 rounded-full bg-surface/90 border border-surface-border/50 p-1.5 sm:flex">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-hover text-white shadow-sm font-bold"
                      : "text-muted hover:text-white"
                  }`
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/facilities"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-hover text-white shadow-sm font-bold"
                      : "text-muted hover:text-white"
                  }`
                }
              >
                Facilities
              </NavLink>

              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-hover text-white shadow-sm font-bold"
                      : "text-muted hover:text-white"
                  }`
                }
              >
                My bookings
              </NavLink>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted hover:text-white transition-all flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" /> Contact us
              </button>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Center */}
                <NotificationCenter />
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-available" />
                    )}
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted">
                    {user.role === "admin" ? "Admin Access" : `Roll: ${user.rollNumber}`}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-white hover:border-booked/40 hover:bg-booked/10 transition"
                >
                  <LogOut className="h-3.5 w-3.5 text-booked" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95"
              >
                Sign in / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  );
}
