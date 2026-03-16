export interface ProblemData {
  title: string;
  difficulty: string;
  language: string;
  code: string;
  url: string;
  pattern?: string;

  // New user-entered fields
  intuition?: string;
  approach?: string;
  walkthrough?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

export function generateMarkdown(data: ProblemData): string {
  return `
# ${data.title}

**Difficulty:** ${data.difficulty}  
**Pattern:** ${data.pattern ?? "Uncategorized"}  
**Language:** ${data.language}  
**LeetCode:** ${data.url}

---

## Intuition
${data.intuition?.trim() || "_Write your first thoughts and observations here._"}

---

## Approach
${data.approach?.trim() || "_Explain the algorithm step by step._"}

---

## Example Walkthrough
${data.walkthrough?.trim() || "_Walk through a small example to show how the logic works._"}

---

## Time Complexity
${data.timeComplexity?.trim() || "_O(?)_"}

---

## Space Complexity
${data.spaceComplexity?.trim() || "_O(?)_"}

---

## Code

\`\`\`${data.language}
${data.code}
\`\`\`

---
<p align="right"><sub>LeetSync Watermark | Synced from browser extension</sub></p>
`.trim();
}
