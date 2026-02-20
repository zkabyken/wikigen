import { Skeleton } from "@/components/ui/skeleton";

export function WikiLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <aside className="flex w-64 shrink-0 flex-col gap-4 border-r bg-muted/30 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-8 w-full" />
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>

      {/* Content skeleton */}
      <main className="flex-1 p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
