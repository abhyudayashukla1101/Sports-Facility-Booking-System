export default function StatCard({ icon: Icon, iconColor, value, label }) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl border border-surface-border bg-surface/70 px-5 py-4 sm:flex-none">
      <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
      <span className="font-display text-2xl font-bold text-white">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}