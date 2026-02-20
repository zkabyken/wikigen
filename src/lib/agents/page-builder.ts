import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { SubsystemPageSchema } from "@/lib/schemas";
import { readFileContent } from "@/lib/github";
import type { AnalyzedSubsystem } from "@/lib/schemas";
import type { Subsystem } from "@/types";

export async function buildSubsystemPage(
  owner: string,
  repo: string,
  subsystem: AnalyzedSubsystem
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
          ? [c.startLine, c.endLine] as [number, number]
          : undefined,
      url: "",
    })),
    entryPoints: object.entryPoints,
  };
}
