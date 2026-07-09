import { useState } from 'react';
import { ChevronDown, KeyRound, KeyRound as KeyIcon, Cpu, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../store/useApp';
import type { OcrEngine, Provider } from '../lib/types';
import { testConnection } from '../lib/translate';

const OCR_OPTS: { id: OcrEngine; label: string; needsKey: boolean; keyLabel?: string }[] = [
  { id: 'auto', label: '自动', needsKey: false },
  { id: 'local', label: '本地 OCR', needsKey: false },
  { id: 'mathpix', label: 'Mathpix', needsKey: true, keyLabel: 'Mathpix App Key' },
  { id: 'azure', label: 'Azure AI', needsKey: true, keyLabel: 'Azure Subscription Key' },
  { id: 'aws', label: 'AWS', needsKey: true, keyLabel: 'AWS Access:Secret' },
  { id: 'text', label: '仅文本', needsKey: false },
];

const LLM_CFG: { id: Provider; label: string; tag: string; model: string; baseUrl: string }[] = [
  { id: 'openai', label: 'OpenAI', tag: 'GPT-4.1 / 4o', model: 'gpt-4.1-mini', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', label: 'DeepSeek', tag: 'deepseek-chat', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'doubao', label: '豆包', tag: '火山方舟', model: 'doubao-1-5-pro-32k-250115', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
  { id: 'sensenova', label: '日日新', tag: '商汤 SenseChat', model: 'SenseChat-128K', baseUrl: 'https://api.sensenova.cn/v1/llm/chat-completions' },
];

const OCR_CFG: { id: Provider; label: string; tag: string }[] = [
  { id: 'mathpix', label: 'Mathpix', tag: '公式 OCR' },
  { id: 'azure', label: 'Azure AI', tag: 'Vision' },
  { id: 'aws', label: 'AWS Textract', tag: '文档 OCR' },
];

export function Sidebar() {
  const ocrEngine = useApp((s) => s.ocrEngine);
  const setOcrEngine = useApp((s) => s.setOcrEngine);
  const priority = useApp((s) => s.priority);
  const setPriority = useApp((s) => s.setPriority);
  const provider = useApp((s) => s.provider);
  const apiKeys = useApp((s) => s.apiKeys);
  const setApiKey = useApp((s) => s.setApiKey);
  const modelMap = useApp((s) => s.modelMap);
  const setModel = useApp((s) => s.setModel);
  const baseUrl = useApp((s) => s.baseUrl);
  const setBaseUrl = useApp((s) => s.setBaseUrl);
  const running = useApp((s) => s.running);

  const [showCfg, setShowCfg] = useState(true);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const activeLlm = LLM_CFG.find((c) => c.id === provider) ?? LLM_CFG[0];
  const isOcrProvider = OCR_CFG.some((c) => c.id === provider);

  // 当前选中的 OCR 配置
  const activeOcr = OCR_OPTS.find((o) => o.id === ocrEngine) ?? OCR_OPTS[0];
  const ocrKeyProvider = ocrEngine === 'mathpix' ? 'mathpix' : ocrEngine === 'azure' ? 'azure' : ocrEngine === 'aws' ? 'aws' : null;

  const handleTestConnection = async () => {
    if (isOcrProvider) return;
    const key = apiKeys[provider];
    if (!key) {
      setTestState('error');
      setTestMessage('请先配置 API Key');
      return;
    }
    setTestState('testing');
    setTestMessage('正在测试连接...');
    try {
      const result = await testConnection(
        provider as 'openai' | 'deepseek' | 'doubao' | 'sensenova',
        key,
        baseUrl[provider as keyof typeof baseUrl] || '',
        modelMap[provider as keyof typeof modelMap] || ''
      );
      setTestState(result.success ? 'success' : 'error');
      setTestMessage(result.message);
    } catch (e) {
      setTestState('error');
      setTestMessage((e as Error).message || '测试连接失败');
    }
  };

  return (
    <div className="rounded-2xl border border-rule bg-paper shadow-soft p-4 flex flex-col gap-4">
      {/* ===== OCR 引擎 ===== */}
      <Section icon={<Cpu size={14} />} title="OCR 引擎">
        <div className="grid grid-cols-2 gap-2">
          {OCR_OPTS.map((o) => (
            <Chip key={o.id} active={ocrEngine === o.id} onClick={() => setOcrEngine(o.id)} label={o.label} />
          ))}
        </div>
        {/* OCR Key 配置区域（直接显示） */}
        {activeOcr.needsKey && (
          <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/30 p-2.5 animate-rise">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 mb-1.5">
              <KeyRound size={12} />
              {activeOcr.keyLabel}
            </div>
            <input
              type="password"
              placeholder={ocrEngine === 'aws' ? 'AccessKeyId:SecretKey' : 'API Key'}
              value={ocrKeyProvider ? apiKeys[ocrKeyProvider] || '' : ''}
              onChange={(e) => ocrKeyProvider && setApiKey(ocrKeyProvider, e.target.value)}
              className="w-full h-8 rounded-md border border-rule bg-paper px-2 text-[11.5px] font-mono"
            />
            {ocrKeyProvider && apiKeys[ocrKeyProvider] && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                {apiKeys[ocrKeyProvider].length < 16 ? (
                  <span className="text-warn">⚠️ Key 长度仅 {apiKeys[ocrKeyProvider].length} 字符（完整 Key 通常 32+ 字符），请检查是否完整复制</span>
                ) : (
                  <span className="text-ok">✅ Key 已配置（{apiKeys[ocrKeyProvider].length} 字符）</span>
                )}
              </div>
            )}
            <p className="mt-1.5 text-[10px] text-brand-700/60">
              ⚡ 选了 {activeOcr.label} 就要配 Key，否则 OCR 会失败
            </p>
          </div>
        )}
        {!activeOcr.needsKey && ocrEngine !== 'text' && (
          <div className="mt-2 text-[10.5px] text-ink/45">
            {ocrEngine === 'local' ? '✅ 本地 OCR 不需要 Key，但首次使用需下载训练数据（约5MB）' : '✅ 自动模式会优先用本地 OCR，云端引擎需要先配 Key'}
          </div>
        )}
      </Section>

      {/* ===== 翻译优先 ===== */}
      <Section icon={<Cpu size={14} />} title="翻译优先">
        <div className="flex gap-1.5 flex-wrap">
          {(['auto', 'openai', 'deepseek', 'doubao', 'sensenova'] as const).map((p) => (
            <Chip key={p} active={priority === p} onClick={() => setPriority(p)} label={p} />
          ))}
        </div>
      </Section>

      {/* ===== 提供商芯片（翻译 + OCR 合并）===== */}
      <Section icon={<KeyIcon size={14} />} title="翻译 API 提供商">
        <div className="flex flex-col gap-2">
          {/* LLM 提供商 */}
          <div className="grid grid-cols-2 gap-1.5">
            {LLM_CFG.map((c) => (
              <ProviderChip
                key={c.id}
                label={c.label}
                tag={c.tag}
                hasKey={!!apiKeys[c.id]}
                active={provider === c.id}
                onClick={() => useApp.setState({ provider: c.id })}
              />
            ))}
          </div>
          {/* OCR 提供商 */}
          <div className="grid grid-cols-3 gap-1.5">
            {OCR_CFG.map((c) => (
              <ProviderChip
                key={c.id}
                label={c.label}
                tag={c.tag}
                hasKey={!!apiKeys[c.id]}
                active={provider === c.id}
                onClick={() => useApp.setState({ provider: c.id })}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ===== 当前提供商配置卡片（选中哪个显示哪个）===== */}
      <div className="rounded-xl border border-rule bg-canvas/40 p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${provider === activeLlm.id ? 'bg-brand-500' : 'bg-ink/20'}`} />
          <span className="text-[12.5px] font-semibold text-ink/80">
            {isOcrProvider ? provider.toUpperCase() : activeLlm.label} · 配置
          </span>
          <button
            onClick={() => setShowCfg(!showCfg)}
            className="ml-auto text-ink/40 hover:text-ink/70 transition"
          >
            <ChevronDown size={14} className={`transition-transform ${showCfg ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showCfg && (
          <div className="flex flex-col gap-2 animate-rise">
            {isOcrProvider ? (
              <>
                <KeyRow label="API Key" value={apiKeys[provider as Provider]} onChange={(v) => setApiKey(provider as Provider, v)} />
              </>
            ) : (
              <>
                <KeyRow label="API Key" value={apiKeys[provider as Provider]} onChange={(v) => setApiKey(provider as Provider, v)} />
                <UrlRow label="Base URL" value={baseUrl[provider as keyof typeof baseUrl] || ''} onChange={(v) => setBaseUrl(provider as any, v)} />
                <ModelRow label="模型名" value={modelMap[provider as keyof typeof modelMap] || ''} onChange={(v) => setModel(provider as any, v)} />
                <button
                  onClick={handleTestConnection}
                  disabled={testState === 'testing' || running}
                  className={`mt-1 h-8 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition ${
                    testState === 'testing'
                      ? 'bg-ink/10 text-ink/40 cursor-not-allowed'
                      : 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 active:bg-brand-500/30'
                  }`}
                >
                  {testState === 'testing' ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Wifi size={12} />
                      测试连接
                    </>
                  )}
                </button>
                {testState !== 'idle' && (
                  <div className={`flex items-start gap-1.5 text-[10px] px-1.5 py-1 rounded ${
                    testState === 'success' ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'
                  }`}>
                    {testState === 'success' ? (
                      <CheckCircle size={11} className="mt-0.25 shrink-0" />
                    ) : testState === 'error' ? (
                      <AlertCircle size={11} className="mt-0.25 shrink-0" />
                    ) : null}
                    <span className="leading-relaxed break-all">{testMessage}</span>
                  </div>
                )}
              </>
            )}
            <p className="text-[10px] text-ink/40 leading-relaxed">
              Key 仅保存在浏览器 localStorage，不上传服务器。留空则走本地 Mock。
            </p>
          </div>
        )}
      </div>

      <div className="text-[10.5px] text-ink/40 mt-1">
        {running ? '⏳ 翻译进行中…' : '就绪 · 上传文件后点击「开始翻译」'}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink/65 tracking-wide">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        'h-9 rounded-xl border text-[12.5px] font-medium transition ' +
        (active
          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-chip'
          : 'border-rule bg-paper text-ink/70 hover:border-ink/30')
      }
    >
      {label}
    </button>
  );
}

function ProviderChip({
  label,
  tag,
  hasKey,
  active,
  onClick,
}: {
  label: string;
  tag: string;
  hasKey: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'h-10 rounded-lg border text-[11.5px] flex flex-col items-center justify-center transition relative ' +
        (active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-rule bg-paper text-ink/70 hover:border-ink/30')
      }
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[9.5px] text-ink/45 leading-none mt-0.5">{tag}</span>
      {hasKey && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-ok" title="已配置 Key" />
      )}
    </button>
  );
}

function KeyRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10.5px] text-ink/55 w-[56px] shrink-0">{label}</label>
      <input
        type="password"
        placeholder="sk-…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 rounded-md border border-rule bg-paper px-2 text-[11.5px] font-mono"
      />
    </div>
  );
}

function UrlRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10.5px] text-ink/55 w-[56px] shrink-0">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 rounded-md border border-rule bg-paper px-2 text-[10.5px] font-mono"
      />
    </div>
  );
}

function ModelRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10.5px] text-ink/55 w-[56px] shrink-0">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 rounded-md border border-rule bg-paper px-2 text-[11.5px] font-mono"
      />
    </div>
  );
}