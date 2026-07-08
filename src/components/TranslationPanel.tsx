import { useMemo, useState } from 'react';
import { ArrowDownToLine, Captions, FileDown, Loader2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import { exportDOCX, exportJSON, exportMarkdown, exportPDF, exportPPTX } from '../lib/export';
import { similarity } from '../lib/tm';

export function TranslationPanel({ onJumpSubtitle }: { onJumpSubtitle?: () => void }) {
  const segments = useApp((s) => s.segments);
  const tm = useApp((s) => s.tm);
  const activeTask = useApp((s) => s.activeTask);
  const progress = useApp((s) => s.progress);
  const running = useApp((s) => s.running);

  const [filter, setFilter] = useState<'all' | 'done' | 'tm' | 'llm'>('all');

  const items = useMemo(() => {
    return segments.map((s) => {
      const tmHit = s.target && tm.find((e) => similarity(e.target, s.target || '') > 0.7);
      return { ...s, tmHit };
    });
  }, [segments, tm]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'done') return items.filter((s) => s.status === 'done');
    if (filter === 'tm') return items.filter((s) => s.via === 'TM');
    if (filter === 'llm') return items.filter((s) => s.via === 'LLM');
    return items;
  }, [items, filter]);

  const onExport = (kind: 'md' | 'json' | 'docx' | 'pdf' | 'pptx') => {
    if (!activeTask) return;
    if (kind === 'md') exportMarkdown(activeTask);
    if (kind === 'json') exportJSON(activeTask);
    if (kind === 'pdf') exportPDF(activeTask);
    if (kind === 'docx') exportDOCX(activeTask);
    if (kind === 'pptx') exportPPTX(activeTask);
  };

  return (
    <div className="rounded-2xl border border-rule bg-paper shadow-soft h-[640px] flex flex-col">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 flex-wrap">
        <div>
          <div className="text-[13px] font-semibold">译文 · Translation</div>
          <div className="text-[11px] text-ink/50 mt-0.5">已应用翻译记忆库 · 术语库 · 语料检索增强</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {onJumpSubtitle && (
            <button onClick={onJumpSubtitle} className="h-8 px-2.5 rounded-lg border border-rule text-[11.5px] inline-flex items-center gap-1 hover:bg-canvas">
              <Captions size={13} /> 实时字幕
            </button>
          )}
          <ExportBtn onClick={() => onExport('md')}>MD</ExportBtn>
          <ExportBtn onClick={() => onExport('json')}>JSON</ExportBtn>
          <ExportBtn onClick={() => onExport('docx')}>DOCX</ExportBtn>
          <ExportBtn onClick={() => onExport('pdf')}>PDF</ExportBtn>
          <ExportBtn onClick={() => onExport('pptx')} primary>
            <FileDown size={12} /> PPTX
          </ExportBtn>
        </div>
      </div>
      <div className="px-5 pb-3 flex items-center gap-1.5">
        {(['all', 'done', 'tm', 'llm'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              'h-7 px-2.5 rounded-full border text-[11px] font-medium ' +
              (filter === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-rule text-ink/65 hover:bg-canvas')
            }
          >
            {f === 'all' ? '全部' : f === 'done' ? '已完成' : f === 'tm' ? '记忆复用' : 'LLM 生成'}
          </button>
        ))}
        <div className="ml-auto text-[11px] text-ink/45">
          {segments.filter((s) => s.status === 'done').length} / {segments.length} 段
        </div>
      </div>
      <div className="flex-1 overflow-auto scroll-thin px-5 pb-5">
        {segments.length === 0 ? (
          <div className="h-full grid place-items-center text-ink/40 text-[13px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-canvas grid place-items-center">
                <ArrowDownToLine size={20} />
              </div>
              <div>上传后显示译文 · 支持 MD / JSON / DOCX / PDF / PPTX 导出</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((s) => (
              <article key={s.id} className="rounded-xl border border-rule bg-paper p-3.5">
                <header className="flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-ink/45">
                  <span>Slide {s.page}</span>
                  {s.via && <Pill kind={s.via} />}
                  {s.tmHit && <span className="ml-auto text-[10.5px] text-ok">✓ TM 命中</span>}
                </header>
                <p className="mt-1.5 text-[12.5px] text-ink/55 leading-relaxed">{s.source}</p>
                <div className="mt-2 text-[14px] leading-relaxed text-ink whitespace-pre-wrap">
                  {s.status === 'translating' ? (
                    <span className="inline-flex items-center gap-1.5 text-ink/40">
                      <Loader2 size={13} className="animate-spin" /> 翻译中…
                    </span>
                  ) : s.status === 'error' ? (
                    <ErrorCard msg={s.errorMsg || s.target || ''} hint={s.errorHint} via={s.via} />
                  ) : (
                    <>
                      {s.target || <span className="text-ink/30 italic">等待翻译</span>}
                      {s.via === 'mock' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas text-[10.5px] text-ink/55">
                          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulseDot" />
                          离线演示模式（结果由本地词典生成，配置 API Key 后启用真实翻译）
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {running && (
        <div className="h-1 bg-rule/60 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function Pill({ kind }: { kind: 'TM' | 'LLM' | 'glossary' | 'mock' }) {
  const map: Record<string, string> = {
    TM: 'bg-ok/15 text-ok',
    LLM: 'bg-brand-50 text-brand-700',
    glossary: 'bg-warn/15 text-warn',
    mock: 'bg-ink/8 text-ink/60',
  };
  return <span className={`text-[10px] font-semibold px-1.5 h-4 inline-flex items-center rounded ${map[kind] || ''}`}>{kind}</span>;
}

function ErrorCard({ msg, hint, via }: { msg: string; hint?: string; via?: string }) {
  const setPriority = useApp.getState().setPriority;
  return (
    <div className="mt-1.5 rounded-xl border border-warn/40 bg-warn/5 p-3">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-warn">
        <span>⚠ 翻译失败</span>
        {via && <span className="ml-auto text-[10.5px] text-warn/70 uppercase">{via}</span>}
      </div>
      <div className="mt-1.5 text-[12px] text-ink/75 leading-relaxed font-mono break-all">
        {msg || '未知错误'}
      </div>
      {hint && (
        <div className="mt-2 text-[12px] text-ink/65 leading-relaxed">
          <span className="font-semibold text-ink/80">💡 建议：</span>{hint}
        </div>
      )}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => setPriority('auto')}
          className="h-7 px-2.5 rounded-md bg-brand-500 text-white text-[11.5px] font-medium hover:bg-brand-600"
        >
          切换到 auto 模式自动降级
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(msg).catch(() => {})}
          className="h-7 px-2.5 rounded-md border border-rule text-[11.5px] text-ink/65 hover:bg-canvas"
        >
          复制错误信息
        </button>
      </div>
    </div>
  );
}

function ExportBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={
        'h-8 px-2.5 rounded-lg border text-[11.5px] inline-flex items-center gap-1 ' +
        (primary
          ? 'border-brand-500 bg-brand-500 text-white hover:bg-brand-600'
          : 'border-rule text-ink/70 hover:bg-canvas')
      }
    >
      {children}
    </button>
  );
}
