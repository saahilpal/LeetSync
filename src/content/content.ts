console.log("LeetSync content script loaded");

type Difficulty = "Easy" | "Medium" | "Hard" | "Unknown";
type DockEdge = "left" | "right" | "top" | "bottom";
type NoteField = "intuition" | "approach" | "walkthrough";

interface MarkdownData {
  title: string;
  difficulty: string;
  language: string;
  code: string;
  url: string;
  pattern?: string;
  intuition?: string;
  approach?: string;
  walkthrough?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

const PATTERNS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Heap / Priority Queue",
  "Backtracking",
  "Tries",
  "Graphs",
  "Advanced Graphs",
  "1-D Dynamic Programming",
  "2-D Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation"
] as const;

function generateMarkdown(data: MarkdownData): string {
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

interface ExtractedProblemData {
  title: string;
  difficulty: Difficulty;
  code: string;
  language: string;
  url: string;
}

interface SaveResponse {
  success: boolean;
  error?: string;
}

interface GitHubSettings {
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
}

declare global {
  interface Window {
    __LEETSYNC_OVERLAY_MOUNTED__?: boolean;
  }
}

function getProblemTitle(): string {
  const match = window.location.pathname.match(/problems\/([^/]+)/);
  if (!match) return "Unknown Problem";

  return match[1]
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function getProblemDifficulty(): Promise<Difficulty> {
  const MAX_RETRIES = 20;
  const DELAY = 100;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const queries =
        (window as any).__NEXT_DATA__?.props?.pageProps?.dehydratedState?.queries;

      if (Array.isArray(queries)) {
        for (const q of queries) {
          const d = q?.state?.data?.difficulty;
          if (d === "Easy" || d === "Medium" || d === "Hard") {
            return d;
          }
        }
      }
    } catch {
      // ignore and retry
    }

    await new Promise((r) => setTimeout(r, DELAY));
  }

  return "Unknown";
}

function injectMonacoScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injectMonaco.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

function extractCodeFromMonaco(): Promise<{ code: string; language: string } | null> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener("message", onCode);
      resolve(null);
    }, 3500);

    const onCode = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== "LEETSYNC_CODE") return;

      window.removeEventListener("message", onCode);
      window.clearTimeout(timeoutId);

      if (!event.data.success || !event.data.payload) {
        resolve(null);
        return;
      }

      const code =
        typeof event.data.payload.code === "string" ? event.data.payload.code : "";
      const language =
        typeof event.data.payload.language === "string"
          ? event.data.payload.language
          : "text";

      resolve({ code, language });
    };

    window.addEventListener("message", onCode);
    injectMonacoScript();
  });
}

async function extractProblemFromPage(): Promise<ExtractedProblemData | null> {
  const title = getProblemTitle();
  const codePayload = await extractCodeFromMonaco();

  if (!codePayload) {
    return null;
  }

  const difficulty = await getProblemDifficulty();

  return {
    title,
    difficulty,
    code: codePayload.code,
    language: codePayload.language,
    url: window.location.href
  };
}

async function sendRuntimeMessage<T>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}

async function hasGitHubSetup(): Promise<boolean> {
  const { githubToken, githubOwner, githubRepo } = await chrome.storage.local.get([
    "githubToken",
    "githubOwner",
    "githubRepo"
  ]);

  return (
    typeof githubToken === "string" &&
    githubToken.trim().length > 0 &&
    typeof githubOwner === "string" &&
    githubOwner.trim().length > 0 &&
    typeof githubRepo === "string" &&
    githubRepo.trim().length > 0
  );
}

