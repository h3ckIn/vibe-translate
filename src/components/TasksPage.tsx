import { useState } from 'react';
import { History, Loader2, Play, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import { exportDOCX, exportJSON, exportMarkdown, exportPDF, exportPPTX } from '../lib/export';

export function TasksPage() {
  const tasks = useApp((s) => s.tasks);
  const setActiveTask = useApp((s) => s.setActiveTask);
  const setView = useApp((s) => s.setView);
  const [pick, setPick] = useState<string | null>(tasks[0]?.id || null);
  const cur = tasks.find((t) => t.id === pick) || tasks[0];

  return (
    <div className="pt-6 grid grid-cols-12 gap-5 animate-rise">
      <section className="col-span-12 lg:col-span-4 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <History size={16} className="text-brand-500" />
          <h3 className="text-[14px] font-semibold">任务历史</h3>
          <span className="text-[11.5px] text-ink/45">{tasks.length} 条</span>
        </header>
        <div className="flex flex-col gap-1.5">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setPick(t.id)}
              className={
                'rounded-xl border p-3 text-left transition ' +
                ((cur?.id === t.id) ? 'border-brand-500 bg-brand-50' : 'border-rule bg-paper hover:bg-canvas')
              }
            >
              <div className="flex items-center gap-2">
                <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                <div className="ml-auto text-[10.5px] text-ink/45">
                  {t.status === 'done' ? '✓' : t.status === 'failed' ? '✗' : '…'} {t.done}/{t.total}
                </div>
              </div>
              <div className="text-[10.5px] text-ink/45 mt-1">
                {new Date(t.createdAt).toLocaleString()} · {t.lang}
              </div>
            </button>
          ))}
          {tasks.length === 0 && <div className="text-ink/40 text-[12.5px] text-center py-8">尚无任务</div>}
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        {!cur ? (
          <div className="h-[400px] grid place-items-center text-ink/40 text-[13px]">选择左侧任务查看详情</div>
        ) : (
          <div className="flex flex-col gap-4">
            <header className="flex items-center gap-3 flex-wrap">
              <div>
                <h3 className="font-display text-[20px]">{cur.name}</h3>
                <div className="text-[11.5px] text-ink/50 mt-0.5">
                  {new Date(cur.createdAt).toLocaleString()} · {cur.lang} · {cur.total} 段
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => { setActiveTask(cur); setView('workbench'); }}
                  className="h-9 px-3 rounded-lg border border-rule text-[12px] inline-flex items-center gap-1 hover:bg-canvas"
                >
                  <RotateCcw size={12} /> 回到工作台
                </button>
                <button onClick={() => exportMarkdown(cur)} className="h-9 px-3 rounded-lg border border-rule text-[12px] hover:bg-canvas">MD</button>
                <button onClick={() => exportJSON(cur)} className="h-9 px-3 rounded-lg border border-rule text-[12px] hover:bg-canvas">JSON</button>
                <button onClick={() => exportPDF(cur)} className="h-9 px-3 rounded-lg border border-rule text-[12px] hover:bg-canvas">PDF</button>
                <button onClick={() => exportDOCX(cur)} className="h-9 px-3 rounded-lg border border-rule text-[12px] hover:bg-canvas">DOCX</button>
                <button onClick={() => exportPPTX(cur)} className="h-9 px-3 rounded-lg bg-brand-500 text-white text-[12px] px-3 rounded-lg inline-flex items-center gap-1 hover:bg-brand-600">
                  <Play size={12} /> PPTX
                </button>
              </div>
            </header>
            <div className="overflow-auto scroll-thin max-h-[480px] flex flex-col gap-2">
              {cur.segments.map((s) => (
                <div key={s.id} className="rounded-xl border border-rule p-3">
                  <div className="text-[10.5px] uppercase tracking-wide text-ink/45">Slide {s.page}</div>
                  <div className="mt-1 text-[12px] text-ink/55">{s.source}</div>
                  <div className="mt-1 text-[13.5px] text-ink">{s.target || <span className="text-ink/30 italic">未翻译</span>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
