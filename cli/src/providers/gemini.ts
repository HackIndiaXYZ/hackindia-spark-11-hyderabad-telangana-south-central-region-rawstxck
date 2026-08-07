import chalk from "chalk";
import { FileDiff } from "../core/diff";
import { Finding } from "../core/scan";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "./shared";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function reviewWithGemini(files: FileDiff[], pastPatterns: string[] = []): Promise<Finding[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log(chalk.red("GEMINI_API_KEY not set. Scan could not complete — push blocked."));
    process.exit(1);
  }

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: buildSystemPrompt(pastPatterns) }
        },
        contents: [{
          parts: [{ text: buildDiffPrompt(files) }]
        }],
        generationConfig: {
          temperature: 0,
        }
      }),
    });
  } catch {
    return null; // network-level failure
  }

  if (!res.ok) {
    return null; // non-2xx failure
  }

  const data = await res.json() as any;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const { findings, parseFailed } = parseFindingsResponse(content);
  if (parseFailed) {
    console.log(chalk.yellow("  (Gemini response could not be parsed as JSON — treating as zero findings.)"));
  }
  return findings;
}
