# wikigen

One-click wiki generator for public GitHub repos. Paste a repo URL, get structured developer docs with citations back to source code.

**Live demo:** [wikigen.vercel.app](https://wikigen.vercel.app)

## How it works

1. **Analyze**: Fetches the repo tree + key files, then uses GPT to identify user-facing subsystems.
2. **Generate**: Builds a wiki page per subsystem in parallel. Each page includes entry points, inline citations linking to specific files/lines, and code snippets.
3. **Stream**: Pages arrive over SSE as they finish, so you can start reading before generation is done.

There's also a Q&A chat that lets you ask questions about the generated wiki.

## Stack

- Next.js 16 (App Router)
- Vercel AI SDK (`generateObject`, `streamText`, `tool()` definitions)
- OpenAI (`gpt-5-mini`)
- Tailwind + Radix UI
- Sandpack for live code blocks

## Running locally

```bash
git clone https://github.com/<you>/wikigen.git
cd wikigen
npm install
```

Create `.env.local`:

```
OPENAI_API_KEY=sk-...
```

Then:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000), paste a GitHub repo URL, and go.

## Project structure

```
src/
  app/
    api/wiki/generate/   SSE endpoint (wiki gen + Q&A)
    wiki/[owner]/[repo]/  wiki viewer page
  lib/
    agents/
      tools.ts           tool definitions (analyzeRepo, buildPage)
      orchestrator.ts    chains the tools, emits SSE events
      qa-agent.ts        streaming Q&A over wiki content
    schemas.ts           Zod schemas for all AI outputs
    github.ts            GitHub API helpers (tree, file content)
  components/wiki/       sidebar, TOC, content renderer, chat panel
  hooks/                 useWiki (SSE consumer), useChat (Q&A consumer)
```
