"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RepoInput() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function parseRepoUrl(input: string): { owner: string; repo: string } | null {
    const match = input.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/\s]+)/
    );
    if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };

    const parts = input.trim().split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }

    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRepoUrl(url);
    if (!parsed) return;
    router.push(`/wiki/${parsed.owner}/${parsed.repo}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-3">
      <Input
        type="text"
        placeholder="https://github.com/owner/repo"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-11 flex-1 font-mono text-sm"
      />
      <Button type="submit" size="lg" className="h-11 px-6">
        Generate Wiki
      </Button>
    </form>
  );
}
