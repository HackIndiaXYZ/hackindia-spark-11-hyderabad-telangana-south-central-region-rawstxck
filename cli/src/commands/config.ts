import * as p from "@clack/prompts";
import chalk from "chalk";
import simpleGit from "simple-git";
import { loadConfig, writeConfig, Provider } from "../config/schema";

export async function config() {
  const repoRoot = (await simpleGit().revparse(["--show-toplevel"])).trim();
  const current = loadConfig(repoRoot); // throws a clear error if init hasn't been run

  p.intro(chalk.bold("SecurePush config"));
  console.log(chalk.gray(`Current: provider=${current.provider}, test_command="${current.test_command}"`));

  const field = await p.select({
    message: "What do you want to change?",
    options: [
      { value: "provider", label: "Provider" },
      { value: "test_command", label: "Test command" },
      { value: "thresholds", label: "Thresholds (shrink guard / confidence)" },
      { value: "cancel", label: "Cancel" },
    ],
  });
  
  if (p.isCancel(field) || field === "cancel") { 
    p.cancel("No changes made."); 
    return; 
  }

  if (field === "provider") {
    const provider = (await p.select({
      message: "New provider",
      options: [
        { value: "openrouter", label: "OpenRouter" },
        { value: "groq", label: "Groq" }, 
        { value: "gemini", label: "Gemini" },
        { value: "ollama", label: "Ollama (local)" }, 
        { value: "cloud", label: "SecurePush Cloud (pay-per-push)" },
      ],
    })) as Provider;
    if (!p.isCancel(provider)) current.provider = provider;
  } else if (field === "test_command") {
    const cmd = await p.text({ message: "New test command", initialValue: current.test_command });
    if (!p.isCancel(cmd)) current.test_command = cmd;
  } else if (field === "thresholds") {
    const shrink = await p.text({
      message: "Max file shrink % before the safety valve blocks a fix",
      initialValue: String(current.thresholds.file_shrink_max_pct),
    });
    if (!p.isCancel(shrink)) current.thresholds.file_shrink_max_pct = Number(shrink);
  }

  writeConfig(repoRoot, current);
  p.outro(chalk.green("✓ .securepush.yml updated."));
}
