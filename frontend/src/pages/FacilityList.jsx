import { useMemo, useState } from "react";
import { useFacilities } from "../hooks/useFacilities";
import { SPORTS } from "../data/facilities";
import Hero from "../components/Hero";
import FilterChips from "../components/FilterChips";
import FacilityCard from "../components/FacilityCard";
import EmptyState from "../components/EmptyState";

export default function FacilityList() {
  const [activeSport, setActiveSport] = useState("All sports");
  const [search, setSearch] = useState("");

  const { data: facilities = [], isLoading, isError } = useFacilities();

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSport =
        activeSport === "All sports" || f.sport === activeSport;
      const matchesSearch =
        !search.trim() ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.sport.toLowerCase().includes(search.toLowerCase()) ||
        f.location.toLowerCase().includes(search.toLowerCase());
      return matchesSport && matchesSearch;
    });
  }, [facilities, activeSport, search]);

  return (
    <div>
      <Hero
        facilityCount={facilities.length}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <FilterChips sports={SPORTS} active={activeSport} onChange={setActiveSport} />

        <div className="mt-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            {activeSport === "All sports" ? "All facilities" : activeSport}
          </h2>
          <span className="text-sm text-muted">
            {isLoading ? "Loading…" : `${filtered.length} available`}
          </span>
        </div>

        {isError && (
          <p className="mt-6 text-sm text-booked">
            Couldn't load facilities. Try refreshing.
          </p>
        )}

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-surface-border bg-surface"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No facilities match that search."
              description="Try a different sport or clear your search."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
