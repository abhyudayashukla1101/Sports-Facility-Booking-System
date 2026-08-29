export default function FilterChips({ sports, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {sports.map((sport) => {
        const isActive = active === sport;
        return (
          <button
            key={sport}
            onClick={() => onChange(sport)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all shadow-sm ${
              isActive
                ? "bg-accent text-accent-foreground shadow-accent/10 scale-[1.02]"
                : "bg-surface/90 border border-surface-border/80 text-muted hover:text-white hover:border-muted/50"
            }`}
          >
            {sport}
          </button>
        );
      })}
    </div>
  );
}
