export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="h-4 w-80 max-w-full rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((slot) => (
          <div
            key={slot}
            className="h-36 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="h-72 rounded-2xl border border-border bg-card" />
    </div>
  );
}
