export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-gradient">
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3 shadow-soft">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <span className="text-sm font-medium text-neutral-700">Chargement…</span>
      </div>
    </div>
  );
}
