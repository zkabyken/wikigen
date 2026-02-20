"use client";

import { useEffect, useState, useMemo } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  html: string;
}

export function TableOfContents({ html }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  const headings = useMemo(() => {
    const items: TocItem[] = [];
    const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      items.push({ id, text, level: parseInt(match[1]) });
    }
    return items;
  }, [html]);

  useEffect(() => {
    if (headings.length === 0) return;

    // Inject ids into the rendered headings so anchor links work
    const container = document.querySelector(".wiki-prose");
    if (!container) return;

    const elements = container.querySelectorAll("h2, h3");
    elements.forEach((el) => {
      const text = (el.textContent ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      el.id = text;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden w-48 shrink-0 xl:block">
      <div className="sticky top-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          On this page
        </p>
        <ul className="flex flex-col gap-1 border-l">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`block border-l-2 py-1 text-xs transition-colors ${
                  h.level === 3 ? "pl-6" : "pl-3"
                } ${
                  activeId === h.id
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
