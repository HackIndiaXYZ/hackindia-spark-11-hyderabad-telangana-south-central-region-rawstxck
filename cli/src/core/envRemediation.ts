import * as fs from "fs/promises";
import * as path from "path";

/**
 * Safely creates or updates the .env file with the extracted secret.
 * Replaces the value if the key already exists, otherwise appends.
 */
export async function writeSecretToEnv(repoRoot: string, varName: string, secretValue: string) {
  const envPath = path.join(repoRoot, ".env");
  let content = "";
  try {
    content = await fs.readFile(envPath, "utf-8");
  } catch (e) {
    // File likely doesn't exist, which is fine.
  }

  const lines = content.split("\n");
  let updated = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${varName}=`)) {
      lines[i] = `${varName}=${secretValue}`;
      updated = true;
      break;
    }
  }

  if (!updated) {
    if (content.length > 0 && !content.endsWith("\n")) {
      lines.push(`${varName}=${secretValue}`);
    } else {
      if (lines.length > 0 && lines[lines.length - 1] === "") {
        lines[lines.length - 1] = `${varName}=${secretValue}`;
      } else {
        lines.push(`${varName}=${secretValue}`);
      }
    }
  }

  await fs.writeFile(envPath, lines.join("\n"), "utf-8");
}

/**
 * Ensures .env is present in .gitignore so the extracted secret isn't accidentally committed.
 */
export async function ensureEnvIgnored(repoRoot: string) {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  let content = "";
  try {
    content = await fs.readFile(gitignorePath, "utf-8");
  } catch (e) {
    // File doesn't exist
  }

  const lines = content.split("\n").map((l) => l.trim());
  if (!lines.includes(".env") && !lines.includes("*.env") && !lines.includes("/.env")) {
    const appendStr = content.length > 0 && !content.endsWith("\n") ? "\n.env\n" : ".env\n";
    await fs.appendFile(gitignorePath, appendStr, "utf-8");
  }
}
