export interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

const MAX_FILE_CHARS = 15_000;

export async function fetchRepoTree(
  owner: string,
  repo: string
): Promise<GitHubTreeItem[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return (data.tree as GitHubTreeItem[]).filter((item) => item.type === "blob");
}

export async function readFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_FILE_CHARS) {
    return text.slice(0, MAX_FILE_CHARS) + "\n\n... [truncated]";
  }
  return text;
}

export function selectKeyFiles(tree: GitHubTreeItem[]): string[] {
  const patterns = [
    /^readme\.md$/i,
    /^package\.json$/,
    /^pyproject\.toml$/,
    /^cargo\.toml$/,
    /^go\.mod$/,
    /^requirements\.txt$/,
    /^setup\.py$/,
    /^src\/index\.\w+$/,
    /^src\/main\.\w+$/,
    /^src\/app\.\w+$/,
    /^app\.\w+$/,
    /^index\.\w+$/,
    /^main\.\w+$/,
    /^lib\/index\.\w+$/,
  ];

  const keyFiles: string[] = [];
  for (const item of tree) {
    if (patterns.some((p) => p.test(item.path))) {
      keyFiles.push(item.path);
    }
  }
  return keyFiles.slice(0, 10);
}
