import { useEffect, useRef, useState } from 'react';
import { CloudUpload, FileText, Sparkles, FileType2, Captions, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TranslationPanel } from './TranslationPanel';
import { GlossaryDrawer } from './GlossaryDrawer';
import { useApp } from '../store/useApp';
import { parsePptx } from '../lib/parsePptx';
import { parsePdf } from '../lib/parsePdf';
import { runOcr } from '../lib/ocr';
import { translate, type TranslateError } from '../lib/translate';
import type { DocSegment, Lang, TaskRecord } from '../lib/types';
import { detectLang } from '../lib/tm';

const DEMO_TEXT = `Welcome to Vibe Translate — a one-click PPT/PDF translator powered by Translation Memory, Corpus, Glossary, and Large Language Models.`;

export function Workbench() {
  const file = useApp((s) => s.file);
  const setFile = useApp((s) => s.setFile);
  const setSegments = useApp((s) => s.setSegments);
  const segments = useApp((s) => s.segments);
  const setRunning = useApp((s) => s.setRunning);
  const running = useApp((s) => s.running);
  const setProgress = useApp((s) => s.setProgress);
  const setActiveTask = useApp((s) => s.setActiveTask);
  const addTask = useApp((s) => s.addTask);
  const updateTask = useApp((s) => s.updateTask);
  const addTM = useApp((s) => s.addTM);
  const setView = useApp((s) => s.setView);

  const ocrEngine = useApp((s) => s.ocrEngine);
  const apiKeys = useApp((s) => s.apiKeys);
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const modelMap = useApp((s) => s.modelMap);
  const baseUrl = useApp((s) => s.baseUrl);
  const priority = useApp((s) => s.priority);
  const provider = useApp((s) => s.provider);
  const glossary = useApp((s) => s.glossary);
  const tm = useApp((s) => s.tm);
  const corpora = useApp((s) => s.corpora);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [statusText, setStatusText] = useState<string>('');

  useEffect(() => () => abortRef.current?.abort(), []);

  const onPick = async (f: File | null) => {
    if (!f) return;
    setFile(f, null);
    setSegments([]);
    setStatusText('解析文件中…');
    setProgress(0.05);
    const kind: 'pptx' | 'pdf' = f.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'pptx';
    setFile(f, kind);
    try {
      let parsed: { fileBase64: string; segments: DocSegment[] };
      if (kind === 'pptx') parsed = await parsePptx(f);
      else {
        if (ocrEngine !== 'text') {
          const ocred = await runOcr(f, ocrEngine, setProgress, {
            apiKeys: { mathpix: apiKeys.mathpix, azure: apiKeys.azure, aws: apiKeys.aws },
          });
          parsed = { fileBase64: '', segments: ocred.map((o, i) => ({ id: `${i + 1}-1`, page: o.page, source: o.text, status: 'pending' as const })) };
        } else {
          parsed = await parsePdf(f);
        }
      }
      setSegments(parsed.segments);
      setProgress(0.15);
      setStatusText(`已解析 ${parsed.segments.length} 个片段，准备就绪`);
      // auto-create a task record (queued)
      const task: TaskRecord = {
        id: crypto.randomUUID(),
        name: f.name.replace(/\.(pptx|pdf)$/i, ''),
        createdAt: Date.now(),
        lang,
        status: 'queued',
        total: parsed.segments.length,
        done: 0,
        segments: parsed.segments,
        fileBase64: parsed.fileBase64,
        fileKind: kind,
      };
      setActiveTask(task);
      addTask(task);
    } catch (e) {
      setStatusText(`解析失败: ${(e as Error).message}`);
    } finally {
      setProgress(0);
    }
  };

  const onStart = async () => {
    if (segments.length === 0) return;
    setRunning(true);
    setStatusText('开始翻译…');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const newTM: import('../lib/types').TMEntry[] = [];
    const updated: DocSegment[] = segments.map((s) => ({ ...s, status: 'translating', target: undefined, via: undefined }));
    setSegments(updated);
    for (let i = 0; i < updated.length; i++) {
      if (ctrl.signal.aborted) break;
      const s = updated[i];
      if (!s.source.trim()) {
        updated[i] = { ...s, status: 'done', target: '' };
        setSegments([...updated]);
        continue;
      }
      const [sl, tl] = lang.split('-') as [Lang, Lang];
      try {
        const r = await translate({
          text: s.source,
          sourceLang: sl,
          targetLang: tl,
          provider,
          priority,
          apiKeys,
          modelMap,
          baseUrl,
          glossary,
          tm,
          corpora,
          signal: ctrl.signal,
        });
        updated[i] = { ...s, status: 'done', target: r.text, via: r.via as any, usedProvider: r.usedProvider };
        if (r.via === 'LLM') {
          newTM.push({
            id: crypto.randomUUID(),
            source: s.source,
            target: r.text,
            sourceLang: sl,
            targetLang: tl,
            used: 1,
            createdAt: Date.now(),
          });
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError' || (e as Error).message.includes('abort')) {
          updated[i] = { ...s, status: 'pending', target: '' };
          break;
        }
        const err = e as TranslateError;
        updated[i] = {
          ...s,
          status: 'error',
          target: '',
          errorMsg: err.message,
          errorHint: err.hint,
        };
      }
      setSegments([...updated]);
      setProgress((i + 1) / updated.length);
      setStatusText(`翻译中 ${i + 1}/${updated.length}`);
    }
    if (newTM.length) addTM(newTM);
    setRunning(false);
    setStatusText(ctrl.signal.aborted ? '已中止' : '翻译完成 ✓');
    // refresh active task and tasks list
    const cur = useApp.getState().activeTask;
    if (cur) {
      const t: TaskRecord = { ...cur, segments: updated, done: updated.filter((s) => s.status === 'done').length, status: ctrl.signal.aborted ? 'failed' : 'done' };
      updateTask(t);
    }
  };

  const onStop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const onDemo = async () => {
    const blob = new Blob([DEMO_TEXT], { type: 'text/plain' });
    const fake = new File([blob], 'demo-welcome.txt', { type: 'text/plain' });
    setFile(fake, 'pptx');
    setSegments([{ id: '1-1', page: 1, source: DEMO_TEXT, status: 'pending' }]);
    setStatusText('已加载演示文本');
  };

  return (
    <div className="grid grid-cols-12 gap-5 pt-6 animate-rise">
      <aside className="col-span-12 lg:col-span-3 xl:col-span-3">
        <Sidebar />
      </aside>
      <section className="col-span-12 lg:col-span-9 xl:col-span-9 flex flex-col gap-5">
        <div className="rounded-2xl border border-rule bg-paper p-4 shadow-soft">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-rule bg-canvas hover:bg-rule/60 text-[13px] font-medium"
            >
              <CloudUpload size={16} />
              选择 PPTX / PDF
            </button>
            <button
              onClick={onDemo}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-rule bg-paper hover:bg-canvas text-[13px] font-medium"
            >
              <FileText size={16} />
              加载演示文本
            </button>
            <div className="flex items-center gap-2 ml-2 text-[12px] text-ink/60">
              语种：
              <LangTabs value={lang} onChange={setLang} />
            </div>
            {file && (
              <div className="ml-auto flex items-center gap-2 text-[12px] text-ink/55">
                <FileType2 size={14} /> {file.name} · {segments.length} 段
                <button onClick={() => { setFile(null, null); setSegments([]); setStatusText(''); }} className="ml-1 text-ink/40 hover:text-warn">
                  <X size={14} />
                </button>
              </div>
            )}
            <input ref={inputRef} hidden type="file" accept=".pptx,.pdf" onChange={(e) => onPick(e.target.files?.[0] || null)} />
          </div>
          {statusText && (
            <div className="mt-3 text-[12px] text-ink/60 flex items-center gap-2">
              <Sparkles size={13} className="text-brand-500" />
              {statusText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-rule bg-paper shadow-soft h-[640px] flex flex-col">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-ink">原文 · Source</div>
                  <div className="text-[11px] text-ink/50 mt-0.5">解析自 PPTX / PDF · 共 {segments.length} 段</div>
                </div>
                <button
                  onClick={running ? onStop : onStart}
                  disabled={segments.length === 0}
                  className={
                    'h-9 px-4 rounded-xl text-[12.5px] font-semibold inline-flex items-center gap-2 ' +
                    (segments.length === 0
                      ? 'bg-ink/5 text-ink/30 cursor-not-allowed'
                      : running
                      ? 'bg-warn text-white'
                      : 'bg-brand-500 text-white hover:bg-brand-600')
                  }
                >
                  <Sparkles size={14} />
                  {running ? '停止' : '开始翻译'}
                </button>
              </div>
              <div className="flex-1 overflow-auto scroll-thin px-3 pb-3">
                {segments.length === 0 ? (
                  <EmptyState />
                ) : (
                  segments.map((s) => <SourceRow key={s.id} s={s} />)
                )}
              </div>
            </div>
          </div>
          <div className="col-span-12 xl:col-span-7">
            <TranslationPanel onJumpSubtitle={() => setView('subtitle')} />
          </div>
        </div>

        <GlossaryDrawer />
      </section>
    </div>
  );
}

function LangTabs({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  const opts = [
    { v: 'en-zh', l: '英译中' },
    { v: 'zh-en', l: '中译英' },
    { v: 'ja-zh', l: '日译中' },
    { v: 'ko-zh', l: '韩译中' },
  ];
  return (
    <div className="inline-flex rounded-full border border-rule overflow-hidden">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={
            'px-3 h-7 text-[11.5px] font-medium ' +
            (value === o.v ? 'bg-brand-500 text-white' : 'bg-paper text-ink/70 hover:bg-canvas')
          }
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full grid place-items-center text-ink/40 text-[13px]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-canvas grid place-items-center">
          <FileText size={20} />
        </div>
        <div>上传或拖入 PPTX / PDF · 或加载演示文本</div>
        <div className="text-[11px] text-ink/35">支持 Microsoft PowerPoint 与 PDF（含扫描件 OCR）</div>
      </div>
    </div>
  );
}

function SourceRow({ s }: { s: DocSegment }) {
  return (
    <div className="px-3 py-2.5 rounded-xl hover:bg-canvas/70 group">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-ink/45">
        <span>Slide {s.page}</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <StatusDot status={s.status} />
          {s.status}
        </span>
      </div>
      <div className="mt-1 text-[13.5px] leading-relaxed text-ink/85 line-clamp-3">
        {s.source || <span className="text-ink/30 italic">（空页）</span>}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: DocSegment['status'] }) {
  const color = status === 'done' ? 'bg-ok' : status === 'error' ? 'bg-warn' : status === 'translating' ? 'bg-brand-500 animate-pulseDot' : 'bg-ink/25';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
