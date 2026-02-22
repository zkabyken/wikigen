import { tool, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  RepoAnalysisSchema,
  SubsystemPageSchema,
  type RepoAnalysis,
} from "@/lib/schemas";
import {
  fetchRepoTree,
  readFileContent,
  selectKeyFiles,
} from "@/lib/github";
import type { Subsystem } from "@/types";

// --- Core execute functions (called directly by orchestrator) ---

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

export async function buildPage(
  owner: string,
  repo: string,
  subsystem: { id: string; name: string; description: string; relevantFiles: string[] }
): Promise<Subsystem> {
  const fileContents = await Promise.all(
    subsystem.relevantFiles.map(async (path) => {
      try {
        const content = await readFileContent(owner, repo, path);
        return `--- ${path} ---\n${content}`;
      } catch {
        return `--- ${path} ---\n[Could not read file]`;
      }
    })
  );

  const { object } = await generateObject({
    model: openai("gpt-5-mini"),
    schema: SubsystemPageSchema,
    maxOutputTokens: 4096,
    system: `You are a technical wiki writer. Generate detailed, well-structured documentation for a repository subsystem.

GUIDELINES:
- Write content as HTML using <p>, <h2>, <h3>, <ul>, <ol>, <code>, <pre> tags.
- Explain what the subsystem does, how it works, and how the pieces connect.
- Reference specific files and functions in the text.
- Include short code snippets where helpful (wrap in <pre><code>).
- Aim for 300-600 words of content.
- For citations, include the file path and specific line ranges where the relevant code lives.
- For entry points, list the key functions, API routes, CLI commands, or exports a user would interact with.
- Write for developers — be precise and technical but readable.`,
    prompt: `Generate a wiki page for the "${subsystem.name}" subsystem of ${owner}/${repo}.

Description: ${subsystem.description}

SOURCE FILES:
${fileContents.join("\n\n")}`,
  });

  return {
    id: subsystem.id,
    name: subsystem.name,
    description: subsystem.description,
    content: object.content,
    citations: object.citations.map((c) => ({
      file: c.file,
      lines:
        c.startLine > 0 && c.endLine > 0
          ? ([c.startLine, c.endLine] as [number, number])
          : undefined,
      url: "",
    })),
    entryPoints: object.entryPoints,
  };
}

// --- AI SDK tool() definitions (for LLM-driven orchestration) ---

const RepoAnalysisOutputSchema = z.object({
  repoName: z.string(),
  description: z.string(),
  subsystems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      relevantFiles: z.array(z.string()),
    })
  ),
});

const SubsystemOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  content: z.string(),
  citations: z.array(
    z.object({
      file: z.string(),
      lines: z.tuple([z.number(), z.number()]).optional(),
      url: z.string(),
    })
  ),
  entryPoints: z.array(z.string()),
});

export const analyzeRepoTool = tool({
  description:
    "Analyze a GitHub repository to identify its user-facing subsystems",
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  outputSchema: RepoAnalysisOutputSchema,
  execute: async ({ owner, repo }) => analyzeRepo(owner, repo),
});

export const buildPageTool = tool({
  description: "Generate a detailed wiki page for a specific subsystem",
  inputSchema: z.object({
    owner: z.string(),
    repo: z.string(),
    subsystemId: z.string(),
    subsystemName: z.string(),
    subsystemDescription: z.string(),
    relevantFiles: z.array(z.string()),
  }),
  outputSchema: SubsystemOutputSchema,
  execute: async ({
    owner,
    repo,
    subsystemId,
    subsystemName,
    subsystemDescription,
    relevantFiles,
  }) =>
    buildPage(owner, repo, {
      id: subsystemId,
      name: subsystemName,
      description: subsystemDescription,
      relevantFiles,
    }),
});
