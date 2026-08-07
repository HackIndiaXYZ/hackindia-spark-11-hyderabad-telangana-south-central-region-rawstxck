import * as fs from "fs/promises";
import * as path from "path";

export interface ReferenceIndex {
  // file path -> list of files that import/require it
  referencedBy: Record<string, string[]>;
}

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".securepush"]);

// Matches: import ... from "x", import "x", require("x")
const IMPORT_RE = /(?:import\s+(?:[^'"]+\s+from\s+)?|require\()\s*['"]([^'"]+)['"]/g;

async function walkFiles(dir: string, repoRoot: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, repoRoot, out);
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.relative(repoRoot, fullPath));
    }
  }
  return out;
}

function resolveImportTarget(fromFile: string, importPath: string, allFiles: Set<string>): string | null {
  // Only resolve relative imports statically — package imports (no "./" or "../")
  // aren't part of this repo's own reference graph.
  if (!importPath.startsWith(".")) return null;

  const baseDir = path.dirname(fromFile);
  const resolved = path.normalize(path.join(baseDir, importPath));

  const candidates = [
    resolved,
    ...[...CODE_EXTENSIONS].map((ext) => resolved + ext),
    ...[...CODE_EXTENSIONS].map((ext) => path.join(resolved, "index" + ext)),
  ];

  for (const candidate of candidates) {
    if (allFiles.has(candidate)) return candidate;
  }
  return null;
}

export async function buildIndex(repoRoot: string): Promise<ReferenceIndex> {
  const files = await walkFiles(repoRoot, repoRoot);
  const fileSet = new Set(files);
  const referencedBy: Record<string, string[]> = {};

  for (const file of files) {
    const content = await fs.readFile(path.join(repoRoot, file), "utf-8");
    const matches = content.matchAll(IMPORT_RE);
    for (const match of matches) {
      const target = resolveImportTarget(file, match[1], fileSet);
      if (!target) continue;
      if (!referencedBy[target]) referencedBy[target] = [];
      if (!referencedBy[target].includes(file)) referencedBy[target].push(file);
    }
  }

  return { referencedBy };
}

export function lookupReferences(index: ReferenceIndex, file: string): string[] {
  return index.referencedBy[file] ?? [];
}

export async function updateIndex(
  index: ReferenceIndex,
  changedFiles: string[],
  repoRoot: string
): Promise<ReferenceIndex> {
  // Minimum viable version: re-parse only the changed files' own import
  // statements, not a full repo rebuild. This doesn't remove stale entries left
  // behind if a changed file used to import something it no longer does —
  // acceptable for the hackathon scope, noted as a known simplification.
  const allFiles = await walkFiles(repoRoot, repoRoot);
  const fileSet = new Set(allFiles);
  const referencedBy: Record<string, string[]> = { ...index.referencedBy };

  for (const file of changedFiles) {
    let content: string;
    try {
      content = await fs.readFile(path.join(repoRoot, file), "utf-8");
    } catch {
      continue; // file was deleted
    }
    const matches = content.matchAll(IMPORT_RE);
    for (const match of matches) {
      const target = resolveImportTarget(file, match[1], fileSet);
      if (!target) continue;
      if (!referencedBy[target]) referencedBy[target] = [];
      if (!referencedBy[target].includes(file)) referencedBy[target].push(file);
    }
  }

  return { referencedBy };
}

const INDEX_PATH = ".securepush/reference-index.json";

export async function saveIndex(repoRoot: string, index: ReferenceIndex): Promise<void> {
  const dir = path.join(repoRoot, ".securepush");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(repoRoot, INDEX_PATH), JSON.stringify(index, null, 2), "utf-8");
}

export async function loadIndex(repoRoot: string): Promise<ReferenceIndex> {
  try {
    const raw = await fs.readFile(path.join(repoRoot, INDEX_PATH), "utf-8");
    return JSON.parse(raw) as ReferenceIndex;
  } catch {
    return { referencedBy: {} };
  }
}
