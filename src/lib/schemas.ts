import { z } from "zod";

// Agent 1 output: Repo Analyzer
export const AnalyzedSubsystemSchema = z.object({
  id: z.string().describe("URL-safe kebab-case identifier"),
  name: z.string().describe("Human-readable subsystem name"),
  description: z
    .string()
    .describe("One-sentence description of what this subsystem does for the user"),
  relevantFiles: z
    .array(z.string())
    .describe("File paths in the repo most relevant to this subsystem (max 8)"),
});

export const RepoAnalysisSchema = z.object({
  repoName: z.string(),
  description: z.string().describe("One-sentence description of the repository"),
  subsystems: z
    .array(AnalyzedSubsystemSchema)
    .describe(
      "3-7 user-facing subsystems, NOT technical layers like 'utils' or 'config'"
    ),
});

export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;
export type AnalyzedSubsystem = z.infer<typeof AnalyzedSubsystemSchema>;

// Agent 2 output: Page Builder
export const CitationSchema = z.object({
  file: z.string().describe("File path relative to repo root"),
  startLine: z.number().describe("Starting line number, use 0 if unknown"),
  endLine: z.number().describe("Ending line number, use 0 if unknown"),
});

export const SubsystemPageSchema = z.object({
  content: z
    .string()
    .describe(
      "Wiki page content as HTML. Use <p>, <h2>, <h3>, <ul>, <ol>, <code>, <pre> tags. Be thorough and detailed."
    ),
  citations: z.array(CitationSchema),
  entryPoints: z
    .array(z.string())
    .describe("Key entry points like API routes, CLI commands, exported functions"),
});

export type SubsystemPage = z.infer<typeof SubsystemPageSchema>;

// API request — wiki generation
export const GenerateWikiRequestSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

// API request — Q&A chat
export const QARequestSchema = z.object({
  question: z.string().min(1),
  wikiContext: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});
