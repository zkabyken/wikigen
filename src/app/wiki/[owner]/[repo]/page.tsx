"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/wiki/sidebar";
import { WikiContent } from "@/components/wiki/wiki-content";
import { PLACEHOLDER_WIKI } from "@/lib/placeholder-data";

export default function WikiPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const searchParams = useSearchParams();

  const owner = params.owner;
  const repo = params.repo;
  const sectionId = searchParams.get("section");

  const wiki = PLACEHOLDER_WIKI;
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
