export type Provider = "groq" | "gemini" | "ollama" | "openrouter" | "cloud";

export interface SecurePushConfig {
  provider: Provider;
  bank_id: string;
  test_command: string;
  thresholds: {
    file_shrink_max_pct: number;
    cascadeflow_confidence: number;
  };
}

export const DEFAULT_CONFIG: Omit<SecurePushConfig, "bank_id" | "test_command"> = {
  provider: "openrouter",
  thresholds: {
    file_shrink_max_pct: 30,
    cascadeflow_confidence: 0.7,
  },
};

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const CONFIG_FILENAME = ".securepush.yml";

export function loadConfig(repoRoot: string): SecurePushConfig {
  const configPath = path.join(repoRoot, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `${CONFIG_FILENAME} not found. Run "securepush init" in this repo first.`
    );
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = yaml.load(raw) as Partial<SecurePushConfig>;

  return {
    provider: parsed.provider ?? DEFAULT_CONFIG.provider,
    bank_id: parsed.bank_id ?? "",
    test_command: parsed.test_command ?? "npm test --silent",
    thresholds: {
      file_shrink_max_pct:
        parsed.thresholds?.file_shrink_max_pct ?? DEFAULT_CONFIG.thresholds.file_shrink_max_pct,
      cascadeflow_confidence:
        parsed.thresholds?.cascadeflow_confidence ?? DEFAULT_CONFIG.thresholds.cascadeflow_confidence,
    },
  };
}

export function writeConfig(repoRoot: string, config: SecurePushConfig): void {
  const configPath = path.join(repoRoot, CONFIG_FILENAME);
  fs.writeFileSync(configPath, yaml.dump(config), "utf-8");
}
