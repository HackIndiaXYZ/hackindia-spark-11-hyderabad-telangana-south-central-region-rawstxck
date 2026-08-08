import * as p from "@clack/prompts";
import chalk from "chalk";
import simpleGit from "simple-git";
import path from "path";
import open from "open";
import { loadConfig, writeConfig } from "../config/schema";

export async function runLoginFlow(repoRoot: string, requiresWallet = false): Promise<{ github_username: string | null; wallet_connected: boolean }> {
  console.log(chalk.gray("Opening browser to authenticate with SecurePush Cloud..."));
  // 1. Create a pending session
  const baseUrl = process.env.SECUREPUSH_API_URL || "http://localhost:3000";
  const createRes = await fetch(`${baseUrl}/api/cli-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_label: require("os").hostname() || "SecurePush CLI" })
  });

  if (!createRes.ok) {
    p.cancel(chalk.red("Failed to initialize login session. Please check your network connection."));
    process.exit(1);
  }

  const createData = await createRes.json() as { id: string };
  const sessionId = createData.id;
  const authUrl = `${baseUrl}/login?session=${sessionId}${requiresWallet ? '&requires_wallet=true' : ''}`;

  console.log(chalk.cyan(`\nOpening your browser to complete authentication:\n${authUrl}\n`));
  await open(authUrl);

  const spinner = p.spinner();
  spinner.start("Waiting for browser authentication...");

  let github_username = null;
  let wallet_connected = false;
  // Poll until the session is linked or expired (10 mins max, we'll poll 300 times, every 2s)
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    
    const pollRes = await fetch(`${baseUrl}/api/cli-session/${sessionId}`);
    if (pollRes.ok) {
      const data = await pollRes.json() as { status: string, github_username?: string, wallet_connected?: boolean };
      if (data.status === "linked" && data.github_username) {
        if (requiresWallet && !data.wallet_connected) {
          if (i % 5 === 0) console.log(chalk.gray("  Waiting for wallet connection..."));
          continue; // keep polling until wallet is linked
        }
        github_username = data.github_username;
        wallet_connected = !!data.wallet_connected;
        break;
      }
    }
  }

  spinner.stop();

  if (!github_username) {
    return { github_username: null, wallet_connected: false };
  }

  const session = { github_username };
  console.log(chalk.green(`✓ Linked as ${session.github_username}${requiresWallet && wallet_connected ? " with wallet connected" : ""}.`));

  try {
    const config = loadConfig(repoRoot);
    const repoName = path.basename(repoRoot);
    config.bank_id = `securepush-${session.github_username}-${repoName}`;
    writeConfig(repoRoot, config);
    console.log(chalk.gray(`  bank_id updated: ${config.bank_id}`));
  } catch (e) {
    console.log(chalk.yellow("  (Not currently in an initialized SecurePush repo — run `securepush init` inside a repo to complete setup.)"));
  }

  return { github_username, wallet_connected };
}

export async function login() {
  p.intro(chalk.bold("SecurePush Login"));
  
  try {
    const repoRoot = (await simpleGit().revparse(["--show-toplevel"])).trim();
    const result = await runLoginFlow(repoRoot);
    if (!result.github_username) {
      p.cancel(chalk.red("Login timed out or failed. Please try again."));
      process.exit(1);
    }
  } catch (e) {
    p.cancel(chalk.red("Must be run inside a git repository."));
    process.exit(1);
  }

  p.outro("Login complete.");
}
