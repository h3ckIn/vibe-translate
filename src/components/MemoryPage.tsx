import { useMemo, useState } from 'react';
import { Layers, Search, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import { similarity } from '../lib/tm';

export function MemoryPage() {
  const tm = useApp((s) => s.tm);
  const addTM = useApp((s) => s.addTM);
  const clearTM = useApp((s) => s.clearTM);
  const [q, setQ] = useState('');

  const top = useMemo(() => {
    if (!q.trim()) return [];
    return tm
      .map((e) => ({ e, s: similarity(q, e.source) }))
      .filter((r) => r.s > 0.2)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);
  }, [q, tm]);

  return (
    <div className="pt-6 grid grid-cols-12 gap-5 animate-rise">
      <section className="col-span-12 lg:col-span-4 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-brand-500" />
          <h3 className="text-[14px] font-semibold">翻译记忆库检索</h3>
        </header>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="输入原文片段，回车检索 Top-5"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-rule bg-canvas text-[13px]"
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {top.map((m) => (
            <div key={m.e.id} className="rounded-xl border border-rule p-3 bg-canvas/60">
              <div className="text-[10.5px] uppercase tracking-wide text-ink/45">相似度 {(m.s * 100).toFixed(0)}%</div>
              <div className="text-[12.5px] mt-1 text-ink/85">{m.e.source}</div>
              <div className="text-[13px] mt-1 font-medium text-brand-700">{m.e.target}</div>
              <div className="text-[10.5px] text-ink/45 mt-1">
                {m.e.sourceLang} → {m.e.targetLang} · 使用 {m.e.used} 次
              </div>
            </div>
          ))}
          {q && top.length === 0 && <div className="text-[12px] text-ink/45">未找到高相似度匹配</div>}
        </div>
        <div className="mt-5 text-[11.5px] text-ink/50 leading-relaxed">
          翻译记忆库会在每次完成翻译后自动沉淀"原文-译文"pair，
          后续翻译时若匹配度 ≥ 0.78，会直接复用已有译文，保证跨文档的术语一致。
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-semibold">记忆库 · {tm.length} 条</h3>
          <button
            onClick={() => {
              if (confirm('清空所有翻译记忆？')) clearTM();
            }}
            className="ml-auto h-8 px-3 rounded-lg border border-rule text-[12px] inline-flex items-center gap-1 hover:bg-canvas"
          >
            <Trash2 size={13} /> 清空
          </button>
        </header>
        <div className="overflow-auto scroll-thin max-h-[520px]">
          <table className="w-full text-[12.5px]">
            <thead className="text-[10.5px] uppercase tracking-wide text-ink/45">
              <tr>
                <th className="text-left py-2 px-2">原文</th>
                <th className="text-left py-2 px-2">译文</th>
                <th className="text-left py-2 px-2">方向</th>
                <th className="text-right py-2 px-2">使用</th>
                <th className="text-right py-2 px-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {tm.map((e) => (
                <tr key={e.id} className="border-t border-rule hover:bg-canvas/70">
                  <td className="py-2 px-2 align-top text-ink/85">{e.source.slice(0, 80)}{e.source.length > 80 && '…'}</td>
                  <td className="py-2 px-2 align-top text-brand-700">{e.target.slice(0, 80)}{e.target.length > 80 && '…'}</td>
                  <td className="py-2 px-2 align-top text-ink/55">{e.sourceLang} → {e.targetLang}</td>
                  <td className="py-2 px-2 align-top text-right text-ink/55">{e.used}</td>
                  <td className="py-2 px-2 align-top text-right text-ink/45">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {tm.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink/40">
                    尚无记忆 · 翻译完一段文本后会自动写入
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
