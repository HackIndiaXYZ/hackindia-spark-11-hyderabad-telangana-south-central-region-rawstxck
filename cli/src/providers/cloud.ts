import chalk from "chalk";
import open from "open";
import { FileDiff } from "../core/diff";
import { Finding } from "../core/scan";

const DASHBOARD_URL = process.env.SECUREPUSH_DASHBOARD_URL || "http://localhost:3000";

export async function reviewWithCloud(files: FileDiff[], bankId: string, pastPatterns: string[] = []): Promise<Finding[] | null> {
  // 1. Create a payment session for this push
  const createRes = await fetch(`${DASHBOARD_URL}/api/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bank_id: bankId }),
  });
  
  if (!createRes.ok) {
    const errText = await createRes.text();
    console.log(chalk.red(`Could not start a payment session: ${errText}`));
    return null;
  }
  
  const session = (await createRes.json()) as { id: string; amount_algo: string };

  // 2. Open the payment approval page
  const payUrl = `${DASHBOARD_URL}/pay?session=${session.id}`;
  console.log(chalk.yellow(`\nPayment required: ${session.amount_algo} ALGO (TestNet) for this scan.`));
  console.log(chalk.gray(`Opening ${payUrl} — approve in Pera Wallet to continue.`));
  await open(payUrl);

  // 3. Poll for confirmation
  const deadline = Date.now() + 5 * 60 * 1000; // 5 mins
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    
    const poll = await fetch(`${DASHBOARD_URL}/api/payment/${session.id}`);
    if (!poll.ok) continue;
    
    const status = (await poll.json()) as { status: string };
    if (status.status === "confirmed") break;
    if (status.status === "failed" || status.status === "expired") {
      console.log(chalk.red(`Payment ${status.status} — push blocked.`));
      return null;
    }
  }

  // 4. Payment confirmed — request the actual scan
  console.log(chalk.green(`Payment confirmed. Requesting cloud scan...`));
  const scanRes = await fetch(`${DASHBOARD_URL}/api/paid-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_session_id: session.id, files, pastPatterns }),
  });
  
  if (!scanRes.ok) {
    console.log(chalk.red("Paid scan request failed — push blocked."));
    return null;
  }
  
  const { findings } = (await scanRes.json()) as { findings: Finding[] };
  return findings;
}
