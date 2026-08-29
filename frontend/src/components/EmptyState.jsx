export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface/50 p-12 text-center">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
