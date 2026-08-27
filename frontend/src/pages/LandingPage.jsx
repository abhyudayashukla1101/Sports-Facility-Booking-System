import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Activity,
  Flame,
  Award,
  CheckCircle2
} from "lucide-react";
import { useFacilities } from "../hooks/useFacilities";
import { useAuth } from "../hooks/useAuth";
import LoginModal from "../components/LoginModal";
import EventRequestModal from "../components/EventRequestModal";
import FacilitySlider from "../components/FacilitySlider";

const UPCOMING_EVENTS = [
  {
    id: "evt-1",
    title: "Spardha 2026: Annual IITG Sports Fest",
    category: "Inter-College Tournament",
    date: "Oct 12 – Oct 15, 2026",
    venue: "SAC Sports Complex & Outdoor Grounds",
    teams: "32 IITs & NITs Participating",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
    description: "The flagship annual sports extravaganza featuring athletics, cricket, football, badminton, and aquatic events."
  },
  {
    id: "evt-2",
    title: "Inter-Hostel Badminton & Tennis Super League",
    category: "Campus League",
    date: "Sep 05 – Sep 08, 2026",
    venue: "SAC Indoor Badminton Hall & Tennis Courts",
    teams: "14 Hostels Competing",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop",
    description: "Annual clash of hostels for the coveted Gymkhana Sports Shield. Singles and doubles categories."
  },
  {
    id: "evt-3",
    title: "IIT Guwahati Campus Aquatic Meet 2026",
    category: "Swimming Championship",
    date: "Sep 18, 2026",
    venue: "IITG Olympic Swimming Pool",
    teams: "Open to All IITG Students",
    image: "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?q=80&w=800&auto=format&fit=crop",
    description: "50m freestyle, backstroke, relay races, and water polo exhibition matches."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: facilities = [], isLoading } = useFacilities();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInitialTab, setLoginInitialTab] = useState("student");
  const [showEventModal, setShowEventModal] = useState(false);

  const openSignIn = () => {
    setLoginInitialTab("student");
    setShowLoginModal(true);
  };

  const openRegister = () => {
    setLoginInitialTab("register");
    setShowLoginModal(true);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-surface-border bg-gradient-to-b from-base via-surface/60 to-base py-16 sm:py-24">
        {/* Background Decorative Glow */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-extrabold text-accent shadow-md backdrop-blur-md">
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            Official IIT Guwahati Gymkhana Sports Portal
          </div>

          <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold text-white sm:text-6xl lg:text-7xl tracking-tight leading-tight">
            Reserve Campus Sports Facilities <span className="text-accent">In Real Time</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-muted/90 sm:text-lg font-medium leading-relaxed">
            Instant court reservations, automated waitlists, Twilio SMS & WhatsApp alerts, and AI-powered capacity analytics for IIT Guwahati students & faculty.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/facilities"
              className="flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-accent-foreground shadow-xl shadow-accent/25 transition hover:brightness-110 active:scale-95"
            >
              Explore All Facilities <ArrowRight className="h-4 w-4" />
            </Link>

            {!user ? (
              <button
                onClick={openRegister}
                className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:border-accent/50 hover:bg-surface-hover transition"
              >
                <UserPlus className="h-4 w-4 text-accent" /> Create Account / Register
              </button>
            ) : (
              <Link
                to="/bookings"
                className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:border-accent/50 hover:bg-surface-hover transition"
              >
                <Trophy className="h-4 w-4 text-accent" /> View My Bookings
              </Link>
            )}
          </div>

          {/* Stats Bar */}
          <div className="pt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-4 shadow-xl">
              <span className="block font-display text-2xl font-extrabold text-white">6 Grounds</span>
              <span className="text-xs text-muted font-medium">Indoor & Outdoor Courts</span>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-4 shadow-xl">
              <span className="block font-display text-2xl font-extrabold text-accent">6 AM – 10 PM</span>
              <span className="text-xs text-muted font-medium">Daily Operating Hours</span>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-4 shadow-xl">
              <span className="block font-display text-2xl font-extrabold text-available">0 Collision</span>
              <span className="text-xs text-muted font-medium">Double-Booking Guard</span>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-4 shadow-xl">
              <span className="block font-display text-2xl font-extrabold text-white">Twilio SMS</span>
              <span className="text-xs text-muted font-medium">WhatsApp & Web Alerts</span>
            </div>
          </div>
        </div>
      </section>

      {/* AUTOMATICALLY SLIDING FEATURED FACILITIES SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-3xl bg-surface border border-surface-border" />
        ) : (
          <FacilitySlider facilities={facilities} />
        )}
      </section>

      {/* UPCOMING EVENTS & TOURNAMENTS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        <div className="rounded-3xl border border-surface-border bg-surface p-8 shadow-2xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold tracking-wider text-accent uppercase flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-accent" /> IIT Guwahati Gymkhana Calendar
              </span>
              <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                Upcoming Sports Events & Tournaments
              </h2>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  openSignIn();
                  return;
                }
                setShowEventModal(true);
              }}
              className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5 text-xs font-bold text-accent hover:bg-accent hover:text-accent-foreground transition shadow-md"
            >
              <Trophy className="h-4 w-4" /> Request Tournament / Event Match
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {UPCOMING_EVENTS.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/80 shadow-xl transition hover:border-accent/40"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-black/30" />
                  <span className="absolute left-3 top-3 rounded-full bg-accent/90 px-3 py-1 text-[10px] font-extrabold text-accent-foreground shadow-md uppercase">
                    {evt.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-white leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-surface-border/60 space-y-1.5 text-xs font-medium text-muted">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-accent" /> {evt.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted" /> {evt.venue}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTRATION & SIGN IN CTA BANNER */}
      {!user && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/15 via-surface to-accent/15 p-8 sm:p-12 shadow-2xl text-center space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <UserPlus className="h-6 w-6" />
            </div>

            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl max-w-2xl mx-auto leading-tight">
              Join IIT Guwahati Playfield Today
            </h2>

            <p className="max-w-xl mx-auto text-sm text-muted font-medium">
              Create your student account with your Roll Number to instantly reserve grounds, join waitlist queues, receive Twilio SMS/WhatsApp updates, and track your attendance.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={openRegister}
                className="flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground shadow-xl shadow-accent/20 hover:brightness-110 transition"
              >
                <UserPlus className="h-4 w-4" /> Create Student Account
              </button>

              <button
                onClick={openSignIn}
                className="flex items-center gap-2 rounded-full border border-surface-border bg-surface px-6 py-3.5 text-sm font-bold text-white hover:bg-surface-hover transition"
              >
                <LogIn className="h-4 w-4 text-accent" /> Sign In
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          initialTab={loginInitialTab}
        />
      )}

      {showEventModal && (
        <EventRequestModal
          facility={facilities[0] || { id: "badminton-hall", name: "Badminton Hall" }}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  );
}
