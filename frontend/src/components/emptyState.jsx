// Reusable "nothing here yet" panel — used by stub pages and empty search results.
export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border bg-surface/50 p-10 text-center">
      <p className="text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}