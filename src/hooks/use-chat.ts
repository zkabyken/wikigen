"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, QAStreamEvent } from "@/types";

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => void;
  clearMessages: () => void;
}

export function useChat(wikiContext: string): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep a ref in sync so sendMessage always has the latest messages
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        thinkingSteps: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setError(null);

      // Build history from previous completed messages
      const history = messagesRef.current
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/wiki/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow: "qa",
            question,
            wikiContext,
            history,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to Q&A stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(trimmed.slice(6)) as QAStreamEvent;

              setMessages((prev) => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };

                switch (event.type) {
                  case "qa-thinking":
                    last.thinkingSteps = [
                      ...(last.thinkingSteps || []),
                      event.content,
                    ];
                    break;
                  case "qa-delta":
                    last.content += event.content;
                    break;
                  case "done":
                    last.isStreaming = false;
                    break;
                  case "error":
                    last.isStreaming = false;
                    last.content = event.message;
                    break;
                }

                updated[updated.length - 1] = last;
                return updated;
              });
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
          // Mark assistant message as done streaming on error
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isStreaming) {
              updated[updated.length - 1] = { ...last, isStreaming: false };
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [wikiContext, isLoading]
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
