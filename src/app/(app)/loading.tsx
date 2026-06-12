export default function AppLoading() {
  return (
    <div className="animate-stagger space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
