import { generateMarkdown } from "../utils/markdown";
import { PATTERNS } from "../utils/patterns";

/* ======================================================
   DOM ELEMENTS
====================================================== */

const setupView =
  document.getElementById("setupView") as HTMLDivElement | null;

const mainView =
  document.getElementById("mainView") as HTMLDivElement | null;

const setupStepLabel =
  document.getElementById("setupStepLabel") as HTMLParagraphElement | null;

const setupTitle =
  document.getElementById("setupTitle") as HTMLHeadingElement | null;

const setupHelp =
  document.getElementById("setupHelp") as HTMLParagraphElement | null;

const setupInput =
  document.getElementById("setupInput") as HTMLInputElement | null;

const setupBackBtn =
  document.getElementById("setupBackBtn") as HTMLButtonElement | null;

const setupNextBtn =
  document.getElementById("setupNextBtn") as HTMLButtonElement | null;

const setupStatusEl =
  document.getElementById("setupStatus") as HTMLParagraphElement | null;

const profileView =
  document.getElementById("profileView") as HTMLDivElement | null;

const profileAvatar =
  document.getElementById("profileAvatar") as HTMLDivElement | null;

const profileName =
  document.getElementById("profileName") as HTMLHeadingElement | null;

const profileRepo =
  document.getElementById("profileRepo") as HTMLParagraphElement | null;

const profileEditBtn =
  document.getElementById("profileEditBtn") as HTMLButtonElement | null;

const profileLogoutBtn =
  document.getElementById("profileLogoutBtn") as HTMLButtonElement | null;

const profileFinishBtn =
  document.getElementById("profileFinishBtn") as HTMLButtonElement | null;

const openSettingsBtn =
  document.getElementById("openSettingsBtn") as HTMLButtonElement | null;

const extractBtn =
  document.getElementById("extractBtn") as HTMLButtonElement | null;

const saveBtn =
  document.getElementById("saveBtn") as HTMLButtonElement | null;

const statusEl =
  document.getElementById("status") as HTMLParagraphElement | null;

const difficultySelect =
  document.getElementById("difficulty") as HTMLSelectElement | null;

const patternSelect =
  document.getElementById("patternSelect") as HTMLSelectElement | null;

const codePreview =
  document.getElementById("codePreview") as HTMLPreElement | null;

const intuitionInput =
  document.getElementById("intuition") as HTMLTextAreaElement | null;

const approachInput =
  document.getElementById("approach") as HTMLTextAreaElement | null;

const walkthroughInput =
  document.getElementById("walkthrough") as HTMLTextAreaElement | null;

const timeComplexityInput =
  document.getElementById("timeComplexity") as HTMLInputElement | null;

const spaceComplexityInput =
  document.getElementById("spaceComplexity") as HTMLInputElement | null;

/* ======================================================
   TYPES + STATE
====================================================== */

type SetupKey = "githubToken" | "githubOwner" | "githubRepo";

interface SetupStep {
  key: SetupKey;
  title: string;
  help: string;
  placeholder: string;
  inputType: "text" | "password";
}

interface GitHubSettings {
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
}

