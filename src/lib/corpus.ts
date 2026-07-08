// Tiny extractive "corpus" lookup: returns up to 5 example sentences that
// contain words from the source. Real RAG would use embeddings.
import type { Corpus } from './types';

export function retrieveExamples(query: string, corpora: Corpus[]): string[] {
  const q = query.toLowerCase();
  const tokens = Array.from(new Set(q.split(/[^A-Za-z\u4e00-\u9fa5]+/g).filter((t) => t.length > 2)));
  if (tokens.length === 0) return [];
  const hits: { score: number; text: string }[] = [];
  for (const c of corpora) {
    for (const r of c.rows) {
      const en = (r.en || '').toLowerCase();
      const zh = r.zh || '';
      let score = 0;
      for (const t of tokens) if (en.includes(t)) score += 1;
      if (zh.toLowerCase().includes(q)) score += 2;
      if (score > 0) hits.push({ score, text: `${r.en}\n→ ${r.zh}` });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, 5).map((h) => h.text);
}
