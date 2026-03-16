# LeetSync ⚡

**Automatically sync your LeetCode solutions to GitHub.**

LeetSync is a powerful Chrome extension that extracts your LeetCode code, lets you write structured analysis (Intuition, Approach, Example Walkthrough), and pushes polished Markdown files to your GitHub repository — organized by 17 DSA patterns.

![LeetSync Extension](public/assets/logo.PNG)

---

## ✨ Features

- **🚀 One-Click Extract**: Instantly gets the problem title, difficulty, language, and your code from the LeetCode editor.
- **📝 Structured Solutions**: Integrated fields for Intuition, Approach, and time/space complexity to help you build a professional portfolio.
- **📂 Auto-Organization**: Pushes to folders based on 17 DSA patterns (Linked List, Trees, Graphs, etc.).
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

> [!TIP]
> Use the [LeetSync Web Scripts](https://github.com/saahilpal/leetsync-web) to instantly scaffold all 17 pattern folders in your repository!

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