const SETUP_STEPS: SetupStep[] = [
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

let setupStepIndex = 0;
let setupDraft: Partial<GitHubSettings> = {};
let githubSettings: GitHubSettings | null = null;

let lastExtractedData: {
  title: string;
  url: string;
  language: string;
  code: string;
} | null = null;

if (saveBtn) saveBtn.disabled = true;

/* ======================================================
   HELPERS
====================================================== */

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidGitHubSettings(value: unknown): value is GitHubSettings {
  if (!value || typeof value !== "object") return false;

  const maybeSettings = value as Partial<GitHubSettings>;

  return (
    isNonEmptyString(maybeSettings.githubToken) &&
    isNonEmptyString(maybeSettings.githubOwner) &&
    isNonEmptyString(maybeSettings.githubRepo)
  );
}

async function loadGitHubSettings(): Promise<GitHubSettings | null> {
  const data = await chrome.storage.local.get([
    "githubToken",
    "githubOwner",
    "githubRepo"
  ]);

  if (!isValidGitHubSettings(data)) {
    return null;
  }

  return {
    githubToken: data.githubToken.trim(),
    githubOwner: data.githubOwner.trim(),
    githubRepo: data.githubRepo.trim()
  };
}

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

async function renderProfileView() {
  if (!githubSettings) return;
  if (!profileAvatar || !profileName || !profileRepo) return;

  const owner = githubSettings.githubOwner;
  profileAvatar.textContent = owner[0]?.toUpperCase() || "?";
  profileName.textContent = owner;
  profileRepo.textContent = `Repository: ${githubSettings.githubRepo}`;
}

function openProfile() {
  renderProfileView();
  showProfileView();
}

function renderSetupStep() {
  const step = SETUP_STEPS[setupStepIndex];
  if (!step) return;

  if (setupStepLabel) {
    setupStepLabel.textContent = `Step ${setupStepIndex + 1} of ${SETUP_STEPS.length}`;
  }

  if (setupTitle) {
    setupTitle.textContent = step.title;
  }

  if (setupHelp) {
    setupHelp.textContent = step.help;
  }

  if (setupInput) {
    setupInput.type = step.inputType;
    setupInput.placeholder = step.placeholder;
    setupInput.value = setupDraft[step.key] ?? "";
    setupInput.focus();
    setupInput.select();
  }

  if (setupBackBtn) {
    setupBackBtn.disabled = false;
  }

  if (setupNextBtn) {
    setupNextBtn.textContent =
      setupStepIndex === SETUP_STEPS.length - 1 ? "Finish" : "Next";
  }

  if (setupStatusEl) {
    setupStatusEl.textContent = "";
  }
}

function openSetup(startAtFirstStep = false) {
  if (startAtFirstStep) {
    setupStepIndex = 0;
  }

  setupDraft = {
    githubToken: githubSettings?.githubToken ?? setupDraft.githubToken ?? "",
    githubOwner: githubSettings?.githubOwner ?? setupDraft.githubOwner ?? "",
    githubRepo: githubSettings?.githubRepo ?? setupDraft.githubRepo ?? ""
  };

  showSetupView();
  renderSetupStep();
}

/* ======================================================
   RESTORE NOTES FROM STORAGE
====================================================== */

chrome.storage.local.get(
  [
    "intuition",
    "approach",
    "walkthrough",
    "timeComplexity",
    "spaceComplexity",
    "difficulty",
    "pattern"
  ],
  (data) => {
    if (intuitionInput && typeof data.intuition === "string")
      intuitionInput.value = data.intuition;

    if (approachInput && typeof data.approach === "string")
      approachInput.value = data.approach;

    if (walkthroughInput && typeof data.walkthrough === "string")
      walkthroughInput.value = data.walkthrough;

    if (timeComplexityInput && typeof data.timeComplexity === "string")
      timeComplexityInput.value = data.timeComplexity;

    if (spaceComplexityInput && typeof data.spaceComplexity === "string")
      spaceComplexityInput.value = data.spaceComplexity;

    if (difficultySelect && typeof data.difficulty === "string")
      difficultySelect.value = data.difficulty;

    if (patternSelect && typeof data.pattern === "string")
      patternSelect.value = data.pattern;
  }
);

/* ======================================================
   AUTO-SAVE NOTES
====================================================== */

function persistNotes() {
  chrome.storage.local.set({
    intuition: intuitionInput?.value ?? "",
    approach: approachInput?.value ?? "",
    walkthrough: walkthroughInput?.value ?? "",
    timeComplexity: timeComplexityInput?.value ?? "",
    spaceComplexity: spaceComplexityInput?.value ?? "",
    difficulty: difficultySelect?.value ?? "Unknown",
    pattern: patternSelect?.value ?? "Uncategorized"
  });
}

intuitionInput?.addEventListener("input", persistNotes);
approachInput?.addEventListener("input", persistNotes);
walkthroughInput?.addEventListener("input", persistNotes);
timeComplexityInput?.addEventListener("input", persistNotes);
spaceComplexityInput?.addEventListener("input", persistNotes);
difficultySelect?.addEventListener("change", persistNotes);
patternSelect?.addEventListener("change", persistNotes);

/* ======================================================
   INIT PATTERN DROPDOWN
====================================================== */

if (patternSelect) {
  PATTERNS.forEach((pattern) => {
    const option = document.createElement("option");
    option.value = pattern;
    option.textContent = pattern;
    patternSelect.appendChild(option);
  });
}

/* ======================================================
   SETUP FLOW
====================================================== */

setupBackBtn?.addEventListener("click", () => {
  if (setupStepIndex === 0) {
    if (githubSettings) {
      openProfile();
    } else {
      showMainView();
    }
    return;
  }

  setupStepIndex -= 1;
  renderSetupStep();
});

setupInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    setupNextBtn?.click();
  }
});

