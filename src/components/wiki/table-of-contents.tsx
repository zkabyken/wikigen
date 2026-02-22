"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";

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
  const observerRef = useRef<IntersectionObserver | null>(null);

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

    // Set initial active heading
    setActiveId(headings[0].id);

    // IDs are already in the DOM (injected by WikiProse), just observe them
    const scrollRoot = document.querySelector("main");
    if (!scrollRoot) return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    observerRef.current = observer;

    // Observe all heading elements that have IDs
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    const scrollRoot = el?.closest("main");
    if (!el || !scrollRoot) return;

    const elTop = el.getBoundingClientRect().top;
    const rootTop = scrollRoot.getBoundingClientRect().top;
    const offset = elTop - rootTop + scrollRoot.scrollTop - 40;

    scrollRoot.scrollTo({ top: offset, behavior: "smooth" });
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden w-48 shrink-0 xl:block">
      <div className="sticky top-10 max-h-[calc(100vh-6rem)] overflow-y-auto">
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
                  scrollToHeading(h.id);
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
