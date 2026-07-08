import { useRef, useState } from 'react';
import { Database, FileUp, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import type { Corpus } from '../lib/types';

const BUILTIN: Corpus[] = [
  {
    name: 'Built-in · 商务通用',
    rows: [
      { en: 'Quarterly revenue grew by 12% year-over-year.', zh: '季度营收同比增长 12%。' },
      { en: 'Customer acquisition cost dropped significantly.', zh: '客户获取成本显著下降。' },
      { en: 'Our roadmap focuses on platform stability.', zh: '我们的路线图聚焦于平台稳定性。' },
    ],
  },
  {
    name: 'Built-in · 学术报告',
    rows: [
      { en: 'We propose a novel attention mechanism.', zh: '我们提出了一种新颖的注意力机制。' },
      { en: 'Experiments show a 7-point improvement on GLUE.', zh: '实验显示在 GLUE 上有 7 分的提升。' },
    ],
  },
  {
    name: 'Built-in · 产品发布',
    rows: [
      { en: 'Today we are thrilled to announce…', zh: '今天我们激动地宣布…' },
      { en: 'Available globally starting next month.', zh: '下个月开始全球可用。' },
    ],
  },
];

export function CorpusPage() {
  const corpora = useApp((s) => s.corpora);
  const addCorpus = useApp((s) => s.addCorpus);
  const removeCorpus = useApp((s) => s.removeCorpus);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');

  const onUpload = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    const rows: { zh?: string; en?: string }[] = [];
    if (f.name.endsWith('.json') || f.name.endsWith('.jsonl')) {
      text.split(/\n+/).forEach((line) => {
        try {
          const o = JSON.parse(line);
          if (o && (o.zh || o.en)) rows.push({ zh: o.zh, en: o.en });
        } catch {
          /* skip */
        }
      });
    } else {
      text.split(/\n+/).forEach((line) => {
        const m = line.split(/[=→，,]/).map((s) => s.trim());
        if (m.length >= 2) rows.push({ en: m[0], zh: m[1] });
      });
    }
    addCorpus({ name: f.name.replace(/\.[^.]+$/, ''), rows });
  };

  return (
    <div className="pt-6 grid grid-cols-12 gap-5 animate-rise">
      <section className="col-span-12 lg:col-span-4 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-brand-500" />
          <h3 className="text-[14px] font-semibold">添加语料</h3>
        </header>
        <p className="text-[12px] text-ink/55 mb-3">支持 CSV / JSONL / 每行 `en = zh` 文本。最多 5MB。</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="语料名（可选）"
          className="w-full h-9 rounded-lg border border-rule bg-canvas px-3 text-[12.5px]"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="h-9 rounded-lg border border-rule bg-canvas text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:bg-rule/40"
          >
            <FileUp size={13} /> 上传文件
          </button>
          <button
            onClick={() => {
              const sample = BUILTIN[Math.floor(Math.random() * BUILTIN.length)];
              addCorpus({ ...sample, name: name || sample.name });
              setName('');
            }}
            className="h-9 rounded-lg bg-brand-500 text-white text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:bg-brand-600"
          >
            <Plus size={13} /> 添加内置示例
          </button>
        </div>
        <input ref={fileRef} hidden type="file" accept=".csv,.json,.jsonl,.txt" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
        <div className="mt-5 text-[11.5px] text-ink/50 leading-relaxed">
          语料会在翻译前自动按 token 命中，作为风格参考注入 LLM Prompt，
          不影响"术语库"和"翻译记忆"的硬约束。
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-semibold">已加载语料 · {corpora.length} 个</h3>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {corpora.map((c) => (
            <div key={c.name} className="rounded-xl border border-rule p-3 bg-canvas/50">
              <div className="flex items-center gap-2">
                <div className="text-[12.5px] font-semibold">{c.name}</div>
                <button onClick={() => removeCorpus(c.name)} className="ml-auto text-ink/40 hover:text-warn">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="text-[10.5px] text-ink/45 mt-0.5">{c.rows.length} 条</div>
              <div className="mt-2 max-h-32 overflow-auto scroll-thin text-[11.5px] text-ink/65 leading-relaxed">
                {c.rows.slice(0, 4).map((r, i) => (
                  <div key={i} className="truncate">
                    {r.en} <span className="text-ink/35">→</span> {r.zh}
                  </div>
                ))}
                {c.rows.length > 4 && <div className="text-ink/40 mt-1">… 还有 {c.rows.length - 4} 条</div>}
              </div>
            </div>
          ))}
          {corpora.length === 0 && <div className="text-ink/40 text-[12.5px] col-span-2 text-center py-12">尚未加载任何语料</div>}
        </div>
      </section>
    </div>
  );
}
