"use client";

import { useMemo } from "react";
import {
  SandpackProvider,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react";
import { dracula as draculaBase } from "@codesandbox/sandpack-themes";

const dracula = {
  ...draculaBase,
  colors: {
    ...draculaBase.colors,
    surface1: "transparent",
    surface2: "transparent",
    surface3: "transparent",
  },
};

interface WikiProseProps {
  html: string;
}

interface ContentBlock {
  type: "html" | "code";
  content: string;
  language?: string;
}

function detectLanguage(code: string): string {
  if (code.includes("import ") || code.includes("export ") || code.includes("const ") || code.includes("=>")) return "typescript";
  if (code.includes("def ") || code.includes("import ") && code.includes(":")) return "python";
  if (code.includes("<") && code.includes("/>")) return "typescript";
  if (code.includes("func ") || code.includes("package ")) return "typescript";
  if (code.includes("fn ") || code.includes("let mut")) return "typescript";
  return "typescript";
}

function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (match, level, attrs, content) => {
    // Skip if already has an id
    if (/\bid=/.test(attrs)) return match;
    const text = content.replace(/<[^>]*>/g, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

function parseHtmlBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const codeBlockRegex = /<pre[^>]*>\s*<code[^>]*(?:class="[^"]*language-(\w+)[^"]*")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(html)) !== null) {
    // Add HTML before this code block
    if (match.index > lastIndex) {
      blocks.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }

    // Decode HTML entities in code
    const code = match[2]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    blocks.push({
      type: "code",
      content: code,
      language: match[1] || detectLanguage(code),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining HTML
  if (lastIndex < html.length) {
    blocks.push({ type: "html", content: html.slice(lastIndex) });
  }

  return blocks;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const extension = language === "python" ? "py" : language === "typescript" ? "tsx" : language === "javascript" ? "js" : "tsx";
  const filename = `/code.${extension}`;

  return (
    <div className="sandpack-clean my-4 overflow-hidden rounded-lg border-0">
      <SandpackProvider
        template="vanilla-ts"
        files={{ [filename]: code }}
        options={{ activeFile: filename }}
        theme={dracula}
      >
        <SandpackCodeViewer
          wrapContent
        />
      </SandpackProvider>
    </div>
  );
}

export function WikiProse({ html }: WikiProseProps) {
  const blocks = useMemo(() => parseHtmlBlocks(injectHeadingIds(html)), [html]);

  return (
    <div className="wiki-prose">
      {blocks.map((block, i) =>
        block.type === "html" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: block.content }} />
        ) : (
          <CodeBlock key={i} code={block.content} language={block.language ?? "typescript"} />
        )
      )}
    </div>
  );
}
