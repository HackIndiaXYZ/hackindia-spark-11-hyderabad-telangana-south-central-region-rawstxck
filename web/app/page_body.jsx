
    <main className="page">
      

      <Hero />

      <section className="flow-section" id="flow">
        <div className="section-head">
          <div className="eyebrow">real sequence</div>
          <h2>Scan, decide, then ship.</h2>
          <p className="section-copy">
            The numbered steps are justified here because they are the literal
            order of operations. SecurePush only scans the changed diff, waits
            for the developer to decide on each fix, then gates the push on the
            test run.
          </p>
        </div>
        <div className="steps">
          <article className="step">
            <div className="step-index">01</div>
            <h3>Scan</h3>
            <p>
              Intercept <code>git push</code>, diff the changed files since the
              upstream branch, and review only what the agent touched.
            </p>
            <ul>
              <li>
                <strong>Removed</strong> marks the risky line that should not
                ship.
              </li>
              <li>
                <strong>Critical secrets</strong> stay visible instead of
                disappearing into a report.
              </li>
            </ul>
          </article>
          <article className="step">
            <div className="step-index">02</div>
            <h3>Decide</h3>
            <p>
              Show each proposed fix in amber first. The developer accepts or
              rejects line by line instead of trusting a blind auto-fix.
            </p>
            <ul>
              <li>
                <strong>Proposed</strong> means the fix is waiting for a
                decision.
              </li>
              <li>
                <strong>Fixed</strong> appears only after the developer accepts
                it.
              </li>
            </ul>
          </article>
          <article className="step">
            <div className="step-index">03</div>
            <h3>Ship</h3>
            <p>
              Accepted fixes are committed, the configured test command runs,
              and only a passing run allows the push to proceed.
            </p>
            <ul>
              <li>
                <strong>Pass</strong> means the push continues automatically.
              </li>
              <li>
                <strong>Fail</strong> blocks the push before GitHub changes.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section id="comparison">
        <div className="section-head">
          <div className="eyebrow">unified, not first</div>
          <h2>
            Adjacent tools cover fragments of the sequence. SecurePush keeps the
            row intact.
          </h2>
          <p className="section-copy">
            The point is not novelty theater. Review, fix loops, test gates, and
            secret scanning already exist in fragments. The argument here is
            that SecurePush keeps that sequence in one place, adds a visible
            accept-or-reject step, and remembers what happened in this repo over
            time.
          </p>
        </div>
        <div className="comparison-wrap">
          <div
            className="comparison-grid"
            role="table"
            aria-label="Comparison across adjacent tools"
          >
            <div className="grid-head" role="row">
              <div role="columnheader">Tool</div>
              <div role="columnheader">Review</div>
              <div role="columnheader">Fix</div>
              <div role="columnheader">Test-gate</div>
              <div role="columnheader">Memory</div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                GitGuardian<small>secret scanner</small>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Review</span><span>secret check</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No fix</span><span>report only</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No gate</span><span>manual next step</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No memory</span><span>repo history absent</span>
                </div>
              </div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                ai-git-hooks<small>read-only reviewer</small>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Review</span><span>diff scan</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Manual fix</span><span>no accept loop</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No gate</span><span>before push only</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No memory</span><span>single scan</span>
                </div>
              </div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                no-mistakes<small>agentic fix loop</small>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No visual diff</span><span>no line review</span>
                </div>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Fix</span><span>agent applies changes</span>
                </div>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Test-gate</span><span>re-tests before push</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No memory</span><span>run-by-run only</span>
                </div>
              </div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                CI scanners<small>Snyk / pipeline checks</small>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>After push</span><span>not in CLI flow</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>External fix</span><span>outside hook</span>
                </div>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Test-gate</span><span>blocks in CI</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No memory</span><span>repo recall absent</span>
                </div>
              </div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                Git AutoReview<small>PR-time reviewer</small>
              </div>
              <div className="status-cell present">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Review</span><span>post-push PR scan</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No fix</span><span>review only</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No gate</span><span>after review starts</span>
                </div>
              </div>
              <div className="status-cell empty">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>No memory</span><span>no repo timeline</span>
                </div>
              </div>
            </div>

            <div className="grid-row" role="row">
              <div className="tool" role="rowheader">
                SecurePush<small>pre-push workflow</small>
              </div>
              <div className="status-cell filled-green">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Review</span><span>colored diff</span>
                </div>
              </div>
              <div className="status-cell filled-green">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Fix</span><span>accept each change</span>
                </div>
              </div>
              <div className="status-cell filled-green">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Test-gate</span><span>block on fail</span>
                </div>
              </div>
              <div className="status-cell filled-green">
                <span className="status-indicator" aria-hidden="true"></span>
                <div className="indicator-text">
                  <span>Memory</span><span>same repo over time</span>
                </div>
              </div>
            </div>
          </div>
          <p className="compare-note">
            Neutral indicators mark capabilities that exist elsewhere in the
            landscape. Green is reserved for the full pre-push flow SecurePush
            keeps in one place.
          </p>
        </div>
      </section>

      <section id="memory">
        <div className="section-head">
          <div className="eyebrow">history preview</div>
          <h2>Memory turns repeated mistakes into visible patterns.</h2>
          <p className="section-copy">
            The CLI catches the line in front of the push. The dashboard makes
            the pattern visible afterward: what was found, what the developer
            accepted, what got blocked, and what keeps happening in this repo.
          </p>
        </div>
        <div className="memory-section">
          <div className="memory-panel">
            <h3 className="memory-title">repo://securepush-demo/main</h3>
            <ul className="memory-log">
              <li>
                <span className="terminal-meta"
                  >2026-07-24 09:41 / apps/web/lib/auth.ts / finding:
                  hardcoded_secret</span
                >
                <span
                  ><span className="accepted-text">Fixed</span> / accepted
                  environment variable swap, tests passed, push continued.</span
                >
              </li>
              <li>
                <span className="terminal-meta"
                  >2026-07-22 18:07 / packages/cli/src/providers.ts / finding:
                  hallucinated_dependency</span
                >
                <span
                  ><span className="proposed-text">Proposed</span> / rejected import
                  rewrite, warning retained for follow-up.</span
                >
              </li>
              <li>
                <span className="terminal-meta"
                  >2026-07-20 13:12 / api/session.ts / finding:
                  insecure_auth_flow</span
                >
                <span
                  ><span className="removed-text">Blocked</span> / test gate failed
                  after fix, nothing reached GitHub.</span
                >
              </li>
            </ul>
            <a className="link-card" href="securepush-history.html"
              >Open the full history / insights page →</a
            >
          </div>
          <aside className="history-snippet">
            <div className="eyebrow">judge hook</div>
            <h3>Near misses caught before GitHub</h3>
            <ul className="snippet-list">
              <li><strong>7 secrets</strong> removed before they shipped.</li>
              <li>
                <strong>3 hallucinated dependencies</strong> flagged this week.
              </li>
              <li>
                <strong>2 auth vulnerabilities</strong> blocked by the test
                gate.
              </li>
              <li><strong>0 incidents</strong> in the seeded demo repo.</li>
            </ul>
            <div className="command-line">
              Install once, then let every push prove itself.
            </div>
          </aside>
        </div>
      </section>

      <footer>
        <span>~/securepush $ accept a fix, then run the tests</span>
        <span
          ><a href="securepush-login.html">Sign in to link your CLI</a></span
        >
      </footer>
    </main>

    <script>
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
    </script>

    <script>
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
            'diff 3/3 <span className="progress-meter"><span className="filled"></span><span className="filled"></span><span className="filled"></span><span className="filled"></span><span className="filled"></span></span>',
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
    </script>
  