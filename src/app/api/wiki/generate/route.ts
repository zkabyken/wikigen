import { NextRequest } from "next/server";
import { GenerateWikiRequestSchema } from "@/lib/schemas";
import { generateWikiStream } from "@/lib/agents/orchestrator";
import type { StreamEvent } from "@/types";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const parsed = GenerateWikiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }

  const { owner, repo } = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function emit(event: StreamEvent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }

      try {
        await generateWikiStream(owner, repo, emit);
      } catch (error) {
        console.error("Wiki generation failed:", error);
        const message =
          error instanceof Error &&
          error.message.includes("GitHub API error")
            ? "Repository not found or not accessible."
            : "Failed to generate wiki. Please try again.";
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
