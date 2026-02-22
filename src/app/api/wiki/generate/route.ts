import { NextRequest } from "next/server";
import { GenerateWikiRequestSchema, QARequestSchema } from "@/lib/schemas";
import { generateWikiStream } from "@/lib/agents/orchestrator";
import { answerQuestion } from "@/lib/agents/qa-agent";
import type { StreamEvent, QAStreamEvent } from "@/types";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const flow = (body as { flow?: string })?.flow;

  if (flow === "qa") {
    return handleQA(body);
  }

  return handleGenerate(body);
}

function handleGenerate(body: unknown) {
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

  return new Response(stream, { headers: SSE_HEADERS });
}

function handleQA(body: unknown) {
  const parsed = QARequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }

  const { question, wikiContext, history } = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function emit(event: QAStreamEvent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }

      try {
        await answerQuestion(question, wikiContext, history, emit);
      } catch (error) {
        console.error("QA failed:", error);
        emit({ type: "error", message: "Failed to answer question." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
