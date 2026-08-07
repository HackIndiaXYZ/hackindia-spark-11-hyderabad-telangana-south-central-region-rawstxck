export function passesShrinkGuard(
  originalContent: string,
  newContent: string,
  maxShrinkPct: number = 30,
): { ok: boolean; reason?: string } {
  const originalLen = originalContent.length;
  const newLen = newContent.length;
  if (originalLen === 0) return { ok: true };
  const shrinkPct = ((originalLen - newLen) / originalLen) * 100;
  if (shrinkPct > maxShrinkPct) {
    return {
      ok: false,
      reason: `Fix would shrink the file by ${shrinkPct.toFixed(1)}% (max allowed: ${maxShrinkPct}%) — flagging for manual review instead of applying.`,
    };
  }
  return { ok: true };
}
