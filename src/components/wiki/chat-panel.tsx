"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { X, Trash2, Send, SearchIcon, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const streamdownPlugins = { code };

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (question: string) => void;
  onClear: () => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  onClear,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(384);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(Math.max(window.innerWidth - ev.clientX, 320), 800);
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const panelStyle = useMemo(() => ({ width }), [width]);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 flex h-screen w-full flex-col border-l bg-background transition-transform duration-300",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
      )}
      style={panelStyle}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Ask about this wiki</h3>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon-xs" onClick={onClear} title="Clear chat">
              <Trash2 />
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" onClick={onClose} title="Close">
            <X />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <SearchIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Ask a question about the generated documentation.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {msg.content}
                </div>
              ) : (
                <div className="mr-4 min-w-0 space-y-2">
                  {/* Chain of thought */}
                  {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                    <ChainOfThought defaultOpen={msg.isStreaming}>
                      <ChainOfThoughtHeader>
                        Reasoning ({msg.thinkingSteps.length} steps)
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        {msg.thinkingSteps.map((step, i) => (
                          <ChainOfThoughtStep
                            key={i}
                            label={step}
                            status={
                              msg.isStreaming &&
                              i === msg.thinkingSteps!.length - 1 &&
                              !msg.content
                                ? "active"
                                : "complete"
                            }
                          />
                        ))}
                      </ChainOfThoughtContent>
                    </ChainOfThought>
                  )}

                  {/* Answer */}
                  {msg.content ? (
                    <Streamdown
                      className="chat-streamdown max-w-full text-sm"
                      animated
                      plugins={streamdownPlugins}
                      isAnimating={!!msg.isStreaming}
                    >
                      {msg.content}
                    </Streamdown>
                  ) : (
                    msg.isStreaming && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <LoaderCircle className="size-3 animate-spin" />
                        Thinking...
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            className="h-8 text-xs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim()}
          >
            <Send className="size-3" />
          </Button>
        </div>
      </form>
    </aside>
  );
}
