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