function mountOverlay() {
  if (window.__LEETSYNC_OVERLAY_MOUNTED__) {
    return;
  }

  window.__LEETSYNC_OVERLAY_MOUNTED__ = true;

  const host = document.createElement("div");
  host.id = "leetsync-overlay-host";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const logoUrl = chrome.runtime.getURL("assets/logo.PNG");

  shadow.innerHTML = `
    <style>
      :host {
        --ls-edge: 12px;
        --ls-panel-bg: #0d0f16;
        --ls-panel-bg-2: #090b12;
        --ls-line: #2a2d38;
        --ls-line-soft: #343847;
        --ls-line-strong: #facc15;
        --ls-ink: #f7f8fb;
        --ls-muted: #a2a5b3;
        --ls-accent: #facc15;
        --ls-accent-2: #eab308;
        --ls-ease: cubic-bezier(0.4, 0, 0.2, 1);
        --ls-dur: 200ms;
      }

      .ls-root {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
        color: var(--ls-ink);
      }

      .ls-panel {
        position: absolute;
        width: min(430px, calc(100vw - (var(--ls-edge) * 2)));
        height: min(92vh, 900px);
        min-width: 340px;
        min-height: 560px;
        max-width: calc(100vw - (var(--ls-edge) * 2));
        max-height: calc(100vh - (var(--ls-edge) * 2));
        resize: both;
        overflow: hidden;
        pointer-events: auto;
        background:
          radial-gradient(120% 65% at 50% -10%, rgba(250, 204, 21, 0.09), transparent 55%),
          linear-gradient(180deg, var(--ls-panel-bg), var(--ls-panel-bg-2));
        border: 1px solid var(--ls-line);
        border-top-color: var(--ls-line-strong);
        border-radius: 16px;
        box-shadow: 0 18px 44px rgba(0, 0, 0, 0.52);
        display: flex;
        flex-direction: column;
      }

      .ls-panel.hidden {
        display: none;
      }

      .ls-panel.ls-dock-right {
        right: var(--ls-edge);
        top: var(--ls-edge);
      }

      .ls-panel.ls-dock-left {
        left: var(--ls-edge);
        top: var(--ls-edge);
      }

      .ls-panel.ls-dock-top {
        left: 50%;
        top: var(--ls-edge);
        transform: translateX(-50%);
        width: min(570px, calc(100vw - (var(--ls-edge) * 2)));
      }

      .ls-panel.ls-dock-bottom {
        left: 50%;
        bottom: var(--ls-edge);
        transform: translateX(-50%);
        width: min(570px, calc(100vw - (var(--ls-edge) * 2)));
      }

      .ls-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        border-bottom: 1px solid #272b36;
        background: linear-gradient(180deg, #131722, #0f1320);
      }

      .ls-header-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .ls-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ls-logo {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        object-fit: cover;
        border: 1px solid #3a3f4f;
      }

      .ls-title {
        margin: 0;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.2px;
        color: var(--ls-ink);
      }

      .ls-subtitle {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--ls-muted);
      }

      .ls-minimize {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid #363b4b;
        background: #171b27;
        color: var(--ls-accent);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        transition: border-color var(--ls-dur) var(--ls-ease), background var(--ls-dur) var(--ls-ease);
      }

      .ls-minimize:hover {
        border-color: #505060;
        background: #1d2230;
      }

      .ls-minimize:focus-visible {
        outline: 2px solid var(--ls-accent);
        outline-offset: 2px;
      }

      .ls-setup-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid #5b4f1d;
        background: linear-gradient(180deg, #facc15, #eab308);
        color: #181818;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        font-weight: 800;
        transition: filter var(--ls-dur) var(--ls-ease), box-shadow var(--ls-dur) var(--ls-ease);
      }

      .ls-setup-icon:hover {
        filter: brightness(1.1);
        box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
      }

      .ls-setup-icon:focus-visible {
        outline: 2px solid var(--ls-accent);
        outline-offset: 2px;
      }

      .ls-main {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        min-height: 0;
        flex: 1;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: #48506a #0f1119;
      }

      .ls-main::-webkit-scrollbar {
        width: 8px;
      }

      .ls-main::-webkit-scrollbar-track {
        background: #0f1119;
      }

      .ls-main::-webkit-scrollbar-thumb {
        background: #48506a;
        border-radius: 8px;
      }

      .ls-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .ls-primary,
      .ls-secondary {
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        min-height: 44px;
        position: relative;
        overflow: hidden;
        transition:
          transform 150ms var(--ls-ease),
          box-shadow var(--ls-dur) var(--ls-ease),
          border-color var(--ls-dur) var(--ls-ease),
          filter var(--ls-dur) var(--ls-ease),
          background var(--ls-dur) var(--ls-ease);
      }

      .ls-primary:focus-visible,
      .ls-secondary:focus-visible {
        outline: 2px solid var(--ls-accent);
        outline-offset: 2px;
      }

      .ls-primary:active:not(:disabled),
      .ls-secondary:active:not(:disabled) {
        transform: scale(0.97);
      }

      .ls-primary {
        border: none;
        color: #131313;
        background: linear-gradient(180deg, var(--ls-accent), var(--ls-accent-2));
        box-shadow: 0 6px 16px rgba(250, 204, 21, 0.25);
      }

      .ls-primary:hover:enabled {
        transform: translateY(-1px);
        box-shadow: 0 10px 22px rgba(250, 204, 21, 0.32);
      }

      .ls-primary:disabled {
        background: #454956;
        color: #9095a4;
        cursor: not-allowed;
        box-shadow: none;
      }

      .ls-secondary {
        border: 1px solid #394055;
        background: linear-gradient(180deg, #1d2231, #141927);
        color: var(--ls-ink);
      }

      .ls-secondary:hover:not(:disabled) {
        border-color: #505060;
        background: linear-gradient(180deg, #232838, #191e2e);
      }

      /* Loading state for buttons */
      .ls-primary.ls-loading,
      .ls-secondary.ls-loading {
        color: transparent !important;
        pointer-events: none;
      }

      .ls-primary.ls-loading::after,
      .ls-secondary.ls-loading::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid rgba(0, 0, 0, 0.2);
        border-top-color: #111;
        border-radius: 50%;
        animation: ls-spin 600ms linear infinite;
      }

      @keyframes ls-spin {
        to { transform: rotate(360deg); }
      }

      .ls-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .ls-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ls-minihead {
        margin: 0;
        font-size: 10px;
        letter-spacing: 0.55px;
        text-transform: uppercase;
        color: #c9ccd6;
        font-weight: 800;
      }

      .ls-select,
      .ls-input,
      .ls-textarea {
        width: 100%;
        box-sizing: border-box;
        border-radius: 12px;
        border: 1px solid var(--ls-line-soft);
        background: #131826;
        color: var(--ls-ink);
        font-size: 13px;
        padding: 10px 12px;
        transition: border-color var(--ls-dur) var(--ls-ease), box-shadow var(--ls-dur) var(--ls-ease), background var(--ls-dur) var(--ls-ease);
      }

      .ls-select {
        appearance: none;
        background-image:
          linear-gradient(45deg, transparent 50%, #c4c5cc 50%),
          linear-gradient(135deg, #c4c5cc 50%, transparent 50%);
        background-position:
          calc(100% - 18px) calc(50% - 2px),
          calc(100% - 13px) calc(50% - 2px);
        background-size: 5px 5px, 5px 5px;
        background-repeat: no-repeat;
        padding-right: 36px;
      }

      .ls-select:focus,
      .ls-input:focus,
      .ls-textarea:focus {
        outline: none;
        border-color: var(--ls-accent);
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.14);
      }

      .ls-code {
        margin: 0;
        background: #0b0f1a;
        border: 1px solid #2e3547;
        color: #ebedf5;
        border-radius: 12px;
        padding: 11px 12px;
        font-size: 11px;
        line-height: 1.45;
        min-height: 72px;
        max-height: 135px;
        overflow: auto;
        white-space: pre-wrap;
        font-family: "JetBrains Mono", "Cascadia Code", "SFMono-Regular", Menlo, monospace;
        scrollbar-width: thin;
        scrollbar-color: #49516a #0b0f1a;
      }

      .ls-code.empty {
        color: #868b9b;
        font-style: italic;
      }

      .ls-notes {
        display: grid;
        grid-template-rows: 1.2fr 1.2fr 1.2fr;
        gap: 10px;
        min-height: 300px;
        transition: grid-template-rows 0.24s var(--ls-ease);
      }

      .ls-note {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-height: 88px;
        border: 1px solid #303749;
        border-radius: 13px;
        background: linear-gradient(180deg, #121824, #0d121f);
        padding: 10px;
        overflow: hidden;
        transition: transform 0.18s var(--ls-ease), border-color 0.16s var(--ls-ease), box-shadow 0.16s var(--ls-ease);
      }

      .ls-notes[data-active="intuition"] .ls-note[data-note="intuition"],
      .ls-notes[data-active="approach"] .ls-note[data-note="approach"],
      .ls-notes[data-active="walkthrough"] .ls-note[data-note="walkthrough"] {
        border-color: #635512;
        box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.12);
      }

      .ls-notes[data-active="intuition"] {
        grid-template-rows: 1.95fr 0.9fr 0.9fr;
      }

      .ls-notes[data-active="approach"] {
        grid-template-rows: 0.9fr 1.95fr 0.9fr;
      }

      .ls-notes[data-active="walkthrough"] {
        grid-template-rows: 0.9fr 0.9fr 1.95fr;
      }

      .ls-note.ls-grow {
        animation: ls-grow-note 210ms ease;
      }

      @keyframes ls-grow-note {
        0% {
          transform: scale(1);
        }
        45% {
          transform: scale(1.008);
        }
        100% {
          transform: scale(1);
        }
      }

      .ls-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.55px;
        text-transform: uppercase;
        color: #d0d4e0;
      }

      .ls-textarea {
        flex: 1;
        min-height: 0;
        resize: none;
        line-height: 1.4;
        font-family: "JetBrains Mono", "Cascadia Code", "SFMono-Regular", Menlo, monospace;
      }

      .ls-textarea::placeholder,
      .ls-input::placeholder {
        color: #767f95;
        transition: opacity var(--ls-dur) var(--ls-ease);
      }

      .ls-textarea:focus::placeholder,
      .ls-input:focus::placeholder {
        opacity: 0.5;
      }

      .ls-complexity {
        margin-top: 0;
      }

      .ls-status {
        min-height: 20px;
        font-size: 12px;
        line-height: 1.45;
        text-align: center;
        color: #f5f7fd;
        background: #151a27;
        border: 1px solid #2f3648;
        border-radius: 10px;
        padding: 6px 8px;
        margin: 0;
        transition: all var(--ls-dur) var(--ls-ease);
      }

      .ls-status.error {
        color: #ffb3b3;
        border-color: #6c3030;
        background: #251516;
      }

      .ls-status.success {
        color: #fff2a5;
        border-color: #6d5f20;
        background: #2a2410;
      }

      .ls-bubble {
        position: absolute;
        width: 66px;
        height: 66px;
        border-radius: 50%;
        border: 1px solid #4e4317;
        background: linear-gradient(180deg, #1a2132, #0d1220);
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        cursor: grab;
        touch-action: none;
        user-select: none;
        box-shadow:
          0 12px 24px rgba(0, 0, 0, 0.46),
          inset 0 0 0 1px rgba(250, 204, 21, 0.1);
        transition: box-shadow var(--ls-dur) var(--ls-ease), border-color var(--ls-dur) var(--ls-ease);
      }

      .ls-bubble:hover {
        border-color: #6a5b1f;
        box-shadow:
          0 14px 28px rgba(0, 0, 0, 0.5),
          0 0 20px rgba(250, 204, 21, 0.15),
          inset 0 0 0 1px rgba(250, 204, 21, 0.18);
      }

      .ls-bubble.visible {
        display: inline-flex;
      }

      .ls-bubble img {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        user-select: none;
        -webkit-user-drag: none;
      }

      .ls-bubble.ls-dock-left {
        left: var(--ls-edge);
        top: 50%;
        transform: translateY(-50%);
      }

      .ls-bubble.ls-dock-right {
        right: var(--ls-edge);
        top: 50%;
        transform: translateY(-50%);
      }

      .ls-bubble.ls-dock-top {
        left: 50%;
        top: var(--ls-edge);
        transform: translateX(-50%);
      }

      .ls-bubble.ls-dock-bottom {
        left: 50%;
        bottom: var(--ls-edge);
        transform: translateX(-50%);
      }

      @media (max-width: 860px) {
        .ls-panel {
          width: calc(100vw - (var(--ls-edge) * 2));
          min-width: 280px;
          height: min(90vh, 800px);
          min-height: 460px;
        }

        .ls-panel.ls-dock-top,
        .ls-panel.ls-dock-bottom {
          width: calc(100vw - (var(--ls-edge) * 2));
        }
      }

      @media (max-width: 540px) {
        .ls-panel {
          resize: none;
          min-height: 400px;
        }

        .ls-controls {
          grid-template-columns: 1fr;
        }

        .ls-grid {
          grid-template-columns: 1fr;
        }

        .ls-notes {
          min-height: 290px;
        }

      }

      .hidden {
        display: none !important;
      }

      .ls-setup-view {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
      }

      .ls-setup-step-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--ls-muted);
        margin: 0;
      }

      .ls-setup-title {
        font-size: 18px;
        font-weight: 800;
        margin: 0;
      }

      .ls-setup-help {
        font-size: 12px;
        color: var(--ls-muted);
        margin: 0;
      }

      .ls-profile-view {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
      }

      .ls-profile-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        border: 1px solid rgba(250, 204, 21, 0.2);
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(8px);
        transition: border-color var(--ls-dur) var(--ls-ease);
      }

      .ls-profile-card:hover {
        border-color: rgba(250, 204, 21, 0.35);
      }

      .ls-profile-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ls-profile-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #1e2333;
        border: 1px solid #3a3f4f;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 800;
        color: var(--ls-accent);
      }

      .ls-profile-info {
        display: flex;
        flex-direction: column;
      }

      .ls-profile-name {
        font-size: 15px;
        font-weight: 800;
        margin: 0;
      }

      .ls-profile-meta {
        font-size: 11px;
        color: var(--ls-muted);
        margin: 2px 0 0;
      }

      .ls-token-status {
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        border: 1px solid #2a2d3a;
        color: #d1d5db;
      }

      .ls-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
      }

      .ls-status-dot.warning {
        background: #f59e0b;
        box-shadow: 0 0 8px #f59e0b;
      }

      .ls-profile-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .ls-setup-actions {
        display: flex;
        gap: 10px;
        margin-top: auto;
      }
    </style>

    <div class="ls-root">
      <section class="ls-panel ls-dock-right" id="lsPanel">
        <div class="ls-header">
          <div class="ls-brand">
            <img src="${logoUrl}" alt="Leet Sync logo" class="ls-logo" />
            <div>
              <h3 class="ls-title">Leet Sync</h3>
              <p class="ls-subtitle">Focus mode notes + one-click save</p>
            </div>
          </div>
          <div class="ls-header-actions">
            <button class="ls-setup-icon" id="lsSetup" type="button" aria-label="GitHub setup">⚙</button>
            <button class="ls-minimize" id="lsMinimize" type="button" aria-label="Minimize">−</button>
          </div>
        </div>

        <div class="ls-main" id="lsMainView">
          <div class="ls-controls">
            <button class="ls-primary" id="lsExtract" type="button">Extract</button>
            <button class="ls-primary" id="lsSave" type="button" disabled>Save</button>
          </div>

          <div class="ls-grid">
            <select class="ls-select" id="lsDifficulty">
              <option value="Unknown">Difficulty: Unknown</option>
              <option value="Easy">Difficulty: Easy</option>
              <option value="Medium">Difficulty: Medium</option>
              <option value="Hard">Difficulty: Hard</option>
            </select>

            <select class="ls-select" id="lsPattern">
              <option value="Uncategorized">Pattern: Uncategorized</option>
            </select>
          </div>

          <section class="ls-section">
            <p class="ls-minihead">Code Preview</p>
            <pre class="ls-code" id="lsCodePreview"></pre>
          </section>

          <section class="ls-section">
            <p class="ls-minihead">Notes</p>
            <div class="ls-notes" id="lsNotes" data-active="intuition">
              <div class="ls-note" data-note="intuition" id="lsNoteIntuition">
                <label class="ls-label" for="lsIntuition">Intuition</label>
                <textarea class="ls-textarea" id="lsIntuition" rows="3" placeholder="First thoughts, constraints, and signal..."></textarea>
              </div>

              <div class="ls-note" data-note="approach" id="lsNoteApproach">
                <label class="ls-label" for="lsApproach">Approach</label>
                <textarea class="ls-textarea" id="lsApproach" rows="4" placeholder="Step-by-step algorithm and edge cases..."></textarea>
              </div>

              <div class="ls-note" data-note="walkthrough" id="lsNoteWalkthrough">
                <label class="ls-label" for="lsWalkthrough">Example Walkthrough</label>
                <textarea class="ls-textarea" id="lsWalkthrough" rows="4" placeholder="Dry run with sample values..."></textarea>
              </div>
            </div>
          </section>

          <section class="ls-section">
            <p class="ls-minihead">Complexity</p>
            <div class="ls-grid ls-complexity">
              <input class="ls-input" id="lsTime" placeholder="Time: O(...)" />
              <input class="ls-input" id="lsSpace" placeholder="Space: O(...)" />
            </div>
          </section>
        </div>

        <div class="ls-setup-view hidden" id="lsSetupView">
          <div>
            <p id="lsSetupStepLabel" class="ls-setup-step-label">Step 1 of 3</p>
            <h3 id="lsSetupTitle" class="ls-setup-title">Connect GitHub</h3>
            <p id="lsSetupHelp" class="ls-setup-help">Enter your GitHub Personal Access Token.</p>
          </div>

          <input id="lsSetupInput" class="ls-input" placeholder="ghp_..." type="password" />

          <div class="ls-setup-actions">
            <button class="ls-secondary" id="lsSetupBack" type="button">Back</button>
            <button class="ls-primary" id="lsSetupNext" type="button">Next</button>
          </div>
        </div>

        <div class="ls-profile-view hidden" id="lsProfileView">
           <div class="ls-profile-card">
              <div class="ls-profile-header">
                <div class="ls-profile-avatar" id="lsProfileAvatar">?</div>
                <div class="ls-profile-info">
                   <h3 class="ls-profile-name" id="lsProfileName">GitHub User</h3>
                   <p class="ls-profile-meta" id="lsProfileRepo">repo-name</p>
                </div>
              </div>
           </div>

           <div class="ls-profile-actions">
              <button class="ls-secondary" id="lsProfileEdit" type="button">Edit</button>
              <button class="ls-secondary" id="lsProfileLogout" type="button" style="border-color: #632a2a; color: #ffb3b3;">Logout</button>
           </div>
           
           <button class="ls-primary" id="lsProfileFinish" type="button">Finish</button>
        </div>

        <p class="ls-status" id="lsStatus">Checking setup...</p>
      </section>

      <button class="ls-bubble ls-dock-right" id="lsBubble" type="button" aria-label="Open Leet Sync">
        <img src="${logoUrl}" alt="Leet Sync" />
      </button>
    </div>
  `;

  const panel = shadow.getElementById("lsPanel") as HTMLElement | null;
  const bubble = shadow.getElementById("lsBubble") as HTMLButtonElement | null;
  const statusEl = shadow.getElementById("lsStatus") as HTMLParagraphElement | null;

  const mainView = shadow.getElementById("lsMainView") as HTMLDivElement | null;
  const setupView = shadow.getElementById("lsSetupView") as HTMLDivElement | null;
  const profileView = shadow.getElementById("lsProfileView") as HTMLDivElement | null;
  const setupBtn = shadow.getElementById("lsSetup") as HTMLButtonElement | null;

  const setupStepLabel = shadow.getElementById("lsSetupStepLabel") as HTMLParagraphElement | null;
  const setupTitle = shadow.getElementById("lsSetupTitle") as HTMLHeadingElement | null;
  const setupHelp = shadow.getElementById("lsSetupHelp") as HTMLParagraphElement | null;
  const setupInput = shadow.getElementById("lsSetupInput") as HTMLInputElement | null;
  const setupBackBtn = shadow.getElementById("lsSetupBack") as HTMLButtonElement | null;
  const setupNextBtn = shadow.getElementById("lsSetupNext") as HTMLButtonElement | null;

  const profileAvatar = shadow.getElementById("lsProfileAvatar") as HTMLDivElement | null;
  const profileName = shadow.getElementById("lsProfileName") as HTMLHeadingElement | null;
  const profileRepo = shadow.getElementById("lsProfileRepo") as HTMLParagraphElement | null;
  const profileEditBtn = shadow.getElementById("lsProfileEdit") as HTMLButtonElement | null;
  const profileLogoutBtn = shadow.getElementById("lsProfileLogout") as HTMLButtonElement | null;
  const profileFinishBtn = shadow.getElementById("lsProfileFinish") as HTMLButtonElement | null;

  const minimizeBtn = shadow.getElementById("lsMinimize") as HTMLButtonElement | null;
  const extractBtn = shadow.getElementById("lsExtract") as HTMLButtonElement | null;
  const saveBtn = shadow.getElementById("lsSave") as HTMLButtonElement | null;

  const difficultySelect = shadow.getElementById("lsDifficulty") as HTMLSelectElement | null;
  const patternSelect = shadow.getElementById("lsPattern") as HTMLSelectElement | null;
  const codePreview = shadow.getElementById("lsCodePreview") as HTMLPreElement | null;

  const notesBox = shadow.getElementById("lsNotes") as HTMLDivElement | null;
  const intuitionCard = shadow.getElementById("lsNoteIntuition") as HTMLDivElement | null;
  const approachCard = shadow.getElementById("lsNoteApproach") as HTMLDivElement | null;
  const walkthroughCard = shadow.getElementById("lsNoteWalkthrough") as HTMLDivElement | null;

  const intuitionInput = shadow.getElementById("lsIntuition") as HTMLTextAreaElement | null;
  const approachInput = shadow.getElementById("lsApproach") as HTMLTextAreaElement | null;
  const walkthroughInput = shadow.getElementById("lsWalkthrough") as HTMLTextAreaElement | null;
  const timeInput = shadow.getElementById("lsTime") as HTMLInputElement | null;
  const spaceInput = shadow.getElementById("lsSpace") as HTMLInputElement | null;

  if (
    !panel ||
    !bubble ||
    !minimizeBtn ||
    !extractBtn ||
    !saveBtn ||
    !setupBtn ||
    !difficultySelect ||
    !patternSelect ||
    !codePreview ||
    !notesBox ||
    !intuitionCard ||
    !approachCard ||
    !walkthroughCard ||
    !intuitionInput ||
    !approachInput ||
    !walkthroughInput ||
    !timeInput ||
    !spaceInput ||
    !statusEl ||
    !mainView ||
    !setupView ||
    !setupStepLabel ||
    !setupTitle ||
    !setupHelp ||
    !setupInput ||
    !setupBackBtn ||
    !setupNextBtn ||
    !profileView ||
    !profileAvatar ||
    !profileName ||
    !profileRepo ||
    !profileEditBtn ||
    !profileLogoutBtn ||
    !profileFinishBtn
  ) {
    return;
  }

  let lastExtractedData: ExtractedProblemData | null = null;
  let currentDock: DockEdge = "right";
  let isBubbleDragging = false;
  let didBubbleMove = false;
  let dragPointerId = -1;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDistance = 0;
  let bubbleHasCustomPosition = false;
  let bubblePosition: { left: number; top: number } | null = null;
  let suppressNextBubbleClick = false;
  const bubbleEdgeGap = 10;

  PATTERNS.forEach((pattern) => {
    const option = document.createElement("option");
    option.value = pattern;
    option.textContent = pattern;
    patternSelect.appendChild(option);
  });

  function setCodePreview(code: string | null) {
    if (!codePreview) return;
    if (!code || code.trim().length === 0) {
      codePreview.textContent = "Code preview appears here after extraction.";
      codePreview.classList.add("empty");
      return;
    }

    codePreview.textContent = code;
    codePreview.classList.remove("empty");
  }

  setCodePreview(null);

  function setStatus(text: string, type: "info" | "error" | "success" = "info") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove("error", "success", "hidden");
    if (type === "error") statusEl.classList.add("error");
    if (type === "success") statusEl.classList.add("success");
    if (!text) statusEl.classList.add("hidden");
  }

  function applyPanelDock(edge: DockEdge) {
    panel.classList.remove("ls-dock-left", "ls-dock-right", "ls-dock-top", "ls-dock-bottom");
    panel.classList.add(`ls-dock-${edge}`);
  }

  function applyBubbleDock(edge: DockEdge) {
    bubble.classList.remove("ls-dock-left", "ls-dock-right", "ls-dock-top", "ls-dock-bottom");
    bubble.classList.add(`ls-dock-${edge}`);

    bubble.style.left = "";
    bubble.style.top = "";
    bubble.style.right = "";
    bubble.style.bottom = "";
    bubble.style.transform = "";
    bubbleHasCustomPosition = false;
  }

  function applyDock(edge: DockEdge) {
    currentDock = edge;
    applyPanelDock(edge);

    if (!bubbleHasCustomPosition) {
      applyBubbleDock(edge);
    }
  }

  function clampBubblePosition(left: number, top: number) {
    const bubbleWidth = bubble.offsetWidth || 66;
    const bubbleHeight = bubble.offsetHeight || 66;

    const maxLeft = Math.max(bubbleEdgeGap, window.innerWidth - bubbleWidth - bubbleEdgeGap);
    const maxTop = Math.max(bubbleEdgeGap, window.innerHeight - bubbleHeight - bubbleEdgeGap);

    return {
      left: Math.max(bubbleEdgeGap, Math.min(maxLeft, left)),
      top: Math.max(bubbleEdgeGap, Math.min(maxTop, top))
    };
  }

  function setBubblePosition(left: number, top: number, markCustom = true) {
    const clamped = clampBubblePosition(left, top);

    bubble.classList.remove("ls-dock-left", "ls-dock-right", "ls-dock-top", "ls-dock-bottom");
    bubble.style.left = `${clamped.left}px`;
    bubble.style.top = `${clamped.top}px`;
    bubble.style.right = "auto";
    bubble.style.bottom = "auto";
    bubble.style.transform = "none";
    bubblePosition = clamped;

    if (markCustom) {
      bubbleHasCustomPosition = true;
    }
  }

  function minimizeOverlay() {
    if (bubbleHasCustomPosition) {
      const left = bubblePosition?.left ?? (Number.parseFloat(bubble.style.left || "0") || 0);
      const top = bubblePosition?.top ?? (Number.parseFloat(bubble.style.top || "0") || 0);
      setBubblePosition(left, top);
    } else {
      applyBubbleDock(currentDock);
    }

    panel.classList.add("hidden");
    bubble.classList.add("visible");
  }

  function restoreOverlay() {
    if (bubbleHasCustomPosition) {
      const left = bubblePosition?.left ?? (Number.parseFloat(bubble.style.left || "0") || 0);
      const top = bubblePosition?.top ?? (Number.parseFloat(bubble.style.top || "0") || 0);
      currentDock = nearestEdgeFromBubblePosition(left, top);
      applyPanelDock(currentDock);
    } else {
      applyPanelDock(currentDock);
    }

    panel.classList.remove("hidden");
    bubble.classList.remove("visible");
  }

  function setActiveNote(note: NoteField) {
    notesBox.dataset.active = note;
  }

  function pulseCard(card: HTMLDivElement) {
    card.classList.remove("ls-grow");
    void card.offsetWidth;
    card.classList.add("ls-grow");
    window.setTimeout(() => card.classList.remove("ls-grow"), 220);
  }

  function bindNote(input: HTMLTextAreaElement, card: HTMLDivElement, note: NoteField) {
    input.addEventListener("focus", () => {
      setActiveNote(note);
      pulseCard(card);
    });

    input.addEventListener("input", () => {
      setActiveNote(note);
      pulseCard(card);
    });
  }

  bindNote(intuitionInput, intuitionCard, "intuition");
  bindNote(approachInput, approachCard, "approach");
  bindNote(walkthroughInput, walkthroughCard, "walkthrough");
  setActiveNote("intuition");

  function nearestEdgeFromBubblePosition(left: number, top: number): DockEdge {
    const rect = {
      left,
      top,
      right: left + (bubble.offsetWidth || 66),
      bottom: top + (bubble.offsetHeight || 66)
    };

    const distances: Array<{ edge: DockEdge; value: number }> = [
      { edge: "left", value: rect.left },
      { edge: "right", value: window.innerWidth - rect.right },
      { edge: "top", value: rect.top },
      { edge: "bottom", value: window.innerHeight - rect.bottom }
    ];

    distances.sort((a, b) => a.value - b.value);
    return distances[0]?.edge ?? "right";
  }

  bubble.addEventListener("pointerdown", (event) => {
    if (!bubble.classList.contains("visible")) {
      return;
    }

    if (event.button !== 0 && event.button !== 2) {
      return;
    }

    event.preventDefault();

    isBubbleDragging = true;
    didBubbleMove = false;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragDistance = 0;
    bubble.style.cursor = "grabbing";

    const rect = bubble.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    setBubblePosition(rect.left, rect.top, false);

    bubble.setPointerCapture(event.pointerId);
  });

  bubble.addEventListener("pointermove", (event) => {
    if (!isBubbleDragging) {
      return;
    }

    event.preventDefault();

    const nextLeft = event.clientX - dragOffsetX;
    const nextTop = event.clientY - dragOffsetY;
    setBubblePosition(nextLeft, nextTop);

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    dragDistance = Math.hypot(dx, dy);
    didBubbleMove = dragDistance > 1.5;
  });

  const stopBubbleDrag = () => {
    if (!isBubbleDragging) {
      return;
    }

    isBubbleDragging = false;
    bubble.style.cursor = "grab";

    if (bubble.hasPointerCapture(dragPointerId)) {
      bubble.releasePointerCapture(dragPointerId);
    }

    if (didBubbleMove) {
      suppressNextBubbleClick = true;
      window.setTimeout(() => {
        suppressNextBubbleClick = false;
      }, 160);

      const left = Number.parseFloat(bubble.style.left || "0") || 0;
      const top = Number.parseFloat(bubble.style.top || "0") || 0;
      const nearest = nearestEdgeFromBubblePosition(left, top);
      currentDock = nearest;
      setBubblePosition(left, top);
    } else if (!bubbleHasCustomPosition) {
      applyBubbleDock(currentDock);
    }
  };

  bubble.addEventListener("pointerup", stopBubbleDrag);
  bubble.addEventListener("pointercancel", stopBubbleDrag);
  bubble.addEventListener("contextmenu", (event) => {
    if (bubble.classList.contains("visible")) {
      event.preventDefault();
    }
  });

  minimizeBtn.addEventListener("click", minimizeOverlay);
  bubble.addEventListener("click", (event) => {
    if (didBubbleMove || suppressNextBubbleClick) {
      event.preventDefault();
      didBubbleMove = false;
      suppressNextBubbleClick = false;
      return;
    }

    restoreOverlay();
  });

  window.addEventListener("resize", () => {
    applyPanelDock(currentDock);

    if (bubbleHasCustomPosition) {
      const left = bubblePosition?.left ?? (Number.parseFloat(bubble.style.left || "0") || 0);
      const top = bubblePosition?.top ?? (Number.parseFloat(bubble.style.top || "0") || 0);
      setBubblePosition(left, top);
      return;
    }

    applyBubbleDock(currentDock);
  });

  /* ======================================================
     INTERNAL SETUP FLOW
  ====================================================== */

  interface SetupKeyData {
    key: SetupKey;
    title: string;
    help: string;
    placeholder: string;
    inputType: "text" | "password";
  }

  const OVERLAY_SETUP_STEPS: SetupKeyData[] = [
    {
      key: "githubToken",
      title: "Connect GitHub",
      help: "Enter your GitHub Personal Access Token.",
      placeholder: "ghp_...",
      inputType: "password"
    },
    {
      key: "githubOwner",
      title: "GitHub Username",
      help: "Enter the GitHub username that owns the repository.",
      placeholder: "your-username",
      inputType: "text"
    },
    {
      key: "githubRepo",
      title: "Repository / Folder",
      help: "Enter the repository name where LeetSync should save files.",
      placeholder: "leetcode",
      inputType: "text"
    }
  ];

  type SetupKey = "githubToken" | "githubOwner" | "githubRepo";
  let setupStepIndex = 0;
  let setupDraft: Partial<GitHubSettings> = {};
  let githubSettings: GitHubSettings | null = null;

  function showSetupView() {
    profileView?.classList.add("hidden");
    mainView?.classList.add("hidden");
    setupView?.classList.remove("hidden");
  }

  function showMainView() {
    profileView?.classList.add("hidden");
    setupView?.classList.add("hidden");
    mainView?.classList.remove("hidden");
  }

  function showProfileView() {
    mainView?.classList.add("hidden");
    setupView?.classList.add("hidden");
    profileView?.classList.remove("hidden");
  }

  function renderSetupStep() {
    const step = OVERLAY_SETUP_STEPS[setupStepIndex];
    if (!step || !setupStepLabel || !setupTitle || !setupHelp || !setupInput || !setupBackBtn || !setupNextBtn) return;

    setupStepLabel.textContent = `Step ${setupStepIndex + 1} of ${OVERLAY_SETUP_STEPS.length}`;
    setupTitle.textContent = step.title;
    setupHelp.textContent = step.help;
    setupInput.type = step.inputType;
    setupInput.placeholder = step.placeholder;
    setupInput.value = setupDraft[step.key] ?? "";
    setupInput.focus();

    setupBackBtn.disabled = false;
    setupNextBtn.textContent = setupStepIndex === OVERLAY_SETUP_STEPS.length - 1 ? "Finish" : "Next";
  }

  async function openSetup(startAtFirstStep = false) {
    if (startAtFirstStep) {
      setupStepIndex = 0;
    }

    const data = await chrome.storage.local.get(["githubToken", "githubOwner", "githubRepo"]);
    setupDraft = {
      githubToken: (data.githubToken as string) ?? "",
      githubOwner: (data.githubOwner as string) ?? "",
      githubRepo: (data.githubRepo as string) ?? ""
    };

    showSetupView();
    renderSetupStep();
  }

  async function renderProfileView() {
    if (!profileAvatar || !profileName || !profileRepo) return;

    const owner = githubSettings?.githubOwner || "Unknown";
    profileAvatar.textContent = owner[0]?.toUpperCase() || "?";
    profileName.textContent = owner;
    profileRepo.textContent = `Repository: ${githubSettings?.githubRepo || "Not set"}`;

    setStatus("Ready.", "info");
  }

  function openProfile() {
    renderProfileView();
    showProfileView();
  }


  setupBackBtn.addEventListener("click", async () => {
    if (setupStepIndex > 0) {
      setupStepIndex--;
      renderSetupStep();
    } else {
      const settings = await hasGitHubSetup();
      if (settings) {
        openProfile();
      } else {
        showMainView();
      }
    }
  });

  profileEditBtn.addEventListener("click", () => {
    openSetup(true);
  });

  profileLogoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout? All GitHub settings will be cleared.")) {
      await chrome.storage.local.remove(["githubToken", "githubOwner", "githubRepo"]);
      githubSettings = null;
      openSetup(true);
      setStatus("Logged out.", "info");
    }
  });

  profileFinishBtn.addEventListener("click", () => {
    showMainView();
  });

  setupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      setupNextBtn.click();
    }
  });

  setupNextBtn.addEventListener("click", async () => {
    const step = OVERLAY_SETUP_STEPS[setupStepIndex];
    const val = setupInput.value.trim();

    if (!val) {
      setStatus("This field is required.", "error");
      return;
    }

    setupDraft[step.key] = val;

    if (setupStepIndex < OVERLAY_SETUP_STEPS.length - 1) {
      setupStepIndex++;
      renderSetupStep();
    } else {
      await chrome.storage.local.set({ ...setupDraft, setupDate: Date.now() });
      githubSettings = {
        githubToken: setupDraft.githubToken || "",
        githubOwner: setupDraft.githubOwner || "",
        githubRepo: setupDraft.githubRepo || ""
      };
      openProfile();
      setStatus("GitHub settings saved.", "success");
      setTimeout(() => {
        setStatus("Ready.", "info");
      }, 3000);
    }
  });

  (async () => {
    const settings = await hasGitHubSetup();
    if (!settings && panel.classList.contains("hidden") === false) {
      openSetup(true);
    } else if (settings) {
      const data = await chrome.storage.local.get(["githubToken", "githubOwner", "githubRepo"]);
      githubSettings = {
        githubToken: data.githubToken as string,
        githubOwner: data.githubOwner as string,
        githubRepo: data.githubRepo as string
      };
      // If we are opening settings, maybe show profile? 
      // setupBtn currently opens setup. Let's make it open Profile if settings exist.
    }
  })();

  setupBtn.addEventListener("click", async () => {
    const settings = await hasGitHubSetup();
    if (settings) {
      openProfile();
    } else {
      openSetup(true);
    }
  });

  extractBtn.addEventListener("click", async () => {
    setStatus("Extracting from page...", "info");

    const data = await extractProblemFromPage();
    if (!data) {
      setStatus("Extraction failed. Make sure editor is loaded.", "error");
      return;
    }

    lastExtractedData = data;
    setCodePreview(data.code);
    difficultySelect.value = data.difficulty;
    saveBtn.disabled = false;

    setStatus("Extracted successfully.", "success");
  });

  saveBtn.addEventListener("click", async () => {
    if (!lastExtractedData) {
      setStatus("Extract first.", "error");
      return;
    }

    const setupReady = await hasGitHubSetup();
    if (!setupReady) {
      setStatus("Complete GitHub setup first.", "error");
      return;
    }

    const difficulty = difficultySelect.value || "Unknown";
    const pattern = patternSelect.value || "Uncategorized";

    const markdown = generateMarkdown({
      title: lastExtractedData.title,
      difficulty,
      pattern,
      language: lastExtractedData.language,
      url: lastExtractedData.url,
      code: lastExtractedData.code,
      intuition: intuitionInput.value,
      approach: approachInput.value,
      walkthrough: walkthroughInput.value,
      timeComplexity: timeInput.value,
      spaceComplexity: spaceInput.value
    });

    setStatus("Saving to GitHub...", "info");

    try {
      const response = await sendRuntimeMessage<SaveResponse>({
        type: "SAVE_TO_GITHUB",
        payload: {
          title: lastExtractedData.title,
          difficulty,
          pattern,
          markdown,
          questionId: "0567" // TEMP
        }
      });

      if (!response?.success) {
        setStatus(response?.error ?? "Save failed.", "error");
        return;
      }

      setStatus("Saved successfully.", "success");

      intuitionInput.value = "";
      approachInput.value = "";
      walkthroughInput.value = "";
      timeInput.value = "";
      spaceInput.value = "";
      setActiveNote("intuition");
    } catch {
      setStatus("Save failed.", "error");
    }
  });

  applyDock("right");

  hasGitHubSetup().then((ok) => {
    if (!ok) {
      setStatus("GitHub setup required.", "info");
      return;
    }

    setStatus("Ready.", "info");
  });
}

try {
  if (chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type !== "EXTRACT_PROBLEM") return;

      (async () => {
        const data = await extractProblemFromPage();

        if (!data) {
          sendResponse({ success: false });
          return;
        }

        sendResponse({ success: true, data });
      })();

      return true;
    });
  }
} catch (e) {
  console.warn("[LeetSync] Extension context invalidated, message listener skipped.");
}

mountOverlay();
