import { useEffect, useRef, useState } from 'react';
import { Captions, Mic, MicOff, Settings2, Video, Square } from 'lucide-react';
import { createSubtitleController, type SubtitleController } from '../lib/speech';
import { translate } from '../lib/translate';
import { useApp } from '../store/useApp';

interface Line {
  id: number;
  text: string;
  translation: string;
  ts: number;
  isFinal: boolean;
}

export function SubtitlePage() {
  const apiKeys = useApp((s) => s.apiKeys);
  const modelMap = useApp((s) => s.modelMap);
  const baseUrl = useApp((s) => s.baseUrl);
  const priority = useApp((s) => s.priority);
  const provider = useApp((s) => s.provider);
  const glossary = useApp((s) => s.glossary);
  const tm = useApp((s) => s.tm);
  const corpora = useApp((s) => s.corpora);
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);

  const ctlRef = useRef<SubtitleController | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lines, setLines] = useState<Line[]>([]);
  const [fontSize, setFontSize] = useState(20);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const idRef = useRef(0);

  useEffect(() => {
    ctlRef.current = createSubtitleController();
    return () => ctlRef.current?.stop();
  }, []);

  const [sl, tl] = lang.split('-') as ['zh' | 'en' | 'ja' | 'ko', 'zh' | 'en' | 'ja' | 'ko'];

  const onStart = () => {
    if (!ctlRef.current) return;
    if (!ctlRef.current.supported) {
      setError('当前浏览器不支持 Web Speech API。请使用 Chrome / Edge 桌面版。');
      return;
    }
    setError('');
    setRunning(true);
    ctlRef.current.start(
      sl === 'zh' ? 'zh-CN' : sl === 'en' ? 'en-US' : sl === 'ja' ? 'ja-JP' : 'ko-KR',
      async (e) => {
        const id = ++idRef.current;
        setLines((prev) => [{ id, text: e.text, translation: '', ts: e.ts, isFinal: e.isFinal }, ...prev].slice(0, 60));
        if (e.isFinal && e.text.trim()) {
          try {
            const r = await translate({
              text: e.text,
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
            });
            setLines((prev) => prev.map((l) => (l.id === id ? { ...l, translation: r.text } : l)));
          } catch (err) {
            setLines((prev) => prev.map((l) => (l.id === id ? { ...l, translation: '⚠ ' + (err as Error).message } : l)));
          }
        }
      },
      (msg) => {
        setError(msg);
        setRunning(false);
      }
    );
  };

  const onStop = () => {
    ctlRef.current?.stop();
    setRunning(false);
  };

  return (
    <div className="pt-6 grid grid-cols-12 gap-5 animate-rise">
      <section className="col-span-12 lg:col-span-4 rounded-2xl border border-rule bg-paper shadow-soft p-5">
        <header className="flex items-center gap-2 mb-3">
          <Captions size={16} className="text-brand-500" />
          <h3 className="text-[14px] font-semibold">实时字幕 · 配置</h3>
        </header>
        <div className="flex flex-col gap-3 text-[12.5px]">
          <div>
            <div className="text-ink/65 mb-1">语种方向</div>
            <div className="flex gap-1.5 flex-wrap">
              {(['en-zh', 'zh-en', 'ja-zh', 'ko-zh'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setLang(p)}
                  className={
                    'h-8 px-3 rounded-lg border text-[11.5px] font-medium ' +
                    (lang === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-rule text-ink/65 hover:bg-canvas')
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-ink/65 mb-1">字幕样式</div>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-ink/55">字号</span>
              <input type="range" min={14} max={32} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="flex-1" />
              <span className="w-8 text-right">{fontSize}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11.5px] text-ink/55">位置</span>
              {(['top', 'bottom'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={
                    'h-7 px-3 rounded-md border text-[11.5px] ' +
                    (position === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-rule text-ink/65 hover:bg-canvas')
                  }
                >
                  {p === 'top' ? '顶部' : '底部'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {!running ? (
              <button onClick={onStart} className="flex-1 h-10 rounded-lg bg-brand-500 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-brand-600">
                <Mic size={14} /> 开始识别
              </button>
            ) : (
              <button onClick={onStop} className="flex-1 h-10 rounded-lg bg-warn text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5">
                <Square size={13} /> 停止
              </button>
            )}
            <button className="h-10 w-10 rounded-lg border border-rule inline-flex items-center justify-center text-ink/55" title="摄像头输入（开发中）">
              <Video size={14} />
            </button>
            <button className="h-10 w-10 rounded-lg border border-rule inline-flex items-center justify-center text-ink/55" title="更多设置">
              <Settings2 size={14} />
            </button>
          </div>
          {error && <div className="text-[12px] text-warn whitespace-pre-line">{error}</div>}
          <p className="text-[11.5px] text-ink/50 leading-relaxed pt-2">
            实时字幕使用浏览器原生 Web Speech API 识别，结果会立即调用 LLM 翻译并在面板中显示。
            适合会议、课程、采访等场景。
          </p>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 rounded-2xl border border-rule bg-paper shadow-soft p-5 flex flex-col">
        <header className="flex items-center gap-2 mb-3">
          <h3 className="text-[14px] font-semibold">字幕面板</h3>
          {running && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] text-ok">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulseDot" /> 收听中
            </span>
          )}
        </header>
        <div className="flex-1 overflow-auto scroll-thin space-y-2.5">
          {lines.length === 0 && (
            <div className="h-[300px] grid place-items-center text-ink/40 text-[13px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-canvas grid place-items-center">
                  <MicOff size={20} />
                </div>
                <div>点击「开始识别」后，对着麦克风说话试试</div>
                <div className="text-[11px] text-ink/35">首次使用浏览器会请求麦克风权限</div>
              </div>
            </div>
          )}
          {lines.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-rule p-3 transition"
              style={{ fontSize }}
            >
              <div className="text-ink/85">{l.text || <span className="text-ink/30 italic">（等待识别）</span>}</div>
              <div className="mt-1 text-brand-700 font-medium" style={{ fontSize: fontSize * 0.85 }}>
                {l.translation || <span className="text-ink/30 italic">{l.isFinal ? '翻译中…' : '继续说话中…'}</span>}
              </div>
              <div className="text-[10px] text-ink/40 mt-1">
                {new Date(l.ts).toLocaleTimeString()} · {l.isFinal ? 'final' : 'interim'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