setupNextBtn?.addEventListener("click", async () => {
  const step = SETUP_STEPS[setupStepIndex];
  if (!step || !setupInput) return;

  const value = setupInput.value.trim();

  if (!value) {
    setupStatusEl && (setupStatusEl.textContent = "This field is required.");
    return;
  }

  setupDraft[step.key] = value;

  if (setupStepIndex < SETUP_STEPS.length - 1) {
    setupStepIndex += 1;
    renderSetupStep();
    return;
  }

  if (!isValidGitHubSettings(setupDraft)) {
    setupStatusEl && (setupStatusEl.textContent = "Setup is incomplete.");
    return;
  }

  await chrome.storage.local.set({
    githubToken: setupDraft.githubToken,
    githubOwner: setupDraft.githubOwner,
    githubRepo: setupDraft.githubRepo,
    setupDate: Date.now()
  });

  githubSettings = {
    githubToken: setupDraft.githubToken.trim(),
    githubOwner: setupDraft.githubOwner.trim(),
    githubRepo: setupDraft.githubRepo.trim()
  };

  openProfile();
  statusEl && (statusEl.textContent = "GitHub settings saved.");
});

profileEditBtn?.addEventListener("click", () => {
  openSetup(true);
});

profileLogoutBtn?.addEventListener("click", async () => {
  if (confirm("Are you sure you want to logout? All GitHub settings will be cleared.")) {
    await chrome.storage.local.remove(["githubToken", "githubOwner", "githubRepo"]);
    githubSettings = null;
    openSetup(true);
    statusEl && (statusEl.textContent = "Logged out.");
  }
});

profileFinishBtn?.addEventListener("click", () => {
  showMainView();
});

openSettingsBtn?.addEventListener("click", async () => {
  const currentSettings = await loadGitHubSettings();
  if (currentSettings) {
    githubSettings = currentSettings;
    openProfile();
  } else {
    openSetup(true);
  }
});

/* ======================================================
   EXTRACT BUTTON
====================================================== */

extractBtn?.addEventListener("click", async () => {
  statusEl && (statusEl.textContent = "Extracting...");

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    statusEl && (statusEl.textContent = "No active tab");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: "EXTRACT_PROBLEM" },
    (response) => {
      if (chrome.runtime.lastError || !response?.success || !response?.data) {
        statusEl && (statusEl.textContent = "Extraction failed");
        return;
      }

      lastExtractedData = response.data;

      if (difficultySelect && typeof response.data.difficulty === "string") {
        difficultySelect.value = response.data.difficulty;
      }

      if (codePreview) {
        codePreview.textContent = response.data.code ?? "";
      }

      if (saveBtn) saveBtn.disabled = false;

      statusEl && (statusEl.textContent = "✓ Extracted");
    }
  );
});

/* ======================================================
   SAVE BUTTON
====================================================== */

saveBtn?.addEventListener("click", () => {
  if (!githubSettings) {
    statusEl && (statusEl.textContent = "Complete GitHub setup first");
    openSetup(true);
    return;
  }

  if (!lastExtractedData) {
    statusEl && (statusEl.textContent = "Extract first");
    return;
  }

  const difficulty = difficultySelect?.value ?? "Unknown";
  const pattern = patternSelect?.value ?? "Uncategorized";

  const markdown = generateMarkdown({
    title: lastExtractedData.title,
    difficulty,
    pattern,
    language: lastExtractedData.language,
    url: lastExtractedData.url,
    code: lastExtractedData.code,

    intuition: intuitionInput?.value ?? "",
    approach: approachInput?.value ?? "",
    walkthrough: walkthroughInput?.value ?? "",
    timeComplexity: timeComplexityInput?.value ?? "",
    spaceComplexity: spaceComplexityInput?.value ?? ""
  });

  statusEl && (statusEl.textContent = "Saving...");

  chrome.runtime.sendMessage(
    {
      type: "SAVE_TO_GITHUB",
      payload: {
        title: lastExtractedData.title,
        difficulty,
        pattern,
        markdown,
        questionId: "0567" // TEMP
      }
    },
    (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        statusEl && (statusEl.textContent = "Save failed");
        return;
      }

      statusEl && (statusEl.textContent = "✓ Saved successfully");

      if (intuitionInput) intuitionInput.value = "";
      if (approachInput) approachInput.value = "";
      if (walkthroughInput) walkthroughInput.value = "";
      if (timeComplexityInput) timeComplexityInput.value = "";
      if (spaceComplexityInput) spaceComplexityInput.value = "";

      chrome.storage.local.remove([
        "intuition",
        "approach",
        "walkthrough",
        "timeComplexity",
        "spaceComplexity"
      ]);
    }
  );
});

/* ======================================================
   INITIALIZATION
====================================================== */

(async () => {
  githubSettings = await loadGitHubSettings();

  const forceSetup =
    new URLSearchParams(window.location.search).get("setup") === "1";

  if (!githubSettings || forceSetup) {
    openSetup(true);
    return;
  }

  openProfile();
})();
