import { useState } from 'react';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import type { GlossaryEntry } from '../lib/types';

const TEMPLATE = { source: '', target: '', note: '', locked: true };

export function GlossaryDrawer() {
  const glossary = useApp((s) => s.glossary);
  const addGlossary = useApp((s) => s.addGlossary);
  const updateGlossary = useApp((s) => s.updateGlossary);
  const removeGlossary = useApp((s) => s.removeGlossary);
  const importGlossary = useApp((s) => s.importGlossary);
  const [rows, setRows] = useState<GlossaryEntry[]>([]);
  const [bulkText, setBulkText] = useState('');

  const addRow = () => setRows((r) => [...r, { ...TEMPLATE, id: crypto.randomUUID() }]);
  const updateRow = (id: string, patch: Partial<GlossaryEntry>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const saveAll = () => {
    const cleaned = rows.filter((r) => r.source && r.target);
    if (cleaned.length) importGlossary(cleaned);
    setRows([]);
  };

  const parseBulk = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: GlossaryEntry[] = [];
    for (const line of lines) {
      const parts = line.split(/[=→:，,]/).map((s) => s.trim());
      if (parts.length >= 2) {
        parsed.push({ id: crypto.randomUUID(), source: parts[0], target: parts[1], note: parts[2] || '', locked: true });
      }
    }
    if (parsed.length) importGlossary(parsed);
    setBulkText('');
  };

  return (
    <section className="rounded-2xl border border-rule bg-paper shadow-soft p-5 mt-5">
      <header className="flex items-center gap-2">
        <BookOpen size={16} className="text-brand-500" />
        <h3 className="text-[14px] font-semibold">术语库 · Glossary</h3>
        <span className="text-[11.5px] text-ink/45">已存 {glossary.length} 条 · 翻译时强制替换</span>
        <button onClick={addRow} className="ml-auto h-8 px-3 rounded-lg border border-brand-500 text-brand-700 text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-brand-50">
          <Plus size={13} /> 添加术语
        </button>
      </header>
      <div className="mt-3 grid grid-cols-12 gap-2 text-[11px] text-ink/45 px-1">
        <div className="col-span-4">原文术语</div>
        <div className="col-span-3">指定译法</div>
        <div className="col-span-3">备注</div>
        <div className="col-span-1">强制</div>
        <div className="col-span-1 text-right">操作</div>
      </div>
      <div className="mt-1 flex flex-col">
        {glossary.map((g) => (
          <div key={g.id} className="grid grid-cols-12 gap-2 items-center px-1 py-1.5 hover:bg-canvas/70 rounded-lg">
            <input value={g.source} onChange={(e) => updateGlossary({ ...g, source: e.target.value })} className="col-span-4 h-8 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
            <input value={g.target} onChange={(e) => updateGlossary({ ...g, target: e.target.value })} className="col-span-3 h-8 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
            <input value={g.note || ''} onChange={(e) => updateGlossary({ ...g, note: e.target.value })} className="col-span-3 h-8 rounded-md border border-rule bg-canvas px-2 text-[12.5px]" />
            <label className="col-span-1 flex items-center justify-center">
              <input type="checkbox" checked={g.locked} onChange={(e) => updateGlossary({ ...g, locked: e.target.checked })} />
            </label>
            <button onClick={() => removeGlossary(g.id)} className="col-span-1 text-ink/40 hover:text-warn flex justify-end">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center px-1 py-1.5 bg-brand-50/40 rounded-lg">
            <input value={r.source} onChange={(e) => updateRow(r.id, { source: e.target.value })} placeholder="source" className="col-span-4 h-8 rounded-md border border-brand-200 bg-paper px-2 text-[12.5px]" />
            <input value={r.target} onChange={(e) => updateRow(r.id, { target: e.target.value })} placeholder="target" className="col-span-3 h-8 rounded-md border border-brand-200 bg-paper px-2 text-[12.5px]" />
            <input value={r.note} onChange={(e) => updateRow(r.id, { note: e.target.value })} placeholder="note" className="col-span-3 h-8 rounded-md border border-brand-200 bg-paper px-2 text-[12.5px]" />
            <label className="col-span-1 flex items-center justify-center">
              <input type="checkbox" checked={r.locked} onChange={(e) => updateRow(r.id, { locked: e.target.checked })} />
            </label>
            <button onClick={() => setRows((rr) => rr.filter((x) => x.id !== r.id))} className="col-span-1 text-ink/40 hover:text-warn flex justify-end">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button onClick={saveAll} className="h-9 px-4 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-brand-600">
            <Save size={13} /> 保存术语库
          </button>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-[12px] text-ink/55 select-none">批量导入（每行：原文 = 译文）</summary>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={4}
          placeholder={'Vibe Translate = Vibe 翻译\nroadmap = 路线图'}
          className="mt-2 w-full rounded-lg border border-rule bg-canvas p-2 text-[12px] font-mono"
        />
        <button onClick={parseBulk} className="mt-2 h-8 px-3 rounded-md border border-rule text-[12px] hover:bg-canvas">解析并导入</button>
      </details>
    </section>
  );
}
