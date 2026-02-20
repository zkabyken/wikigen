"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/wiki/sidebar";
import { WikiContent } from "@/components/wiki/wiki-content";
import { WikiLoadingSkeleton } from "@/components/wiki/loading-skeleton";
import { useWiki } from "@/hooks/use-wiki";

export default function WikiPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const searchParams = useSearchParams();

  const owner = params.owner;
  const repo = params.repo;
  const sectionId = searchParams.get("section");

  const { wiki, isLoading, error } = useWiki(owner, repo);

  if (isLoading) return <WikiLoadingSkeleton />;

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

  if (!wiki) return null;

  const activeSubsystem =
    wiki.subsystems.find((s) => s.id === sectionId) ?? wiki.subsystems[0];
  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <>
      <Sidebar
        owner={owner}
        repo={repo}
        subsystems={wiki.subsystems}
        activeId={activeSubsystem.id}
      />
      <main className="flex-1 overflow-y-auto p-10">
        <WikiContent repoUrl={repoUrl} subsystem={activeSubsystem} />
      </main>
    </>
  );
}
