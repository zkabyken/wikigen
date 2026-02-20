import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { RepoAnalysisSchema, type RepoAnalysis } from "@/lib/schemas";
import {
  fetchRepoTree,
  readFileContent,
  selectKeyFiles,
} from "@/lib/github";

export async function analyzeRepo(
  owner: string,
  repo: string
): Promise<RepoAnalysis> {
  const tree = await fetchRepoTree(owner, repo);
  const filePaths = tree.map((item) => item.path);

  const keyFiles = selectKeyFiles(tree);
  const keyFileContents = await Promise.all(
    keyFiles.map(async (path) => {
      try {
        const content = await readFileContent(owner, repo, path);
        return `--- ${path} ---\n${content}`;
      } catch {
        return `--- ${path} ---\n[Could not read file]`;
      }
    })
  );

  const treeString = filePaths.slice(0, 500).join("\n");

  const { object } = await generateObject({
    model: openai("gpt-5-mini"),
    schema: RepoAnalysisSchema,
    maxOutputTokens: 4096,
    system: `You are a repository analyzer. Your job is to identify the user-facing subsystems of a GitHub repository.

RULES:
- Identify 3-7 subsystems based on FEATURES and CAPABILITIES the software provides to users.
- Each subsystem should answer: "What can a user DO with this?"
- BAD subsystem names: "Utilities", "Config", "Types", "Database Layer", "Frontend", "Backend", "API"
- GOOD subsystem names: "Authentication & Login", "Search & Filtering", "CLI Commands", "Plugin System", "Data Export"
- For each subsystem, list the most relevant source files (max 8 per subsystem).
- The id field must be URL-safe kebab-case (e.g. "user-authentication").`,
    prompt: `Analyze this repository: ${owner}/${repo}

FILE TREE:
${treeString}

KEY FILES:
${keyFileContents.join("\n\n")}

Identify the user-facing subsystems of this repository.`,
  });

  return object;
}
