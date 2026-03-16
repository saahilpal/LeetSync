# LeetSync ⚡

<p align="center">
  <img src="public/assets/logo.PNG" alt="LeetSync Logo" width="120" height="120" />
</p>

<p align="center">
  <b>Automatically sync your LeetCode solutions to GitHub.</b><br />
  Build a professional DSA portfolio with one click.
</p>

---

LeetSync is a powerful Chrome extension that extracts your LeetCode code, lets you write structured analysis (Intuition, Approach, Example Walkthrough), and pushes polished Markdown files to your GitHub repository — organized by 18 DSA patterns.

## ✨ Features

- **🚀 One-Click Extract**: Instantly gets the problem title, difficulty, language, and your code from the LeetCode editor.
- **📝 Structured Solutions**: Integrated fields for Intuition, Approach, and time/space complexity to help you build a professional portfolio.
- **📂 Auto-Organization**: Pushes to folders based on 18 DSA patterns (Linked List, Trees, Graphs, etc.).
- **🎯 In-Page Overlay**: A floating panel that lives inside LeetCode so you never have to switch tabs.
- **🔒 Private & Secure**: Zero backend. Your GitHub Personal Access Token (PAT) stays in your browser's local storage.
- **⚡ Manifest V3**: Built with modern extension standards for performance and longevity.

---

## 🛠 Installation

### 1. Build from Source
```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

### 2. Load into Chrome
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer Mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist` folder generated after running `npm run build`.

---

## ⚙️ Setup

1. **GitHub PAT**: Create a [Personal Access Token (Classic)](https://github.com/settings/tokens) with `repo` scope.
2. **Repo Name**: Create a repository on GitHub (e.g., `leetcode-solutions`).
3. **Configure**: Open the LeetSync extension popup, enter your username, PAT, and repository name.

---

## 📂 First-Time Repo Setup (Scripts)

GitHub's API cannot create empty folders. To use LeetSync's auto-organization, you must first scaffold the 18 pattern folders in your repository. Run one of these scripts **once** inside your local repository, then push to GitHub.

### macOS / Linux (Bash/Zsh)
```bash
#!/bin/bash
patterns=(
  "Arrays & Hashing" "Two Pointers" "Sliding Window" "Stack" "Binary Search"
  "Linked List" "Trees" "Heap - Priority Queue" "Backtracking" "Tries"
  "Graphs" "Advanced Graphs" "1-D Dynamic Programming" "2-D Dynamic Programming"
  "Greedy" "Intervals" "Math & Geometry" "Bit Manipulation"
)
for p in "${patterns[@]}"; do
  mkdir -p "$p"
  echo -e "# $p\n\nSolutions for the **$p** pattern." > "$p/README.md"
  echo "✅ Created: $p/"
done
git add . && git commit -m 'init: scaffold pattern folders' && git push
```

### Windows (PowerShell)
```powershell
$patterns = @(
  "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack", "Binary Search",
  "Linked List", "Trees", "Heap - Priority Queue", "Backtracking", "Tries",
  "Graphs", "Advanced Graphs", "1-D Dynamic Programming", "2-D Dynamic Programming",
  "Greedy", "Intervals", "Math & Geometry", "Bit Manipulation"
)
foreach ($p in $patterns) {
  New-Item -ItemType Directory -Force -Path $p | Out-Null
  "# $p`n`nSolutions for the **$p** pattern." | Set-Content "$p\README.md"
  Write-Host "Created: $p/"
}
git add . ; git commit -m 'init: scaffold pattern folders' ; git push
```

### Windows (CMD)
```cmd
@echo off
for %%p in (
  "Arrays & Hashing" "Two Pointers" "Sliding Window" "Stack" "Binary Search"
  "Linked List" "Trees" "Heap - Priority Queue" "Backtracking" "Tries"
  "Graphs" "Advanced Graphs" "1-D Dynamic Programming" "2-D Dynamic Programming"
  "Greedy" "Intervals" "Math & Geometry" "Bit Manipulation"
) do (
  mkdir %%~p 2>nul
  echo # %%~p > "%%~p\README.md"
  echo. >> "%%~p\README.md"
  echo Solutions for the **%%~p** pattern. >> "%%~p\README.md"
  echo Created: %%~p/
)
git add . && git commit -m "init: scaffold pattern folders" && git push
```

---

## 👨‍💻 Developed By

**Sahil Pal**

- [GitHub](https://github.com/saahilpal)
- [LinkedIn](https://www.linkedin.com/in/sahiilpal)
- [LeetCode](https://leetcode.com/u/saahiilpal/)

---

<p align="center">
  Built for developers who take their DSA journey seriously.
</p>
