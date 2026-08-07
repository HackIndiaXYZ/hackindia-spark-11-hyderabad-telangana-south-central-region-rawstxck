// @ts-nocheck

'use client';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Original script adapted for React ref scope
    // We wrap it in a self-executing function so we don't leak variables and match the original closure
    (function () {
      const copyButton = container.querySelector(".install-terminal [data-copy-command]");
      const feedback = container.querySelector(".install-terminal .copy-feedback");
      if (copyButton && feedback) {
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
      }

      const hero = container.querySelector(".hero-anim");
      if (!hero) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      
      
        
        
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
  }, []);

  return (
    <div ref={containerRef}>
      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">Automatic verification for every push</div>
          <h1>You shouldn't have to remember to ask AI if your code is <em>safe</em>.</h1>
          <p className="lead">
            Every push is verified before it leaves your machine. SecurePush
            automatically fixes common issues, runs tests, and only lets
            verified code reach GitHub. One click to fix, test, and safely ship.
          </p>
          <div className="signal-list" aria-label="Status legend">
            <div className="pill">
              <span className="dot removed" aria-hidden="true"></span>Removed /
              vulnerable line
            </div>
            <div className="pill">
              <span className="dot proposed" aria-hidden="true"></span>Proposed /
              waiting for decision
            </div>
            <div className="pill">
              <span className="dot accepted" aria-hidden="true"></span>Fixed /
              accepted line
            </div>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="#install">Install SecurePush</a>
            <a className="button" href="securepush-history.html"
              >Open history / insights</a
            >
          </div>
          <div className="install-terminal" id="install">
            <div className="install-terminal-row">
              <span className="install-prompt" aria-hidden="true">$</span>
              <code className="install-command-text">npx securepush init</code>
              <button
                className="copy-button"
                type="button"
                aria-label="Copy install command"
                data-copy-command="npx securepush init"
              >
                ⧉
              </button>
            </div>
            <span className="copy-feedback" aria-live="polite">Copy command</span>
            <details className="install-guide">
              <summary>Install guide</summary>
              <p>
                Works the same whether you run hosted, BYO-key, or fully local.
                After <code>init</code>, run <code>securepush config</code> to
                choose Groq, Gemini, Claude, or Ollama — no separate install
                needed either way.
              </p>
            </details>
          </div>
          <p className="hero-note">
            Demo repo context is illustrative, not live scraped data. BYO key or
            local mode can run without login, and the dashboard reads the same
            repo memory later through the shared bank ID.
          </p>
          <div className="recent-activity" aria-live="polite">
            <strong>Recent Activity</strong>
            <p data-recent-activity>
              Awaiting demo action. Accept a fix to see the repo memory update
              here before you open the full history view.
            </p>
          </div>
        </div>

        <div className="product-frame">
          <div className="frame-shell">
            <div className="frame-topbar">
              <div className="frame-actions" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-pill">securepush://demo/review</div>
              <div className="frame-pill">browser preview</div>
            </div>
            <div
              className="terminal hero-anim"
              aria-label="Animated SecurePush diff"
              data-mode="idle"
            >
              <div className="terminal-bar">
                <div className="traffic" aria-hidden="true">
                  <span></span><span></span><span></span>
                </div>
                <div>pre-push / review.diff</div>
              </div>
              <div className="terminal-body">
                <div className="demo-context" aria-label="Demo repository context">
                  <div className="context-card">
                    <span>Demo repo</span>
                    <strong>securepush-demo</strong>
                  </div>
                  <div className="context-card">
                    <span>Branch</span>
                    <strong>feat/pre-push-hook</strong>
                  </div>
                  <div className="context-card">
                    <span>Changed files</span>
                    <strong>3 files in this push</strong>
                  </div>
                </div>

                <div className="sequence-panel">
                  <div className="sequence-log" aria-label="Push sequence log">
                    <div className="sequence-line" data-seq="push">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="scan">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="progress">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="found">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="apply">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="tests">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                    <div className="sequence-line" data-seq="done">
                      <span className="prompt">&gt;</span
                      ><span className="typing-target"></span>
                    </div>
                  </div>
                </div>

                <div className="terminal-line">
                  <span className="line-label">repo</span>
                  <span>apps/web/lib/auth.ts</span>
                </div>
                <div className="terminal-line">
                  <span className="line-label">finding</span>
                  <span
                    ><span className="status-tag" style={{"color":"var(--removed)"}}
                      >Removed</span
                    >
                    hardcoded secret in changed diff</span
                  >
                </div>

                <div className="diff-stack">
                  <div className="code-line removed">
                    <span className="line-label">- 18</span>
                    <span className="content"
                      ><span className="tok-keyword">const</span>
                      <span className="tok-var">STRIPE_SECRET_KEY</span>
                      <span className="tok-punc">=</span>
                      <span className="tok-string"
                        >"sk_live_51QjP9YwZ..."</span
                      ></span
                    >
                    <div className="diff-tooltip" role="tooltip">
                      <strong>Risk</strong>
                      <span
                        >Hardcoded Stripe secret would ship in a changed
                        file.</span
                      >
                      <strong>Suggested fix</strong>
                      <span
                        >Swap the literal key for
                        <code>process.env.STRIPE_SECRET_KEY</code>.</span
                      >
                    </div>
                  </div>
                  <div className="code-line proposed">
                    <span className="line-label">? fix</span>
                    <span className="content"
                      ><span className="tok-keyword">const</span>
                      <span className="tok-var">STRIPE_SECRET_KEY</span>
                      <span className="tok-punc">=</span>
                      <span className="tok-type">process</span
                      ><span className="tok-punc">.</span
                      ><span className="tok-type">env</span
                      ><span className="tok-punc">.</span
                      ><span className="tok-var">STRIPE_SECRET_KEY</span></span
                    >
                  </div>
                </div>

                <div
                  className="terminal-controls"
                  aria-label="Proposed fix controls"
                >
                  <button
                    className="terminal-button accept"
                    type="button"
                    data-diff-action="accept"
                  >
                    <span className="button-default">Accept fix</span>
                    <span className="button-confirmed">✓ Accepted</span>
                  </button>
                  <button
                    className="terminal-button reject"
                    type="button"
                    data-diff-action="reject"
                  >
                    Reject fix
                  </button>
                  <button
                    className="terminal-button replay"
                    type="button"
                    data-diff-action="replay"
                    hidden
                  >
                    Replay demo
                  </button>
                </div>

                <div className="code-line accepted">
                  <span className="line-label">+ 18</span>
                  <span className="content"
                    ><span className="tok-keyword">const</span>
                    <span className="tok-var">STRIPE_SECRET_KEY</span>
                    <span className="tok-punc">=</span>
                    <span className="tok-type">process</span
                    ><span className="tok-punc">.</span
                    ><span className="tok-type">env</span
                    ><span className="tok-punc">.</span
                    ><span className="tok-var">STRIPE_SECRET_KEY</span></span
                  >
                </div>

                <div className="status-stack">
                  <div className="terminal-status success" aria-live="polite">
                    <div className="status-row">
                      <span className="status-tag">Fixed</span>
                      <span>accept fix → tests passed → pushed</span>
                    </div>
                    <div className="status-output">
                      <span>PASS auth.test.ts</span>
                      <span>PASS api.test.ts</span>
                      <span>27 passed</span>
                    </div>
                  </div>
                  <div className="terminal-status warning" aria-live="polite">
                    <div className="status-row">
                      <span className="status-tag">Warning</span>
                      <span>reject fix → warning logged → push continues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
