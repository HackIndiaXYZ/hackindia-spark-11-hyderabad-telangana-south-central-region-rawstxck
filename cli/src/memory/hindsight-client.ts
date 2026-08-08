import { HindsightClient } from "@vectorize-io/hindsight-client";

const client = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_HOST || "http://localhost:8888",
});

export interface RecallContext {
  pastPatterns: string[];
}

export async function recall(bankId: string): Promise<RecallContext> {
  try {
    const response = await client.recall(bankId, "recurring security findings and fix patterns");
    return { pastPatterns: response.results.map((r: any) => r.text) };
  } catch (err) {
    return { pastPatterns: [] };
  }
}

export interface RetainEvent {
  bankId: string;
  file: string;
  issue: string;
  severity: string;
  action: "fixed" | "rejected" | "blocked";
  timestamp: string;
}

export async function retain(event: RetainEvent): Promise<void> {
  try {
    await client.retain(
      event.bankId,
      `${event.action}: ${event.issue} (${event.severity}) in ${event.file}`,
      {
        timestamp: new Date(event.timestamp),
        metadata: { file: event.file, issue: event.issue, severity: event.severity, action: event.action },
      }
    );
  } catch {
    // Fail silently
  }
}
