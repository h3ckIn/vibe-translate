import type { ApiKeyMap, ModelMap, Priority, Provider, TaskRecord } from './types';

const NS = 'vibe-translate:v1';

export interface StoredState {
  apiKeys: ApiKeyMap;
  modelMap: ModelMap;
  priority: Priority;
  provider: Provider;
  baseUrl: { openai: string; deepseek: string; doubao: string; sensenova: string };
  lastTask: TaskRecord | null;
}

const DEFAULT: StoredState = {
  apiKeys: { openai: '', deepseek: '', doubao: '', sensenova: '', mathpix: '', azure: '', aws: '' },
  modelMap: {
    openai: 'gpt-4.1-mini',
    deepseek: 'deepseek-chat',
    doubao: 'doubao-1-5-pro-32k-250115',
    sensenova: 'sensenova-6.7-flash-lite',
  },
  priority: 'auto',
  provider: 'openai',
  baseUrl: {
    openai: 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    doubao: 'https://ark.cn-beijing.volces.com/api/v3',
    sensenova: 'https://token.sensenova.cn/v1',
  },
  lastTask: null,
};

export function loadStored(): StoredState {
  try {
    const raw = localStorage.getItem(NS);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) } as StoredState;
  } catch {
    return DEFAULT;
  }
}

export function saveStored(s: StoredState) {
  try {
    localStorage.setItem(NS, JSON.stringify(s));
  } catch {
    /* quota or private mode */
  }
}

export const NS_GLOSSARY = 'vibe-translate:glossary';
export const NS_TM = 'vibe-translate:tm';
export const NS_CORPUS = 'vibe-translate:corpus';
export const NS_TASKS = 'vibe-translate:tasks';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}
