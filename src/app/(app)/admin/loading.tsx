import { Card } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-neutral-200" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-neutral-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-7 w-12 animate-pulse rounded bg-neutral-200" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </Card>
    </div>
  );
}
