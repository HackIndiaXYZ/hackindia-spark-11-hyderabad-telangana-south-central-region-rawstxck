import { CascadeAgent } from "@cascadeflow/core";
import chalk from "chalk";

const groqCascade = new CascadeAgent({
  models: [
    { name: "llama-3.1-8b-instant", provider: "groq", cost: 0.0002 },    // fast tier
    { name: "llama-3.3-70b-versatile", provider: "groq", cost: 0.0015 }, // escalation tier
  ],
  quality: {
    threshold: 0.7, // matches config.thresholds.cascadeflow_confidence
  },
});

export async function cascadedReview(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error(chalk.red("GROQ_API_KEY is not set. CascadeFlow cannot run."));
    return null;
  }

  process.env.GROQ_API_KEY = apiKey; // Ensure it's available in standard env if CascadeFlow looks there

  try {
    const result = await groqCascade.run(prompt);
    
    // Print the model used for visibility in the demo
    console.log(chalk.gray(`  (Scanned with ${result.modelUsed})`));
    
    return result.content;
  } catch (err: any) {
    console.error(chalk.red(`CascadeFlow error: ${err.message}`));
    return null;
  }
}
