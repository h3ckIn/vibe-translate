import type { GlossaryEntry, TMEntry, Lang } from './types';

// Lightweight similarity (trigram Jaccard). For a real TM use vector + sqlite,
// but this works well for short strings and is dependency-free.
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const t = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  a = t(a);
  b = t(b);
  if (a === b) return 1;
  const grams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) out.add(s.slice(i, i + 3));
    return out;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  A.forEach((g) => {
    if (B.has(g)) inter++;
  });
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function lookupTM(
  source: string,
  target: string,
  tm: TMEntry[],
  threshold = 0.62
): TMEntry | null {
  let best: TMEntry | null = null;
  let bestScore = 0;
  for (const e of tm) {
    if (e.sourceLang !== source || e.targetLang !== target) continue;
    const s = similarity(source, e.source);
    if (s > bestScore) {
      bestScore = s;
      best = e;
    }
  }
  return bestScore >= threshold ? best : null;
}

export function applyGlossary(text: string, glossary: GlossaryEntry[]): string {
  let out = text;
  for (const g of glossary) {
    if (!g.locked) continue;
    if (!g.source) continue;
    const re = new RegExp(escapeReg(g.source), 'gi');
    out = out.replace(re, g.target);
  }
  return out;
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectLang(text: string): Lang {
  // crude: count CJK vs latin
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (cjk > lat) return 'zh';
  return 'en';
}
