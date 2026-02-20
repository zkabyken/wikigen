import { analyzeRepo } from "./repo-analyzer";
import { buildSubsystemPage } from "./page-builder";
import type { StreamEvent } from "@/types";

export async function generateWikiStream(
  owner: string,
  repo: string,
  emit: (event: StreamEvent) => void
): Promise<void> {
  emit({ type: "status", message: "Fetching repository structure..." });

  const analysis = await analyzeRepo(owner, repo);

  emit({
    type: "analysis",
    repoName: analysis.repoName,
    description: analysis.description,
    subsystems: analysis.subsystems.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    })),
  });

  emit({
    type: "status",
    message: `Found ${analysis.subsystems.length} subsystems. Generating pages...`,
  });

  const promises = analysis.subsystems.map(async (sub) => {
    emit({ type: "status", message: `Writing: ${sub.name}...` });
    const page = await buildSubsystemPage(owner, repo, sub);
    emit({ type: "page", subsystem: page });
    return page;
  });

  await Promise.all(promises);
  emit({ type: "done" });
}
