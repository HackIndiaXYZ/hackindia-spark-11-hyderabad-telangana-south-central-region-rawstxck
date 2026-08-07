import chalk from "chalk";
import { FileDiff } from "../core/diff";
import { Finding } from "../core/scan";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "./shared";
import { reviewWithOllama } from "./ollama";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

export async function reviewWithGroq(files: FileDiff[], pastPatterns: string[] = []): Promise<Finding[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log(chalk.red("GROQ_API_KEY not set. Scan could not complete — push blocked."));
    process.exit(1);
  }

  const hardFailure = await callGroq(apiKey, files, pastPatterns).catch(() => null);

  if (hardFailure !== null) {
    return hardFailure;
  }

  // Provider failure fallback (App Flow edge case table): the Groq request itself
  // failed (network error, non-2xx, timeout) — retry once against local Ollama
  // before failing closed. This is different from a malformed-JSON response,
  // which still means the provider answered and degrades to zero findings —
  // a provider that didn't answer at all must not be treated the same as
  // "nothing found."
  console.log(chalk.yellow("Groq request failed — retrying against local Ollama fallback..."));
  const fallback = await reviewWithOllama(files, pastPatterns);

  if (fallback !== null) {
    return fallback;
  }

  console.log(
    chalk.red.bold(
      "Scan could not complete — provider unreachable (Groq and Ollama fallback both failed). Push blocked."
    )
  );
  process.exit(1);
}

import { cascadedReview } from "./cascadeflow-wrapper";

/**
 * Returns null on a hard failure (network error, non-2xx, timeout) so the caller
 * can trigger the Ollama fallback. A malformed JSON response is NOT a hard
 * failure — the provider answered, so it degrades to zero findings instead.
 */
async function callGroq(apiKey: string, files: FileDiff[], pastPatterns: string[] = []): Promise<Finding[] | null> {
  const promptText = `${buildSystemPrompt(pastPatterns)}\n\n${buildDiffPrompt(files)}`;
  
  const content = await cascadedReview(promptText);

  if (content === null) {
    return null; // network-level failure — trigger fallback
  }

  const { findings, parseFailed } = parseFindingsResponse(content);
  if (parseFailed) {
    console.log(chalk.yellow("  (Groq response could not be parsed as JSON — treating as zero findings.)"));
  }
  return findings; // provider DID answer — never null past this point
}
