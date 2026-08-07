import chalk from "chalk";
import { FileDiff } from "../core/diff";
import { Finding } from "../core/scan";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "./shared";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

export async function reviewWithOpenRouter(files: FileDiff[], pastPatterns: string[] = []): Promise<Finding[] | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.log(chalk.red("OPENROUTER_API_KEY not set. Scan could not complete — push blocked."));
    process.exit(1);
  }

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [
          { role: "system", content: buildSystemPrompt(pastPatterns) },
          { role: "user", content: buildDiffPrompt(files) },
        ],
      }),
    });
  } catch {
    return null; // network-level failure
  }

  if (!res.ok) {
    return null; // non-2xx failure
  }

  const data = await res.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "";

  const { findings, parseFailed } = parseFindingsResponse(content);
  if (parseFailed) {
    console.log(chalk.yellow("  (OpenRouter response could not be parsed as JSON — treating as zero findings.)"));
  }
  return findings;
}
