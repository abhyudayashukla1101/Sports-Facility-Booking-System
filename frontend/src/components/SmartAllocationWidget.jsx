import { useQuery } from "@tanstack/react-query";
import { Sparkles, Clock, MapPin, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { getRecommendations } from "../api/client";

export default function SmartAllocationWidget({ facilityId, dateKey, slotId, onSelectRecommendation }) {
  const { data: result = {}, isLoading } = useQuery({
    queryKey: ["recommendations", facilityId, dateKey, slotId],
    queryFn: () => getRecommendations({ facilityId, dateKey, slotId }),
    enabled: Boolean(facilityId && dateKey && slotId)
  });

  const recommendations = result.recommendations || [];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 animate-pulse space-y-3">
        <div className="h-4 w-48 rounded bg-surface-border" />
        <div className="h-16 w-full rounded-xl bg-surface-border/50" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-accent/40 bg-surface/95 p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold shadow-md shadow-accent/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-white">
              Smart Allocation Alternatives
            </h4>
            <p className="text-[11px] text-muted font-medium">
              Requested slot is busy. Instant 1-click alternative options available:
            </p>
          </div>
        </div>

        <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[10px] font-extrabold text-accent">
          ⚡ Smart Engine
        </span>
      </div>

      <div className="space-y-2.5 pt-1">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-surface-border bg-base/70 p-3.5 hover:border-accent/60 transition shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                  {rec.matchScore} Match • {rec.badgeText}
                </span>
                <span className="text-xs font-bold text-white">
                  {rec.facilityName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted font-medium">
                <span className="flex items-center gap-1 text-white font-semibold">
                  <Clock className="h-3.5 w-3.5 text-accent" /> {rec.startLabel} - {rec.endLabel} ({rec.dateKey})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted" /> {rec.location}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectRecommendation && onSelectRecommendation(rec)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-md transition hover:brightness-110 active:scale-95 shrink-0"
            >
              <Zap className="h-3.5 w-3.5" /> Select & Book <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
