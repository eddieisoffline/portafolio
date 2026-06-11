export type GitHubFile = {
  path: string;
  sha: string;
  content: string;
};

type GitHubContentResponse = {
  type: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
};

type GitHubTreeResponse = {
  truncated: boolean;
  tree: Array<{
    path: string;
    type: "blob" | "tree" | "commit";
  }>;
};

type GitHubRepoResponse = {
  default_branch: string;
};

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class GitHubClient {
  private readonly baseUrl = "https://api.github.com";

  constructor(private readonly token?: string) {}

  async getFileContent(params: {
    owner: string;
    repo: string;
    path: string;
    ref?: string;
  }): Promise<GitHubFile> {
    const refQuery = params.ref ? `?ref=${encodeURIComponent(params.ref)}` : "";
    const file = await this.request<GitHubContentResponse>(
      `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
        params.repo
      )}/contents/${encodePath(params.path)}${refQuery}`
    );

    if (file.type !== "file" || file.encoding !== "base64" || !file.content) {
      throw new GitHubApiError(
        `GitHub path is not a readable file: ${params.path}`,
        422,
        ""
      );
    }

    return {
      path: file.path,
      sha: file.sha,
      content: Buffer.from(file.content.replace(/\n/g, ""), "base64").toString(
        "utf8"
      )
    };
  }

  async listMarkdownFiles(params: {
    owner: string;
    repo: string;
    ref?: string;
  }): Promise<string[]> {
    const ref =
      params.ref ??
      (
        await this.request<GitHubRepoResponse>(
          `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
            params.repo
          )}`
        )
      ).default_branch;

    const tree = await this.request<GitHubTreeResponse>(
      `/repos/${encodeURIComponent(params.owner)}/${encodeURIComponent(
        params.repo
      )}/git/trees/${encodeURIComponent(ref)}?recursive=1`
    );

    if (tree.truncated) {
      throw new GitHubApiError(
        "GitHub tree response was truncated; pass explicit paths to /sync/repo.",
        422,
        ""
      );
    }

    return tree.tree
      .filter((item) => item.type === "blob" && isMarkdownFile(item.path))
      .map((item) => item.path);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "portfolio-data-science-backend",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      }
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new GitHubApiError(
        `GitHub API request failed with status ${response.status}`,
        response.status,
        responseBody
      );
    }

    return (await response.json()) as T;
  }
}

export function isMarkdownFile(path: string): boolean {
  return path.toLowerCase().endsWith(".md");
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}
