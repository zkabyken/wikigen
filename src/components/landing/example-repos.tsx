"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const EXAMPLES = [
  {
    owner: "Textualize",
    repo: "rich-cli",
    description: "Rich-click CLI tooling for beautiful terminal output",
  },
  {
    owner: "browser-use",
    repo: "browser-use",
    description: "AI agent that controls your browser autonomously",
  },
  {
    owner: "tastejs",
    repo: "todomvc",
    description: "Helping you select an MV* framework",
  },
];

export function ExampleRepos() {
  const router = useRouter();

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm text-muted-foreground">Or try an example:</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {EXAMPLES.map((example) => (
          <Card
            key={`${example.owner}/${example.repo}`}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() =>
              router.push(`/wiki/${example.owner}/${example.repo}`)
            }
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">
                {example.owner}/{example.repo}
              </CardTitle>
              <CardDescription className="text-xs">
                {example.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
