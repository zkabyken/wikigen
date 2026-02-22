"use client";

import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/wiki/sidebar";
import { WikiContent } from "@/components/wiki/wiki-content";
import { TableOfContents } from "@/components/wiki/table-of-contents";
import { WikiLoadingSkeleton } from "@/components/wiki/loading-skeleton";
import { ThinkingIndicator } from "@/components/wiki/thinking-indicator";
import { ChatPanel } from "@/components/wiki/chat-panel";
import { useWiki } from "@/hooks/use-wiki";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function WikiPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const searchParams = useSearchParams();

  const owner = params.owner;
  const repo = params.repo;
  const sectionId = searchParams.get("section");

  const { repoName, subsystemList, pages, status, isDone, error } =
    useWiki(owner, repo);

  const readyIds = useMemo(() => new Set(pages.keys()), [pages]);

  // Build wiki context for Q&A from all pages
  const wikiContext = useMemo(() => {
    return Array.from(pages.values())
      .map((p) => {
        // Convert HTML to clean readable text
        const text = p.content
          // Preserve code blocks: <pre><code>...</code></pre> → fenced blocks
          .replace(
            /<pre[^>]*><code[^>]*(?:class="[^"]*language-(\w+)"[^>]*)?>([\s\S]*?)<\/code><\/pre>/gi,
            (_, lang, code) => `\n\`\`\`${lang || ""}\n${code}\n\`\`\`\n`
          )
          // Headings
          .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n### $1\n")
          // List items
          .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
          // Paragraphs and divs → newlines
          .replace(/<\/(p|div|ul|ol|blockquote|section)>/gi, "\n")
          // Line breaks
          .replace(/<br\s*\/?>/gi, "\n")
          // Inline code
          .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
          // Bold
          .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
          // Italic
          .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
          // Links
          .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
          // Strip remaining tags
          .replace(/<[^>]*>/g, "")
          // Decode HTML entities
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, " ")
          // Collapse excessive blank lines
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        return `## ${p.name}\n${p.description}\n\n${text}`;
      })
      .join("\n\n---\n\n");
  }, [pages]);

  const [chatOpen, setChatOpen] = useState(false);
  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    clearMessages,
  } = useChat(wikiContext);

  // Initial loading — no analysis yet
  if (!repoName && !error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        {status && <ThinkingIndicator message={status} />}
        {!status && <WikiLoadingSkeleton />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Generation Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-primary underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Find active subsystem — prefer requested section, fall back to first ready page
  const activeId =
    sectionId && readyIds.has(sectionId)
      ? sectionId
      : [...readyIds][0] ?? null;

  const activeSubsystem = activeId ? pages.get(activeId) : null;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <>
      <Sidebar
        owner={owner}
        repo={repo}
        subsystems={subsystemList}
        pages={pages}
        readyIds={readyIds}
        activeId={activeId ?? undefined}
      />
      <main className="relative flex-1 overflow-y-auto p-10 pb-[50vh]">
        {/* Sticky top bar with status and Ask AI button */}
        {status && !isDone && (
          <div className="mb-6">
            <ThinkingIndicator message={status} />
          </div>
        )}
        {isDone && (
          <div className="sticky top-4 z-10 mb-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen((o) => !o)}
              className="gap-2"
            >
              <Sparkles className="size-3.5" />
              Ask AI
            </Button>
          </div>
        )}

        <div className="flex gap-10">
          <div className="min-w-0 flex-1">
            {activeSubsystem ? (
              <WikiContent repoUrl={repoUrl} subsystem={activeSubsystem} />
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeSubsystem && (
            <TableOfContents html={activeSubsystem.content} />
          )}
        </div>
      </main>

      {/* Q&A Chat Panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        isLoading={chatLoading}
        onSendMessage={sendMessage}
        onClear={clearMessages}
      />
    </>
  );
}
