import { Octokit } from "@octokit/rest"

export interface GitHubActivity {
  type: "commit" | "pr" | "merge"
  title: string
  description: string
  url?: string
  author?: string
  timestamp: Date
  metadata: {
    sha?: string
    prNumber?: number
    repo?: string
  }
}

/**
 * Fetch recent commits from a GitHub repository
 */
export async function fetchCommits(
  accessToken: string,
  owner: string,
  repo: string,
  since?: Date
): Promise<GitHubActivity[]> {
  const octokit = new Octokit({ auth: accessToken })

  const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    since: sinceDate.toISOString(),
    per_page: 20,
  })

  return commits.map((commit) => ({
    type: "commit" as const,
    title: commit.commit.message.split("\n")[0],
    description: commit.commit.message,
    url: commit.html_url,
    author: commit.commit.author?.name,
    timestamp: new Date(commit.commit.author?.date || Date.now()),
    metadata: {
      sha: commit.sha,
      repo: `${owner}/${repo}`,
    },
  }))
}

/**
 * Fetch recent PRs from a GitHub repository
 */
export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubActivity[]> {
  const octokit = new Octokit({ auth: accessToken })

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state,
    per_page: 20,
    sort: "updated",
  })

  return prs.map((pr) => ({
    type: pr.merged_at ? ("merge" as const) : ("pr" as const),
    title: pr.title,
    description: pr.body || pr.title,
    url: pr.html_url,
    author: pr.user?.login,
    timestamp: new Date(pr.updated_at),
    metadata: {
      prNumber: pr.number,
      repo: `${owner}/${repo}`,
    },
  }))
}

/**
 * Parse GitHub repository URL or owner/repo string
 */
export function parseRepo(repoString: string): { owner: string; repo: string } | null {
  // Handle "owner/repo" format
  if (repoString.includes("/") && !repoString.includes("http")) {
    const [owner, repo] = repoString.split("/")
    return { owner: owner.trim(), repo: repo.trim() }
  }

  // Handle GitHub URL
  const urlMatch = repoString.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") }
  }

  return null
}
