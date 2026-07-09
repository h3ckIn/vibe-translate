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
    e.message = `${provider}: ${body.substring(0, 200)}`;
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

  const targetUrl = `${req.baseUrl[p]}/chat/completions`;
  const url = '/api/llm';
  const model = req.modelMap[p];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        key,
        payload: {
          model,
          messages,
          temperature: 0.2,
          stream: false,
        },
      }),
      signal: req.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw makeTranslateError(p, res.status, body);
    }
    const data = await res.json();
  // 兼容 OpenAI 标准格式 和 日日新等非标准格式
  const content = extractContent(data);
  return content.trim();
  } catch (e) {
    if ((e as Error).name === 'TypeError' && (e as Error).message.includes('fetch')) {
      const netErr = e as TranslateError;
      netErr.provider = p;
      netErr.message = `${p}: 网络连接失败 (${(e as Error).message})`;
      netErr.hint = '请检查网络连接是否正常，或尝试切换到其他 Provider。';
      throw netErr;
    }
    throw e;
  }
}

function extractContent(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  // OpenAI 标准格式
  const choices = d.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0];
    if (first && typeof first === 'object') {
      if (typeof (first as Record<string, unknown>).text === 'string') {
        return (first as Record<string, unknown>).text as string;
      }
      const message = (first as Record<string, unknown>).message;
      if (message && typeof message === 'object' && typeof (message as Record<string, unknown>).content === 'string') {
        return (message as Record<string, unknown>).content as string;
      }
    }
  }
  // 日日新部分接口可能直接返回 data.content 或 result
  if (typeof d.content === 'string') return d.content;
  if (typeof d.result === 'string') return d.result;
  if (typeof d.output === 'string') return d.output;
  if (Array.isArray(d.data) && d.data.length > 0 && typeof d.data[0] === 'string') return d.data[0];
  // 尝试从任意字段找字符串 content
  for (const key of ['content', 'text', 'output', 'result', 'message', 'response']) {
    if (typeof d[key] === 'string') return d[key] as string;
  }
  return '';
}

export async function testConnection(provider: LLMProvider, apiKey: string, baseUrl: string, model: string): Promise<{ success: boolean; message: string; status?: number }> {
  const targetUrl = `${baseUrl}/chat/completions`;
  const url = '/api/llm';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        key: apiKey,
        payload: {
          model,
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0,
          max_tokens: 10,
          stream: false,
        },
      }),
    });
    const body = await res.text();
    if (res.ok) {
      try {
        const data = JSON.parse(body);
        const content = extractContent(data);
        if (content) {
          return { success: true, message: `连接成功！API Key 有效（响应：${content.trim().slice(0, 30)}...）`, status: res.status };
        }
        if (data.id && data.object === 'chat.completion') {
          return { success: true, message: `连接成功！API Key 有效（响应格式正确，ID: ${data.id.slice(0, 20)}...）`, status: res.status };
        }
        return { success: true, message: `连接成功！API 返回 200 OK`, status: res.status };
      } catch {
        return { success: true, message: `连接成功！API 返回 200 OK（响应非 JSON）`, status: res.status };
      }
    } else {
      try {
        const json = JSON.parse(body);
        const msg = json?.error?.message || json?.message || body.substring(0, 100);
        return { success: false, message: `${res.status} - ${msg}`, status: res.status };
      } catch {
        return { success: false, message: `${res.status} - ${body.substring(0, 100)}`, status: res.status };
      }
    }
  } catch (e) {
    if ((e as Error).name === 'TypeError' && (e as Error).message.includes('fetch')) {
      return { success: false, message: `网络连接失败: ${(e as Error).message}` };
    }
    return { success: false, message: `未知错误: ${(e as Error).message}` };
  }
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
