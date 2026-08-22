export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
      <h3 className="font-display text-lg text-pine-dark mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink/60 max-w-md mx-auto">{description}</p>
      )}
    </div>
  );
}
