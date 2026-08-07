
      (function () {
        const copyButton = document.querySelector(
          ".install-terminal [data-copy-command]",
        );
        const feedback = document.querySelector(
          ".install-terminal .copy-feedback",
        );
        if (!copyButton || !feedback) return;

        const defaultLabel = feedback.textContent;
        let resetTimer;

        copyButton.addEventListener("click", async () => {
          const command = copyButton.getAttribute("data-copy-command") || "";
          try {
            await navigator.clipboard.writeText(command);
            feedback.textContent = "Copied ✓";
          } catch {
            feedback.textContent = "Press ⌘/Ctrl+C to copy";
          }
          clearTimeout(resetTimer);
          resetTimer = window.setTimeout(() => {
            feedback.textContent = defaultLabel;
          }, 2000);
        });
      })();
    