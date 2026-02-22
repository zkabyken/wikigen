import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { QAStreamEvent } from "@/types";

export async function answerQuestion(
  question: string,
  wikiContext: string,
  history: { role: "user" | "assistant"; content: string }[],
  emit: (event: QAStreamEvent) => void
): Promise<void> {
  emit({ type: "qa-thinking", content: "Analyzing question against wiki content..." });

  const result = streamText({
    model: openai("gpt-5-mini"),
    system: `You are a helpful Q&A assistant for developer documentation.
Answer questions based ONLY on the provided wiki content.
If the answer is not in the wiki content, say so clearly.

FORMATTING RULES — you MUST follow these:
- Always format your final answer in rich Markdown.
- Use headings (## or ###) to organize multi-part answers.
- Use bullet lists or numbered lists when listing items, steps, or options.
- Wrap all code (file names, function names, variables, commands) in inline \`backticks\`.
- Use fenced code blocks (\`\`\`lang) with a language identifier for any multi-line code snippets.
- Use **bold** for key terms and emphasis.
- Use > blockquotes when quoting from the documentation.
- Reference specific sections or files from the wiki when relevant.
- Keep paragraphs short and scannable.

Before answering, think step by step. Wrap your thinking in <think>...</think> tags.
Each <think> block should be a single reasoning step. You may use multiple <think> blocks.
Then provide your final answer outside any tags.`,
    messages: [
      { role: "user", content: `Wiki documentation:\n${wikiContext}` },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: question },
    ],
  });

  const OPEN_TAG = "<think>";
  const CLOSE_TAG = "</think>";

  let inThinkBlock = false;
  let thinkBuffer = "";
  let pendingContent = ""; // buffer for potential partial tags between chunks
  let hasEmittedContent = false; // track if we've emitted any answer content yet

  function emitDelta(content: string) {
    if (!hasEmittedContent) {
      content = content.trimStart();
      if (!content) return;
      hasEmittedContent = true;
    }
    emit({ type: "qa-delta", content });
  }

  // Check if `text` ends with any prefix of `tag` (e.g. "<", "<t", "<th", ...)
  function partialTagSuffixLen(text: string, tag: string): number {
    for (let len = Math.min(text.length, tag.length - 1); len > 0; len--) {
      if (text.endsWith(tag.slice(0, len))) return len;
    }
    return 0;
  }

  for await (const chunk of (await result).textStream) {
    let remaining = pendingContent + chunk;
    pendingContent = "";

    while (remaining.length > 0) {
      if (inThinkBlock) {
        const closeIdx = remaining.indexOf(CLOSE_TAG);
        if (closeIdx !== -1) {
          thinkBuffer += remaining.slice(0, closeIdx);
          if (thinkBuffer.trim()) {
            emit({ type: "qa-thinking", content: thinkBuffer.trim() });
          }
          thinkBuffer = "";
          inThinkBlock = false;
          remaining = remaining.slice(closeIdx + CLOSE_TAG.length);
        } else {
          // Check for partial </think> at the end
          const partial = partialTagSuffixLen(remaining, CLOSE_TAG);
          if (partial > 0) {
            thinkBuffer += remaining.slice(0, -partial);
            pendingContent = remaining.slice(-partial);
          } else {
            thinkBuffer += remaining;
          }
          remaining = "";
        }
      } else {
        const openIdx = remaining.indexOf(OPEN_TAG);
        if (openIdx !== -1) {
          const before = remaining.slice(0, openIdx);
          if (before.trim()) {
            emitDelta(before);
          }
          inThinkBlock = true;
          remaining = remaining.slice(openIdx + OPEN_TAG.length);
        } else {
          // Check for partial <think> at the end
          const partial = partialTagSuffixLen(remaining, OPEN_TAG);
          if (partial > 0) {
            const safe = remaining.slice(0, -partial);
            if (safe) emitDelta(safe);
            pendingContent = remaining.slice(-partial);
          } else {
            if (remaining) emitDelta(remaining);
          }
          remaining = "";
        }
      }
    }
  }

  // Flush remaining buffers
  if (pendingContent) {
    if (inThinkBlock) {
      thinkBuffer += pendingContent;
    } else {
      emitDelta(pendingContent);
    }
  }
  if (thinkBuffer.trim()) {
    emit({ type: "qa-thinking", content: thinkBuffer.trim() });
  }

  emit({ type: "done" });
}
