export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <span className="text-sm uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
        404
      </span>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        Sorry, we couldn&apos;t locate that section.
      </p>
    </div>
  );
}
