import * as fs from "fs/promises";
import * as path from "path";
import simpleGit from "simple-git";
import { applyAcceptedFixes } from "./src/core/apply";
import { Decision } from "./src/core/review";

async function runTest() {
  const repoRoot = path.join(process.cwd(), "scratch-repo-test");
  
  // Cleanup old test
  await fs.rm(repoRoot, { recursive: true, force: true });
  await fs.mkdir(repoRoot, { recursive: true });

  const git = simpleGit(repoRoot);
  await git.init();
  await git.raw(["checkout", "-b", "main"]);

  // Initial commit
  await fs.writeFile(path.join(repoRoot, "README.md"), "# Hello\n", "utf-8");
  await git.add(".");
  await git.commit("Initial commit");

  // Add a secret and commit it
  const secretContent = 'const apiKey = "sk-live-1234567890";\nconsole.log(apiKey);\n';
  const configPath = path.join(repoRoot, "config.js");
  await fs.writeFile(configPath, secretContent, "utf-8");
  await git.add(".");
  await git.commit("Add config with secret");

  const countBefore = await git.raw(["rev-list", "--count", "HEAD"]);

  // Create a mock decision simulating AI fix
  const decisions: Decision[] = [
    {
      accepted: true,
      finding: {
        file: "config.js",
        line: 1, // 1-indexed
        issue: "hardcoded_secret",
        severity: "critical",
        originalLine: 'const apiKey = "sk-live-1234567890";',
        proposedFix: 'const apiKey = process.env.API_KEY;',
        extractedSecret: "sk-live-1234567890",
        envVarName: "API_KEY"
      }
    }
  ];

  // Run the apply fixes step
  const modifiedFiles = await applyAcceptedFixes(decisions, repoRoot, 30);
  
  // Replicate verify.ts commit logic
  await git.add(".");
  await git.raw(["commit", "--amend", "--no-edit"]);

  const countAfter = await git.raw(["rev-list", "--count", "HEAD"]);
  
  // Assertions
  const status = await git.status();
  const showHead = await git.show(["HEAD"]);

  console.log("\n--- TEST RESULTS ---");
  
  // (a) .env is never in git status's staged files
  const envStaged = status.staged.includes(".env");
  console.log(`(a) .env is staged? ${envStaged} (Expected: false)`);

  // (b) git show HEAD does not contain raw secret value
  const containsSecret = showHead.includes("sk-live-1234567890");
  console.log(`(b) HEAD contains secret? ${containsSecret} (Expected: false)`);

  // (c) total commit count stayed the same
  const countSame = parseInt(countBefore.trim()) === parseInt(countAfter.trim());
  console.log(`(c) Commit count stayed same? ${countSame} (${countBefore.trim()} -> ${countAfter.trim()})`);

  if (!envStaged && !containsSecret && countSame) {
    console.log("\n✅ ALL ASSERTIONS PASSED.");
    process.exit(0);
  } else {
    console.log("\n❌ TEST FAILED.");
    if (containsSecret) {
      console.log("\n--- GIT SHOW HEAD ---");
      console.log(showHead);
    }
    process.exit(1);
  }
}

runTest().catch(console.error);
