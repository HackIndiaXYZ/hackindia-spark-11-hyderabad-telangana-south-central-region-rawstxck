import chalk from "chalk";
import { FileDiff } from "../core/diff";
import { Finding } from "../core/scan";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "./shared";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

/**
 * Returns null (not []) on hard failure — this is the signal the caller uses
 * to distinguish "provider answered with nothing" from "provider didn't answer
 * at all," which must fail closed rather than be treated as a clean scan.
 */
export async function reviewWithOllama(files: FileDiff[], pastPatterns: string[] = []): Promise<Finding[] | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: buildSystemPrompt(pastPatterns) },
          { role: "user", content: buildDiffPrompt(files) },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content ?? "";

    const { findings, parseFailed } = parseFindingsResponse(content);
    if (parseFailed) {
      console.log(chalk.yellow("  (Ollama response could not be parsed as JSON — treating as zero findings.)"));
    }
    return findings;
  } catch {
    return null;
  }
}
