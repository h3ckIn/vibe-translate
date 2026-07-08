// Shared types
export type Lang = 'zh' | 'en' | 'ja' | 'ko';
export type LangPair = `${Lang}-${Lang}`;
export type Provider = 'openai' | 'deepseek' | 'doubao' | 'sensenova' | 'mathpix' | 'azure' | 'aws';
export type Priority = 'auto' | 'openai' | 'deepseek' | 'doubao' | 'sensenova';
export type OcrEngine = 'auto' | 'mathpix' | 'azure' | 'aws' | 'local' | 'text';

export interface GlossaryEntry {
  id: string;
  source: string;
  target: string;
  note?: string;
  locked: boolean;
}

export interface TMEntry {
  id: string;
  source: string;
  target: string;
  sourceLang: Lang;
  targetLang: Lang;
  used: number;
  createdAt: number;
}

export interface CorpusEntry {
  zh?: string;
  en?: string;
}

export interface Corpus {
  name: string;
  rows: CorpusEntry[];
}

export interface DocSegment {
  id: string;
  page: number;
  source: string;
  target?: string;
  status: 'pending' | 'translating' | 'done' | 'error';
  via?: 'TM' | 'LLM' | 'glossary' | 'mock';
  usedProvider?: string;
  errorMsg?: string;
  errorHint?: string;
}

export interface TaskRecord {
  id: string;
  name: string;
  createdAt: number;
  lang: LangPair;
  status: 'queued' | 'running' | 'done' | 'failed';
  total: number;
  done: number;
  segments: DocSegment[];
  fileBase64?: string;
  fileKind?: 'pptx' | 'pdf';
}

export interface ApiKeyMap {
  openai: string;
  deepseek: string;
  doubao: string;
  sensenova: string;
  mathpix: string;
  azure: string;
  aws: string;
}

export interface ModelMap {
  openai: string;
  deepseek: string;
  doubao: string;
  sensenova: string;
}
