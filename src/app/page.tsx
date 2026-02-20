import { RepoInput } from "@/components/landing/repo-input";
import { ExampleRepos } from "@/components/landing/example-repos";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight">WikiGen</h1>
        <p className="max-w-md text-muted-foreground">
          One-click developer docs for any public GitHub repository. Paste a
          repo URL and get a feature-driven wiki in seconds.
        </p>
      </div>

      <RepoInput />
      <ExampleRepos />
    </div>
  );
}
