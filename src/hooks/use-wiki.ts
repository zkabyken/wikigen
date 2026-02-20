"use client";

import { useState, useEffect } from "react";
import type { WikiStructure } from "@/types";

interface UseWikiResult {
  wiki: WikiStructure | null;
  isLoading: boolean;
  error: string | null;
}

export function useWiki(owner: string, repo: string): UseWikiResult {
  const [wiki, setWiki] = useState<WikiStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWiki() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/wiki/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Request failed with status ${res.status}`
          );
        }

        const data: WikiStructure = await res.json();
        if (!cancelled) setWiki(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchWiki();
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  return { wiki, isLoading, error };
}
