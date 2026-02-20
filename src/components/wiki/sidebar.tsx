"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubsystemSummary {
  id: string;
  name: string;
  description: string;
}

interface SidebarProps {
  owner: string;
  repo: string;
  subsystems: SubsystemSummary[];
  readyIds: Set<string>;
  activeId?: string;
}

export function Sidebar({
  owner,
  repo,
  subsystems,
  readyIds,
  activeId,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b p-4">
        <Link
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Home
        </Link>
        <h2 className="mt-2 truncate text-sm font-semibold">
          {owner}/{repo}
        </h2>
      </div>

      <div className="px-4 pt-4">
        <Input placeholder="Search pages..." className="h-8 text-xs" />
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-0.5">
          {subsystems.map((s) => {
            const isReady = readyIds.has(s.id);
            return (
              <Link
                key={s.id}
                href={
                  isReady
                    ? `/wiki/${owner}/${repo}?section=${s.id}`
                    : "#"
                }
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  !isReady
                    ? "cursor-default text-muted-foreground/50"
                    : activeId === s.id
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent"
                }`}
                onClick={(e) => {
                  if (!isReady) e.preventDefault();
                }}
              >
                {!isReady && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                )}
                <span className="truncate">{s.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
