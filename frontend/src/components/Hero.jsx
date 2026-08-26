import { Trophy, Timer, ShieldCheck, Search } from "lucide-react";
import StatCard from "./StatCard";

export default function Hero({ facilityCount, searchValue, onSearchChange }) {
  return (
    <section className="relative overflow-hidden border-b border-surface-border bg-base min-h-[520px] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-[3px] scale-105 transform transition-transform duration-700"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1800&auto=format&fit=crop')"
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-base/60 via-base/80 to-base"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-base via-base/70 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 w-full">
        <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-bold tracking-wider text-accent uppercase">
          SPORTS BOARD × TECH BOARD
        </span>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl text-white">
          Every ground on campus.
          <br />
          <span className="text-accent">One tap</span> to lock your slot.
        </h1>

        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg leading-relaxed">
          Check live availability across cricket, football, basketball, tennis and more — then confirm a slot that can never be double-booked.
        </p>

        <div className="mt-8 flex max-w-xl items-center gap-3 rounded-full border border-surface-border bg-surface/90 py-2 pl-5 pr-2 backdrop-blur-md shadow-2xl focus-within:border-accent/60 transition">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search a ground, sport or location..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder:text-muted focus:outline-none"
          />
          <button className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-accent-foreground transition hover:brightness-105">
            Search
          </button>
        </div>

        <div className="mt-10 flex max-w-2xl flex-wrap gap-4">
          <StatCard
            icon={Trophy}
            iconColor="text-accent"
            value={facilityCount || 10}
            label="Facilities"
          />
          <StatCard
            icon={Timer}
            iconColor="text-accent"
            value="5 AM – 10 PM"
            label="Open daily"
          />
          <StatCard
            icon={ShieldCheck}
            iconColor="text-available"
            value="0"
            label="Double bookings"
          />
        </div>
      </div>
    </section>
  );
}
