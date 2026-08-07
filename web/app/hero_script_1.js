
      (function () {
        const hero = document.querySelector(".hero-anim");
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        const buttons = Array.from(hero.querySelectorAll("[data-diff-action]"));
        const acceptButton = hero.querySelector(".terminal-button.accept");
        const success = hero.querySelector(".terminal-status.success");
        const warning = hero.querySelector(".terminal-status.warning");
        const sequenceLines = {
          push: hero.querySelector('[data-seq="push"] .typing-target'),
          scan: hero.querySelector('[data-seq="scan"] .typing-target'),
          progress: hero.querySelector('[data-seq="progress"] .typing-target'),
          found: hero.querySelector('[data-seq="found"] .typing-target'),
          apply: hero.querySelector('[data-seq="apply"] .typing-target'),
          tests: hero.querySelector('[data-seq="tests"] .typing-target'),
          done: hero.querySelector('[data-seq="done"] .typing-target'),
        };
        const sequenceRows = Array.from(
          hero.querySelectorAll(".sequence-line"),
        );
        const timers = [];
        let resumeTimer = null;

        function clearAllTimers() {
          while (timers.length) {
            window.clearTimeout(timers.pop());
          }
          window.clearTimeout(resumeTimer);
        }

        function markRowsInactive() {
          sequenceRows.forEach((row) => row.classList.remove("active", "done"));
        }

        function setInstantSequence(lines) {
          markRowsInactive();
          sequenceRows.forEach((row) => row.classList.add("done"));
          Object.entries(lines).forEach(([key, value]) => {
            sequenceLines[key].innerHTML = value;
          });
        }

        function typeLine(key, text, delay, done, html) {
          const row = sequenceLines[key].closest(".sequence-line");
          timers.push(
            window.setTimeout(() => {
              row.classList.add("active");
              if (reduceMotion.matches || html) {
                sequenceLines[key].innerHTML = html || text;
                row.classList.remove("active");
                row.classList.add("done");
                if (done) {
                  done();
                }
                return;
              }
              let index = 0;
              sequenceLines[key].textContent = "";
              const tick = () => {
                sequenceLines[key].textContent = text.slice(0, index);
                index += 1;
                if (index <= text.length) {
                  timers.push(
                    window.setTimeout(tick, key === "progress" ? 18 : 24),
                  );
                } else {
                  row.classList.remove("active");
                  row.classList.add("done");
                  if (done) {
                    done();
                  }
                }
              };
              tick();
            }, delay),
          );
        }

        function runSequence(mode) {
          clearAllTimers();
          markRowsInactive();
          Object.values(sequenceLines).forEach((line) => {
            line.textContent = "";
          });

          const accepted = mode !== "rejected";
          hero.dataset.mode = accepted ? "idle" : "rejected";
          success.setAttribute("aria-live", "off");
          warning.setAttribute("aria-live", "off");

          if (reduceMotion.matches) {
            setInstantSequence({
              push: "git push origin feat/pre-push-hook",
              scan: "Scanning changed diff...",
              progress: "diff 3/3 [#####]",
              found: "Issue found.",
              apply: accepted ? "Applying fix..." : "Warning logged.",
              tests: accepted
                ? "Running tests..."
                : "Developer rejected auto-fix.",
              done: "Push allowed.",
            });
            hero.dataset.mode = accepted ? "accepted" : "rejected";
            success.setAttribute("aria-live", accepted ? "polite" : "off");
            warning.setAttribute("aria-live", accepted ? "off" : "polite");
            resumeTimer = window.setTimeout(
              () => runSequence("accepted"),
              3600,
            );
            return;
          }

          typeLine("push", "git push origin feat/pre-push-hook", 0);
          typeLine("scan", "Scanning changed diff...", 480);
          typeLine(
            "progress",
            "diff 3/3 ",
            1040,
            null,
            'diff 3/3 <span class="progress-meter"><span class="filled"></span><span class="filled"></span><span class="filled"></span><span class="filled"></span><span class="filled"></span></span>',
          );
          typeLine("found", "Issue found.", 1540);

          if (accepted) {
            typeLine("apply", "Applying fix...", 2140, () => {
              hero.dataset.mode = "accepted";
            });
            typeLine("tests", "Running tests...", 2700);
            typeLine("done", "Push allowed.", 3300, () => {
              success.setAttribute("aria-live", "polite");
              resumeTimer = window.setTimeout(
                () => runSequence("accepted"),
                5200,
              );
            });
          } else {
            typeLine("apply", "Warning logged.", 2140, () => {
              hero.dataset.mode = "rejected";
            });
            typeLine("tests", "Developer rejected auto-fix.", 2660);
            typeLine("done", "Push allowed.", 3260, () => {
              warning.setAttribute("aria-live", "polite");
              resumeTimer = window.setTimeout(
                () => runSequence("accepted"),
                5200,
              );
            });
          }
        }

        buttons.forEach((button) => {
          button.addEventListener("click", () => {
            runSequence(
              button.dataset.diffAction === "reject" ? "rejected" : "accepted",
            );
          });
        });

        acceptButton.addEventListener("mouseenter", () => {
          acceptButton.dataset.hovered = "true";
        });
        acceptButton.addEventListener("mouseleave", () => {
          acceptButton.dataset.hovered = "false";
        });

        runSequence("accepted");
      })();
    