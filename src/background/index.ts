// src/background/index.ts

import { buildGitHubPath } from "./path";
import { createOrUpdateFile } from "./github";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) {
    return;
  }
  console.log("LeetSync installed successfully");
});

chrome.runtime.onMessage.addListener(
  (
    msg: { type: string; payload?: any },
    _sender,
    sendResponse
  ) => {
    if (msg.type === "OPEN_SETUP") {
      chrome.runtime
        .openOptionsPage()
        .then(() => sendResponse({ success: true }))
        .catch((error: unknown) =>
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Failed to open setup"
          })
        );

      return true;
    }

    if (msg.type !== "SAVE_TO_GITHUB") {
      return false;
    }

    (async () => {
      try {
        /* -------------------------------
           1️Validate payload
        -------------------------------- */
        const payload = msg.payload;
        if (!payload) {
          throw new Error("Missing payload");
        }

        const { title, pattern, markdown, questionId } = payload;

        if (
          typeof title !== "string" ||
          typeof pattern !== "string" ||
          typeof markdown !== "string"
        ) {
          throw new Error("Invalid payload data");
        }

        /* -------------------------------
           2️ Read GitHub settings
        -------------------------------- */
        const { githubToken, githubOwner, githubRepo } = await chrome.storage.local.get([
          "githubToken",
          "githubOwner",
          "githubRepo"
        ]);

        if (!githubToken || typeof githubToken !== "string") {
          throw new Error("GitHub token not found. Complete setup page first.");
        }

        if (!githubOwner || typeof githubOwner !== "string") {
          throw new Error("GitHub username not found. Complete setup page first.");
        }

        if (!githubRepo || typeof githubRepo !== "string") {
          throw new Error("GitHub repository not found. Complete setup page first.");
        }

        /* -------------------------------
           3️ Build file path
        -------------------------------- */
        const path = buildGitHubPath(
          pattern,
          title,
          questionId ?? "XXXX"
        );

        /* -------------------------------
           4️ Save to GitHub
        -------------------------------- */
        await createOrUpdateFile({
          token: githubToken.trim(),
          owner: githubOwner.trim(),
          repo: githubRepo.trim(),
          path,
          content: markdown,
          message: `Add ${title}`
        });

        sendResponse({ success: true });

      } catch (error) {
        console.error("GitHub save failed:", error);

        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error"
        });
      }
    })();

    // REQUIRED for async response
    return true;
  }
);
