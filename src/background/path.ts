// src/background/path.ts

/**
 * Builds a GitHub-safe logical path
 * NOTE: This function does NOT URL-encode.
 * Encoding is handled ONLY at fetch time.
 */
export function buildGitHubPath(
  pattern: string,
  title: string,
  questionId: string
): string {
  // Example:
  // pattern = "Arrays & Hashing"
  // title = "Two Sum"
  // questionId = "1"

  const safeTitle = `${questionId}. ${title}.md`;

  return `${pattern}/${safeTitle}`;
}
