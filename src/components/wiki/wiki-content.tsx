import type { Subsystem } from "@/types";

interface WikiContentProps {
  repoUrl: string;
  subsystem: Subsystem;
}

export function WikiContent({ repoUrl, subsystem }: WikiContentProps) {
  return (
    <article className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {subsystem.name}
        </h1>
        <p className="mt-2 text-muted-foreground">{subsystem.description}</p>
      </div>

      {subsystem.entryPoints.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Entry Points
          </h2>
          <ul className="space-y-1">
            {subsystem.entryPoints.map((ep) => (
              <li key={ep}>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {ep}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="wiki-prose">
        <div dangerouslySetInnerHTML={{ __html: subsystem.content }} />
      </div>

      {subsystem.citations.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Source References
          </h2>
          <ul className="space-y-1">
            {subsystem.citations.map((c, i) => (
              <li key={i}>
                <a
                  href={c.url || `${repoUrl}/blob/main/${c.file}${c.lines ? `#L${c.lines[0]}-L${c.lines[1]}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-primary underline-offset-4 hover:underline"
                >
                  {c.file}
                  {c.lines && `:${c.lines[0]}-${c.lines[1]}`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
