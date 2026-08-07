import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface TestResult {
  passed: boolean;
  output: string;
}

export async function runTests(command: string, cwd: string): Promise<TestResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { passed: true, output: stdout + stderr };
  } catch (err: any) {
    return { passed: false, output: (err.stdout ?? "") + (err.stderr ?? "") || String(err) };
  }
}
