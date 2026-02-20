import type { Subsystem } from "@/types";

interface WikiContentProps {
  repoUrl: string;
  subsystem: Subsystem;
}

export function WikiContent({ repoUrl, subsystem }: WikiContentProps) {
  return (
    <article className="max-w-none">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {subsystem.name}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {subsystem.description}
        </p>
      </header>

      {subsystem.entryPoints.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Entry Points
          </h2>
          <div className="flex flex-wrap gap-2">
            {subsystem.entryPoints.map((ep) => (
              <span
                key={ep}
                className="inline-block rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs"
              >
                {ep}
              </span>
            ))}
          </div>
        </section>
      )}

      <div
        className="wiki-prose"
        dangerouslySetInnerHTML={{ __html: subsystem.content }}
      />

      {subsystem.citations.length > 0 && (
        <section className="mt-10 border-t pt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Source References
          </h2>
          <div className="flex flex-col gap-1.5">
            {subsystem.citations.map((c, i) => (
              <a
                key={i}
                href={
                  c.url ||
                  `${repoUrl}/blob/main/${c.file}${c.lines ? `#L${c.lines[0]}-L${c.lines[1]}` : ""}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
                </svg>
                <code className="font-mono text-xs">
                  {c.file}
                  {c.lines && (
                    <span className="text-muted-foreground/70">
                      :{c.lines[0]}-{c.lines[1]}
                    </span>
                  )}
                </code>
                <svg
                  className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
