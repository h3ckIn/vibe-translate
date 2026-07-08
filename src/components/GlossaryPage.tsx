import { useState } from 'react';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import type { GlossaryEntry } from '../lib/types';

export function GlossaryPage() {
  const glossary = useApp((s) => s.glossary);
  const addGlossary = useApp((s) => s.addGlossary);
  const updateGlossary = useApp((s) => s.updateGlossary);
  const removeGlossary = useApp((s) => s.removeGlossary);
  const [draft, setDraft] = useState<GlossaryEntry>({ id: '', source: '', target: '', note: '', locked: true });

  const save = () => {
    if (!draft.source || !draft.target) return;
    addGlossary({ ...draft, id: crypto.randomUUID() });
    setDraft({ id: '', source: '', target: '', note: '', locked: true });
  };

  return (
    <div className="pt-6 grid grid-cols-12 gap-5 animate-rise">
      <section className="col-span-12 lg:col-span-4 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-brand-500" />
          <h3 className="text-[14px] font-semibold">新增术语</h3>
        </header>
        <div className="flex flex-col gap-2">
          <input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="原文术语" className="h-10 rounded-lg border border-rule bg-canvas px-3 text-[13px]" />
          <input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} placeholder="指定译法" className="h-10 rounded-lg border border-rule bg-canvas px-3 text-[13px]" />
          <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="备注 / 上下文（可选）" className="h-10 rounded-lg border border-rule bg-canvas px-3 text-[13px]" />
          <label className="text-[12px] text-ink/65 flex items-center gap-2">
            <input type="checkbox" checked={draft.locked} onChange={(e) => setDraft({ ...draft, locked: e.target.checked })} />
            强制生效（翻译时硬替换）
          </label>
          <button onClick={save} className="h-10 rounded-lg bg-brand-500 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-brand-600">
            <Plus size={14} /> 添加到术语库
          </button>
        </div>
        <p className="mt-4 text-[11.5px] text-ink/50 leading-relaxed">
          术语库是翻译前最后一道硬约束。无论 LLM 返回什么，强制条目都会被替换为指定译法。
        </p>
      </section>

      <section className="col-span-12 lg:col-span-8 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-semibold">术语列表 · {glossary.length} 条</h3>
        </header>
        <div className="overflow-auto scroll-thin max-h-[520px]">
          <table className="w-full text-[12.5px]">
            <thead className="text-[10.5px] uppercase tracking-wide text-ink/45">
              <tr>
                <th className="text-left py-2 px-2">原文</th>
                <th className="text-left py-2 px-2">指定译法</th>
                <th className="text-left py-2 px-2">备注</th>
                <th className="text-left py-2 px-2">强制</th>
                <th className="text-right py-2 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {glossary.map((g) => (
                <tr key={g.id} className="border-t border-rule hover:bg-canvas/70">
                  <td className="py-2 px-2 align-top">
                    <input value={g.source} onChange={(e) => updateGlossary({ ...g, source: e.target.value })} className="w-full h-7 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input value={g.target} onChange={(e) => updateGlossary({ ...g, target: e.target.value })} className="w-full h-7 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input value={g.note || ''} onChange={(e) => updateGlossary({ ...g, note: e.target.value })} className="w-full h-7 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input type="checkbox" checked={g.locked} onChange={(e) => updateGlossary({ ...g, locked: e.target.checked })} />
                  </td>
                  <td className="py-2 px-2 align-top text-right">
                    <button onClick={() => removeGlossary(g.id)} className="text-ink/40 hover:text-warn"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
