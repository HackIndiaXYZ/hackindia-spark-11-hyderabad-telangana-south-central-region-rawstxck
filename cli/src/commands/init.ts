import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";
import simpleGit from "simple-git";
import * as p from "@clack/prompts";
import { Provider, SecurePushConfig, DEFAULT_CONFIG, writeConfig } from "../config/schema";
import { buildIndex, saveIndex } from "../core/referenceIndex";
import { getDiffSinceLastPush } from "../core/diff";

// IMPORTANT: the hook cannot use a relative path assuming co-location with
// .git/hooks/ — that directory lives inside the TARGET repo being protected,
// not inside this CLI's own install location. This was a real bug found by
// testing; must use an absolute path to wherever this CLI is actually running from.
//
// DECIDED: run via `tsx` directly against the .ts source rather than adding a
// `tsc` build step. tsx avoids an extra build phase entirely, which matters
// more than build-output cleanliness given the hackathon timeline.
const CLI_ENTRY = path.resolve(__dirname, "..", "index.ts");

function buildHookContent(): string {
  return `#!/bin/bash\nnpx tsx "${CLI_ENTRY}" verify "$@" || exit 1\n`;
}

async function detectTestCommand(repoRoot: string): Promise<string | null> {
  try {
    const pkgRaw = await fs.readFile(path.join(repoRoot, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw);
    if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
      return "npm test --silent";
    }
  } catch {
    // no package.json, or unreadable — fall through
  }
  return null;
}

export async function init() {
  const git = simpleGit();
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    console.log(chalk.red("Not a git repository. Run this inside a git repo."));
    process.exit(1);
  }

  const repoRoot = (await git.revparse(["--show-toplevel"])).trim();
  const repoName = path.basename(repoRoot);

  p.intro(chalk.bold("SecurePush init"));

  const provider = (await p.select({
    message: "Choose provider",
    options: [
      { value: "openrouter", label: "OpenRouter (Nemotron-3-ultra, free via openrouter.ai)" },
      { value: "groq", label: "Groq (fast, free tier)" },
      { value: "gemini", label: "Gemini (fast, free tier)" },
      { value: "ollama", label: "Ollama (local, fully private, no login)" },
      { value: "cloud", label: "SecurePush Cloud (hosted, requires login)" },
    ],
  })) as Provider;

  if (p.isCancel(provider)) {
    p.cancel("Setup cancelled.");
    process.exit(1);
  }

  let bankIdOwner = "local";
  if (provider === "cloud") {
    // Real build: trigger `securepush login` flow here (Prompt 14) or check for
    // an existing linked session before proceeding. Stubbed for now — CLI-first
    // build order means Cloud mode isn't wired end-to-end yet.
    console.log(chalk.yellow("  SecurePush Cloud requires login — run `securepush login` first if you haven't."));
  }

  // Test command — never silently skip the test-gate. Auto-detect from
  // package.json; if that fails, require the user to type one.
  let testCommand = await detectTestCommand(repoRoot);
  if (!testCommand) {
    const manual = await p.text({
      message: "No test script detected in package.json. What command runs your tests?",
      placeholder: "npm test",
    });
    if (p.isCancel(manual)) {
      p.cancel("A test command is required — SecurePush cannot guarantee its safety gate without one.");
      process.exit(1);
    }
    testCommand = manual;
  }

  const bankId = `securepush-${bankIdOwner}-${repoName}`;

  const config: SecurePushConfig = {
    provider,
    bank_id: bankId,
    test_command: testCommand,
    thresholds: DEFAULT_CONFIG.thresholds,
  };
  writeConfig(repoRoot, config);
  console.log(chalk.green(`✓ Wrote .securepush.yml (provider: ${provider}, bank_id: ${bankId})`));

  const hookPath = path.join(repoRoot, ".git/hooks/pre-push");
  await fs.writeFile(hookPath, buildHookContent());
  await fs.chmod(hookPath, 0o755);
  console.log(chalk.green("✓ Installed pre-push hook."));
  console.log(chalk.gray(`  Pointing at: ${CLI_ENTRY}`));

  // Baseline scan: without this, a repo with months of existing history never
  // gets its existing code checked — only future changes. Build the reference
  // index across the whole repo now; the actual vulnerability review of every
  // existing file (not just the index) is left as a documented follow-up if
  // time allows — the index alone is what makes diff-only scanning smarter
  // afterward, and is the higher-value half of the baseline scan for hackathon scope.
  const spinner = p.spinner();
  spinner.start("Building reference index (this may take a moment)...");
  try {
    const index = await buildIndex(repoRoot);
    await saveIndex(repoRoot, index);
    const fileCount = Object.keys(index.referencedBy).length;
    spinner.stop(`✓ Reference index built (${fileCount} file(s) with known references).`);
  } catch (err) {
    spinner.stop("✗ Reference index build failed — continuing without it.");
    console.log(chalk.gray(String(err)));
  }

  p.outro(chalk.green("SecurePush is watching this repo. Next `git push` will be scanned."));
}
