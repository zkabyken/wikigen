"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/wiki/sidebar";
import { WikiContent } from "@/components/wiki/wiki-content";
import { WikiLoadingSkeleton } from "@/components/wiki/loading-skeleton";
import { ThinkingIndicator } from "@/components/wiki/thinking-indicator";
import { useWiki } from "@/hooks/use-wiki";
import { Skeleton } from "@/components/ui/skeleton";

export default function WikiPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const searchParams = useSearchParams();

  const owner = params.owner;
  const repo = params.repo;
  const sectionId = searchParams.get("section");

  const { repoName, subsystemList, pages, status, isDone, error } =
    useWiki(owner, repo);

  const readyIds = useMemo(() => new Set(pages.keys()), [pages]);

  // Initial loading — no analysis yet
  if (!repoName && !error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        {status && <ThinkingIndicator message={status} />}
        {!status && <WikiLoadingSkeleton />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Generation Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-primary underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Find active subsystem — prefer requested section, fall back to first ready page
  const activeId =
    sectionId && readyIds.has(sectionId)
      ? sectionId
      : [...readyIds][0] ?? null;

  const activeSubsystem = activeId ? pages.get(activeId) : null;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <>
      <Sidebar
        owner={owner}
        repo={repo}
        subsystems={subsystemList}
        readyIds={readyIds}
        activeId={activeId ?? undefined}
      />
      <main className="flex-1 overflow-y-auto p-10">
        {status && !isDone && (
          <div className="mb-6">
            <ThinkingIndicator message={status} />
          </div>
        )}

        {activeSubsystem ? (
          <WikiContent repoUrl={repoUrl} subsystem={activeSubsystem} />
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
