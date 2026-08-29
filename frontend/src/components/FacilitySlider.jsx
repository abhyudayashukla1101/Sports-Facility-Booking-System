import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";

export default function FacilitySlider({ facilities = [] }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const timerRef = useRef(null);
  const thumbRefs = useRef([]);

  const total = facilities.length;

  // Handle next & prev
  const nextSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Smooth auto-slide (3s interval)
  useEffect(() => {
    if (total === 0 || isHovered) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isHovered, currentIndex]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbRefs.current[currentIndex]) {
      thumbRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }, [currentIndex]);

  if (!facilities || facilities.length === 0) {
    return null;
  }

  const currentFacility = facilities[currentIndex] || facilities[0];

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold tracking-wider text-accent uppercase flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Live Facility Showcase
          </span>
          <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
            Available Campus Facilities
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/facilities"
            className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-4 py-2 text-xs font-extrabold text-accent hover:border-accent/50 hover:bg-surface-hover transition shadow-md"
          >
            View All Facilities ({total}) <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* AUTOMATICALLY SLIDING HERO CAROUSEL */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-3xl border border-surface-border/90 bg-surface shadow-2xl transition-all"
      >
          {/* HERO IMAGE CONTAINER WITH FADE TRANSITION */}
          <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden bg-base">
            <img
              key={currentFacility.id}
              src={currentFacility.image}
              alt={currentFacility.name}
              className="h-full w-full object-cover transition-opacity duration-700 ease-in-out scale-105"
            />
            {/* Gradient Overlays for readable text */}
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-base/90 via-base/40 to-transparent" />

            {/* TOP BADGES */}
            <div className="absolute left-6 top-6 flex items-center gap-2">
              <span className="rounded-full border border-accent/40 bg-accent/20 px-3.5 py-1 text-xs font-extrabold text-accent backdrop-blur-md uppercase tracking-wider shadow-md">
                {currentFacility.sport}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-extrabold text-yellow-400 backdrop-blur-md shadow-md">
                <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                {currentFacility.rating} Rating
              </span>
            </div>

            {/* MAIN OVERLAY CONTENT */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-4 max-w-3xl">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-sm">
                  <MapPin className="h-4 w-4 text-accent" /> {currentFacility.location}
                </span>
                <h3 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-5xl tracking-tight leading-tight drop-shadow-md">
                  {currentFacility.name}
                </h3>
                <p className="mt-2 text-base text-white font-bold sm:text-lg line-clamp-2 max-w-2xl leading-relaxed drop-shadow-md">
                  {currentFacility.description}
                </p>
              </div>

              {/* FACILITY METRICS */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white pt-1">
                <span className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-base/80 px-3 py-1.5 backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-accent" /> Hours: {currentFacility.hours}
                </span>
                <span className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-base/80 px-3 py-1.5 backdrop-blur-md">
                  <Users className="h-3.5 w-3.5 text-accent" /> Capacity: {currentFacility.capacity} players
                </span>
                <span className="rounded-xl border border-surface-border bg-base/80 px-3 py-1.5 backdrop-blur-md text-accent font-extrabold">
                  {currentFacility.slotDuration}
                </span>
              </div>

              {/* BOOK COURT ACTION */}
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/facilities/${currentFacility.id}`)}
                  className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3 text-sm font-extrabold text-accent-foreground shadow-xl shadow-accent/20 transition hover:brightness-110 hover:scale-105 active:scale-95"
                >
                  Book {currentFacility.name} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* PREVIOUS / NEXT SLIDE ARROWS */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md shadow-xl hover:bg-accent hover:text-accent-foreground transition hover:scale-110"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md shadow-xl hover:bg-accent hover:text-accent-foreground transition hover:scale-110"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* BOTTOM THUMBNAIL STRIP & DOT INDICATORS */}
          <div className="border-t border-surface-border bg-base/90 p-4 space-y-3">
            {/* Dot Indicators & Slide Count */}
            <div className="flex items-center justify-between px-2 text-xs text-muted font-semibold">
              <span>
                Showing <strong className="text-white">{currentIndex + 1}</strong> of <strong className="text-white">{total}</strong> facilities
              </span>
              <div className="flex items-center gap-1.5">
                {facilities.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "w-8 bg-accent"
                        : "w-2 bg-surface-border hover:bg-white/40"
                    }`}
                    aria-label={`Jump to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Horizontal Scrollable Thumbnails (Scrollbars strictly hidden) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {facilities.map((fac, idx) => (
                <div
                  key={fac.id}
                  ref={(el) => (thumbRefs.current[idx] = el)}
                  onClick={() => setCurrentIndex(idx)}
                  className={`group relative flex-shrink-0 w-36 h-20 rounded-xl overflow-hidden cursor-pointer border transition-all ${
                    idx === currentIndex
                      ? "border-accent ring-2 ring-accent/50 scale-105 shadow-lg"
                      : "border-surface-border opacity-60 hover:opacity-100 hover:border-white/40"
                  }`}
                >
                  <img
                    src={fac.image}
                    alt={fac.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-bold text-white truncate block">
                    {fac.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
