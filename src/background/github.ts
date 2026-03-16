// src/background/github.ts

const GITHUB_API = "https://api.github.com";

interface SaveFileParams {
  token: string;
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
}

/**
 * Encode GitHub path safely
 * - encodes spaces, &, etc.
 * - preserves folder separators (/)
 */
function encodeGitHubPath(path: string): string {
  return path
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

/**
 * Create or update a file in GitHub repo
 */
export async function createOrUpdateFile({
  token,
  owner,
  repo,
  path,
  content,
  message
}: SaveFileParams): Promise<void> {

  const safePath = encodeGitHubPath(path);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${safePath}`;

  let sha: string | undefined;

  /* -------------------------------
     1️⃣ Check if file already exists
  -------------------------------- */
  const checkRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (checkRes.ok) {
    const json = await checkRes.json();
    sha = json.sha;
  }

  /* -------------------------------
     2️⃣ Create or update file
  -------------------------------- */
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      ...(sha ? { sha } : {})
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}
