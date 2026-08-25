import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Zap, LogOut, User, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-surface-border bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
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

          {/* Navigation links: Facilities, My Bookings, Contact Us */}
          <nav className="hidden items-center gap-1 rounded-full bg-surface/90 border border-surface-border/50 p-1.5 sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-surface-hover text-white shadow-sm"
                    : "text-muted hover:text-white"
                }`
              }
            >
              Facilities
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-surface-hover text-white shadow-sm"
                    : "text-muted hover:text-white"
                }`
              }
            >
              My bookings
            </NavLink>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="rounded-full px-5 py-1.5 text-sm font-medium text-muted hover:text-white transition-all flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" /> Contact us
            </button>

            {/* Dynamic Admin Link when logged in as Admin */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-accent hover:bg-accent/10"
                  }`
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Admin Dashboard
              </NavLink>
            )}
          </nav>

          {/* User Profile / Sign in Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
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
                  onClick={logout}
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
                className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Contact Us Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  );
}