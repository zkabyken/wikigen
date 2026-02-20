import { analyzeRepo } from "./repo-analyzer";
import { buildSubsystemPage } from "./page-builder";
import type { WikiStructure } from "@/types";

export async function generateWiki(
  owner: string,
  repo: string
): Promise<WikiStructure> {
  const analysis = await analyzeRepo(owner, repo);

  const subsystems = await Promise.all(
    analysis.subsystems.map((sub) => buildSubsystemPage(owner, repo, sub))
  );

  return {
    repoName: analysis.repoName,
    repoUrl: `https://github.com/${owner}/${repo}`,
    description: analysis.description,
    subsystems,
  };
}
