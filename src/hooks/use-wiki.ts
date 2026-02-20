"use client";

import { useState, useEffect, useCallback } from "react";
import type { Subsystem, StreamEvent } from "@/types";

interface SubsystemSummary {
  id: string;
  name: string;
  description: string;
}

interface UseWikiResult {
  repoName: string | null;
  description: string | null;
  subsystemList: SubsystemSummary[];
  pages: Map<string, Subsystem>;
  status: string | null;
  isDone: boolean;
  error: string | null;
}

export function useWiki(owner: string, repo: string): UseWikiResult {
  const [repoName, setRepoName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [subsystemList, setSubsystemList] = useState<SubsystemSummary[]>([]);
  const [pages, setPages] = useState<Map<string, Subsystem>>(new Map());
  const [status, setStatus] = useState<string | null>("Connecting...");
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "status":
        setStatus(event.message);
        break;
      case "analysis":
        setRepoName(event.repoName);
        setDescription(event.description);
        setSubsystemList(event.subsystems);
        break;
      case "page":
        setPages((prev) => {
          const next = new Map(prev);
          next.set(event.subsystem.id, event.subsystem);
          return next;
        });
        break;
      case "done":
        setStatus(null);
        setIsDone(true);
        break;
      case "error":
        setError(event.message);
        setStatus(null);
        break;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function stream() {
      try {
        const res = await fetch("/api/wiki/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to generation stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(trimmed.slice(6)) as StreamEvent;
              if (!cancelled) handleEvent(event);
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
          setStatus(null);
        }
      }
    }

    stream();
    return () => {
      cancelled = true;
    };
  }, [owner, repo, handleEvent]);

  return { repoName, description, subsystemList, pages, status, isDone, error };
}
