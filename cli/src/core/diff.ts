import { SimpleGit } from "simple-git";

export interface FileDiff {
  file: string;
  addedLines: { lineNumber: number; content: string }[];
}

/**
 * Diffs against @{u} (the last-pushed commit on the upstream branch), NOT local
 * commits — this is a deliberate decision documented in the TRD: a local commit
 * may already have been reviewed in an earlier SecurePush pass, so re-diffing
 * against it would rescan (and re-charge API calls for) unchanged content.
 * Do not change this to diff against HEAD~1 or similar without revisiting that decision.
 */
export async function getDiffSinceLastPush(git: SimpleGit): Promise<FileDiff[] | null> {
  let diffText: string;
  try {
    diffText = await git.diff(["@{u}..HEAD"]);
  } catch {
    // No upstream configured yet (e.g. first push ever on a new branch) — fall back
    // to staged changes, then to the full working diff against HEAD.
    diffText = await git.diff(["--cached"]);
    if (!diffText) diffText = await git.diff(["HEAD"]);
  }

  if (!diffText.trim()) return null;

  const files: FileDiff[] = [];
  let currentFile: FileDiff | null = null;
  let newLineNum = 0;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = { file: line.replace("+++ b/", ""), addedLines: [] };
      files.push(currentFile);
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunkMatch) {
      newLineNum = parseInt(hunkMatch[1], 10);
      continue;
    }
    if (!currentFile) continue;

    if (line.startsWith("+") && !line.startsWith("+++")) {
      currentFile.addedLines.push({ lineNumber: newLineNum, content: line.slice(1) });
      newLineNum++;
    } else if (!line.startsWith("-")) {
      newLineNum++;
    }
  }

  return files.filter((f) => f.addedLines.length > 0);
}
