import { Link } from "react-router-dom";
import { Star, MapPin, Users } from "lucide-react";

export default function FacilityCard({ facility }) {
  return (
    <Link
      to={`/facilities/${facility.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border/90 bg-surface/90 transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5"
    >
      <div className="relative h-48 w-full overflow-hidden bg-base-900">
        <img
          src={facility.image}
          alt={facility.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30 opacity-80" />
        
        <span className="absolute left-3 top-3 rounded-full bg-base/85 px-3 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-md border border-white/10 uppercase">
          {facility.sport}
        </span>

        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-extrabold text-accent-foreground shadow-md">
          <Star className="h-3 w-3 fill-current" strokeWidth={0} />
          {facility.rating}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">
            {facility.name}
          </h3>

          <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{facility.location}</span>
            </span>
            <span className="text-surface-border">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <Users className="h-3.5 w-3.5 text-muted" />
              <span>{facility.capacity}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-border/50 text-xs font-bold text-available tracking-wide">
          {facility.slotDuration} · {facility.hours}
        </div>
      </div>
    </Link>
  );
}
