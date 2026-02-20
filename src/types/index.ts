export interface Citation {
  file: string;
  lines?: [number, number];
  url: string;
}

export interface Subsystem {
  id: string;
  name: string;
  description: string;
  content: string;
  citations: Citation[];
  entryPoints: string[];
}

export interface WikiStructure {
  repoName: string;
  repoUrl: string;
  description: string;
  subsystems: Subsystem[];
}

// Stream event types
export type StreamEvent =
  | { type: "status"; message: string }
  | {
      type: "analysis";
      repoName: string;
      description: string;
      subsystems: { id: string; name: string; description: string }[];
    }
  | { type: "page"; subsystem: Subsystem }
  | { type: "done" }
  | { type: "error"; message: string };
