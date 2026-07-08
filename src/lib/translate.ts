import type { ApiKeyMap, ModelMap, Provider } from './types';
import { applyGlossary, lookupTM } from './tm';
import { retrieveExamples } from './corpus';

export interface TranslateRequest {
  text: string;
  sourceLang: 'zh' | 'en' | 'ja' | 'ko';
  targetLang: 'zh' | 'en' | 'ja' | 'ko';
  provider: Provider;
  priority: 'auto' | 'openai' | 'deepseek' | 'doubao' | 'sensenova';
  apiKeys: ApiKeyMap;
  modelMap: ModelMap;
  baseUrl: { openai: string; deepseek: string; doubao: string; sensenova: string };
  glossary: import('./types').GlossaryEntry[];
  tm: import('./types').TMEntry[];
  corpora: import('./types').Corpus[];
  signal?: AbortSignal;
}

export interface TranslateResult {
  text: string;
  via: 'TM' | 'LLM' | 'glossary' | 'mock';
  usedProvider?: string;
  errorDetail?: string;
}

export interface TranslateError extends Error {
  provider: string;
  status?: number;
  hint?: string;
}

export function makeTranslateError(provider: string, status: number, body: string): TranslateError {
  const e = new Error(`${provider} ${status}`) as TranslateError;
  e.provider = provider;
  e.status = status;
  let hint = '';
  try {
    const json = JSON.parse(body);
    const msg = json?.error?.message || json?.message || '';
    if (msg) e.message = `${provider}: ${msg}`;
    if (status === 401 || status === 403) {
      hint = 'API Key 无效或已过期，请检查 Key 是否完整复制、账户是否有余额。';
    } else if (status === 429) {
      hint = '请求过于频繁 / 额度不足，请稍后再试或升级套餐。';
    } else if (status >= 500) {
      hint = '服务端错误，可切换到其他 Provider 继续使用。';
    } else if (status === 404) {
      hint = 'Base URL 或模型名有误，请检查设置。';
    }
  } catch {
    /* body 不是 JSON */
  }
  e.hint = hint;
  return e;
}

const SYS_PROMPT = (sl: string, tl: string) => `You are Vibe Translate, a senior professional translator.
Your task: translate the user's text into ${tl}.
- If the source text is already in ${tl}, still rephrase it to be more natural and idiomatic (do NOT return the original unchanged).
- Preserve all technical terms, proper names, numbers, code snippets, and formatting markers.
- Keep the output concise and slide-friendly.
- Return ONLY the translation result — no explanations, no quotes, no commentary.`;

function buildMessages(req: TranslateRequest, text: string) {
  const corpusExamples = retrieveExamples(text, req.corpora);
  const prompt = `Source (${req.sourceLang} → ${req.targetLang}):\n${text}`;
  return [
    { role: 'system' as const, content: SYS_PROMPT(req.sourceLang, req.targetLang) },
    ...(corpusExamples.length
      ? [
          {
            role: 'system' as const,
            content: `Reference examples (style only, do not copy):\n${corpusExamples.join('\n---\n')}`,
          },
        ]
      : []),
    { role: 'user' as const, content: prompt },
  ];
}

export async function translate(req: TranslateRequest): Promise<TranslateResult> {
  // 1. Glossary hard-replace (cheap & deterministic)
  let text = applyGlossary(req.text, req.glossary);

  // 2. TM hit
  const hit = lookupTM(req.text, req.targetLang, req.tm, 0.78);
  if (hit) {
    return { text: applyGlossary(hit.target, req.glossary), via: 'TM' };
  }

  // 3. Choose provider
  const llmProviders: LLMProvider[] = ['openai', 'deepseek', 'doubao', 'sensenova'];
  const order: LLMProvider[] =
    req.priority === 'auto'
      ? pickAutoOrder(req.apiKeys)
      : (llmProviders.includes(req.priority as LLMProvider) ? [req.priority as LLMProvider] : []);

  const errors: TranslateError[] = [];
  for (const p of order) {
    try {
      const r = await callLLM(p, req, text);
      return { text: r, via: 'LLM', usedProvider: p };
    } catch (e) {
      if ((e as Error).name === 'AbortError' || (e as Error).message.includes('abort')) throw e;
      const err = e as TranslateError;
      errors.push(err);
      // auto 模式下继续尝试下一个；非 auto 直接抛
      if (req.priority !== 'auto') throw e;
    }
  }

  // 4. Fallback: mock translation (so the UI is always demonstrable)
  const detail = errors.map((e) => `${e.provider}: ${e.message}`).join('; ');
  
  // 检查是否配置了任何 Key
  const hasAnyKey = !!(req.apiKeys.openai || req.apiKeys.deepseek || req.apiKeys.doubao || req.apiKeys.sensenova);
  const noKeyHint = !hasAnyKey 
    ? '\n\n💡 没有配置任何 LLM API Key，请点击左侧「API 提供商」配置 OpenAI/DeepSeek/豆包/日日新 之一。' 
    : '';
  
  return {
    text: mockTranslate(text, req.sourceLang, req.targetLang) + noKeyHint,
    via: 'mock',
    errorDetail: detail,
  };
}

function pickAutoOrder(keys: ApiKeyMap): LLMProvider[] {
  const order: LLMProvider[] = [];
  if (keys.deepseek) order.push('deepseek');
  if (keys.openai) order.push('openai');
  if (keys.sensenova) order.push('sensenova');
  if (keys.doubao) order.push('doubao');
  if (order.length === 0) return []; // 没有可用的 Key，返回空数组
  return order;
}

type LLMProvider = 'openai' | 'deepseek' | 'doubao' | 'sensenova';
async function callLLM(p: LLMProvider, req: TranslateRequest, text: string): Promise<string> {
  const key = req.apiKeys[p];
  if (!key) throw new Error(`${p} API key missing`);
  const messages = buildMessages(req, text);

  // OpenAI / DeepSeek / 豆包 / 日日新：标准 OpenAI 兼容 chat/completions
  const url = `${req.baseUrl[p]}/chat/completions`;
  const model = req.modelMap[p];
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      stream: false,
    }),
    signal: req.signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw makeTranslateError(p, res.status, body);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// Deterministic bilingual mock for demo / offline mode.
function mockTranslate(text: string, sl: string, tl: string): string {
  const dict: Record<string, string> = {
    'Hello': '你好',
    'World': '世界',
    'Slide': '幻灯片',
    'Title': '标题',
    'Content': '内容',
    'Thank you': '谢谢',
    'Welcome to': '欢迎来到',
    'Introduction': '简介',
    'Conclusion': '结论',
    'Agenda': '议程',
    'Overview': '概览',
    'Quarterly Report': '季度报告',
    'Q1': '第一季度',
    'Q2': '第二季度',
    'Q3': '第三季度',
    'Q4': '第四季度',
    'Revenue': '营收',
    'Growth': '增长',
    'Customer': '客户',
    'Strategy': '战略',
    'Roadmap': '路线图',
    'Team': '团队',
    'Product': '产品',
    'Market': '市场',
    'AI': '人工智能',
    'Machine Learning': '机器学习',
    'Cloud': '云',
    'Data': '数据',
    'Platform': '平台',
    'Innovation': '创新',
  };
  let out = text;
  for (const [en, zh] of Object.entries(dict)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), zh);
  }
  // For zh → en, fallback is identity but prefixed.
  if (sl === 'zh' && tl === 'en') {
    return `[EN] ${text}`;
  }
  return out;
}
