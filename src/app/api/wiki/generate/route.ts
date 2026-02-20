import { NextRequest, NextResponse } from "next/server";
import { GenerateWikiRequestSchema } from "@/lib/schemas";
import { generateWiki } from "@/lib/agents/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo } = GenerateWikiRequestSchema.parse(body);

    const wiki = await generateWiki(owner, repo);

    return NextResponse.json(wiki);
  } catch (error) {
    console.error("Wiki generation failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("GitHub API error")) {
        return NextResponse.json(
          { error: "Repository not found or not accessible." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate wiki. Please try again." },
      { status: 500 }
    );
  }
}
