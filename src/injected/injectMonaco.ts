// This runs in the PAGE context (not extension)

//  FIX: make this file a module so global augmentation is allowed
export {};

// FIX: declare monaco on Window for TypeScript
declare global {
  interface Window {
    monaco?: {
      editor?: {
        getModels?: () => Array<{
          getValue: () => string;
          getLanguageId: () => string;
        }>;
      };
    };
  }
}

(function () {
  try {
    const editor =
      window.monaco &&
      window.monaco.editor &&
      typeof window.monaco.editor.getModels === "function"
        ? window.monaco.editor.getModels()[0]
        : null;

    if (!editor) {
      window.postMessage(
        { type: "LEETSYNC_CODE", success: false },
        "*"
      );
      return;
    }

    const code = editor.getValue();
    const language = editor.getLanguageId();

    window.postMessage(
      {
        type: "LEETSYNC_CODE",
        success: true,
        payload: { code, language }
      },
      "*"
    );
  } catch {
    window.postMessage(
      { type: "LEETSYNC_CODE", success: false },
      "*"
    );
  }
})();
