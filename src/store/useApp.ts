import { create } from 'zustand';
import type {
  ApiKeyMap,
  Corpus,
  DocSegment,
  GlossaryEntry,
  Lang,
  LangPair,
  ModelMap,
  OcrEngine,
  Priority,
  Provider,
  TaskRecord,
  TMEntry,
} from '../lib/types';
import { loadJSON, loadStored, NS_CORPUS, NS_GLOSSARY, NS_TASKS, NS_TM, saveJSON, saveStored } from '../lib/storage';

const DEMO_CORPUS: Corpus = {
  name: 'Built-in · 商务通用',
  rows: [
    { en: 'Quarterly revenue grew by 12% year-over-year.', zh: '季度营收同比增长 12%。' },
    { en: 'Customer acquisition cost dropped significantly.', zh: '客户获取成本显著下降。' },
    { en: 'Our roadmap focuses on platform stability.', zh: '我们的路线图聚焦于平台稳定性。' },
    { en: 'We are doubling down on AI innovation.', zh: '我们正加倍投入人工智能创新。' },
    { en: 'Thank you for joining the demo.', zh: '感谢您观看本次演示。' },
  ],
};

const SEED_GLOSSARY: GlossaryEntry[] = [
  { id: 'g1', source: 'Vibe Translate', target: 'Vibe 翻译', note: '产品名', locked: true },
  { id: 'g2', source: 'Translation Memory', target: '翻译记忆库', locked: true },
  { id: 'g3', source: 'Large Language Model', target: '大语言模型', locked: true },
  { id: 'g4', source: 'roadmap', target: '路线图', locked: true },
  { id: 'g5', source: 'go-to-market', target: '市场进入策略', locked: false },
];

interface AppState {
  // settings
  apiKeys: ApiKeyMap;
  modelMap: ModelMap;
  baseUrl: { openai: string; deepseek: string; doubao: string; sensenova: string };
  priority: Priority;
  provider: Provider;
  ocrEngine: OcrEngine;
  lang: LangPair;

  // data
  glossary: GlossaryEntry[];
  tm: TMEntry[];
  corpora: Corpus[];
  tasks: TaskRecord[];

  // current
  file: File | null;
  fileKind: 'pptx' | 'pdf' | null;
  segments: DocSegment[];
  activeTask: TaskRecord | null;
  running: boolean;
  progress: number;

  // ui
  view: 'workbench' | 'memory' | 'corpus' | 'glossary' | 'tasks' | 'subtitle' | 'login' | 'register';

  // actions
  setApiKey: (k: keyof ApiKeyMap, v: string) => void;
  setModel: (k: keyof ModelMap, v: string) => void;
  setBaseUrl: (k: keyof AppState['baseUrl'], v: string) => void;
  setPriority: (p: Priority) => void;
  setOcrEngine: (o: OcrEngine) => void;
  setLang: (l: LangPair) => void;
  setView: (v: AppState['view']) => void;
  setFile: (f: File | null, kind: 'pptx' | 'pdf' | null) => void;
  setSegments: (s: DocSegment[]) => void;
  setRunning: (r: boolean) => void;
  setProgress: (p: number) => void;

  addGlossary: (g: GlossaryEntry) => void;
  updateGlossary: (g: GlossaryEntry) => void;
  removeGlossary: (id: string) => void;
  importGlossary: (rows: GlossaryEntry[]) => void;

  addTM: (entries: TMEntry[]) => void;
  clearTM: () => void;

  addCorpus: (c: Corpus) => void;
  removeCorpus: (name: string) => void;

  setActiveTask: (t: TaskRecord | null) => void;
  addTask: (t: TaskRecord) => void;
}

export const useApp = create<AppState>((set, get) => {
  const stored = loadStored();
  const glossary = loadJSON<GlossaryEntry[]>(NS_GLOSSARY, SEED_GLOSSARY);
  const tm = loadJSON<TMEntry[]>(NS_TM, []);
  const corpora = loadJSON<Corpus[]>(NS_CORPUS, [DEMO_CORPUS]);
  const tasks = loadJSON<TaskRecord[]>(NS_TASKS, []);

  return {
    apiKeys: stored.apiKeys,
    modelMap: stored.modelMap,
    baseUrl: stored.baseUrl,
    priority: stored.priority,
    provider: stored.provider,
    ocrEngine: 'auto',
    lang: 'en-zh',

    glossary,
    tm,
    corpora,
    tasks,

    file: null,
    fileKind: null,
    segments: [],
    activeTask: stored.lastTask,
    running: false,
    progress: 0,

    view: 'workbench',

    setApiKey(k, v) {
      const apiKeys = { ...get().apiKeys, [k]: v };
      set({ apiKeys });
      persist({ ...storedRef(get()), apiKeys });
    },
    setModel(k, v) {
      const modelMap = { ...get().modelMap, [k]: v };
      set({ modelMap });
      persist({ ...storedRef(get()), modelMap });
    },
    setBaseUrl(k, v) {
      const baseUrl = { ...get().baseUrl, [k]: v };
      set({ baseUrl });
      persist({ ...storedRef(get()), baseUrl });
    },
    setPriority(p) {
      set({ priority: p });
      persist({ ...storedRef(get()), priority: p });
    },
    setOcrEngine(o) {
      set({ ocrEngine: o });
    },
    setLang(l) {
      set({ lang: l });
    },
    setView(v) {
      set({ view: v });
    },
    setFile(f, kind) {
      set({ file: f, fileKind: kind });
    },
    setSegments(s) {
      set({ segments: s });
    },
    setRunning(r) {
      set({ running: r });
    },
    setProgress(p) {
      set({ progress: p });
    },

    addGlossary(g) {
      const glossary = [...get().glossary, g];
      set({ glossary });
      saveJSON(NS_GLOSSARY, glossary);
    },
    updateGlossary(g) {
      const glossary = get().glossary.map((it) => (it.id === g.id ? g : it));
      set({ glossary });
      saveJSON(NS_GLOSSARY, glossary);
    },
    removeGlossary(id) {
      const glossary = get().glossary.filter((it) => it.id !== id);
      set({ glossary });
      saveJSON(NS_GLOSSARY, glossary);
    },
    importGlossary(rows) {
      const glossary = [...get().glossary, ...rows];
      set({ glossary });
      saveJSON(NS_GLOSSARY, glossary);
    },

    addTM(entries) {
      const tm = [...entries, ...get().tm].slice(0, 5000);
      set({ tm });
      saveJSON(NS_TM, tm);
    },
    clearTM() {
      set({ tm: [] });
      saveJSON(NS_TM, []);
    },

    addCorpus(c) {
      const corpora = [...get().corpora.filter((x) => x.name !== c.name), c];
      set({ corpora });
      saveJSON(NS_CORPUS, corpora);
    },
    removeCorpus(name) {
      const corpora = get().corpora.filter((c) => c.name !== name);
      set({ corpora });
      saveJSON(NS_CORPUS, corpora);
    },

    setActiveTask(t) {
      set({ activeTask: t });
      const s = storedRef(get());
      persist({ ...s, lastTask: t });
    },
    addTask(t) {
      const tasks = [t, ...get().tasks].slice(0, 50);
      set({ tasks });
      saveJSON(NS_TASKS, tasks);
    },
  };
});

function storedRef(s: AppState) {
  return {
    apiKeys: s.apiKeys,
    modelMap: s.modelMap,
    priority: s.priority,
    provider: s.provider,
    baseUrl: s.baseUrl,
    lastTask: s.activeTask,
  };
}

function persist(s: ReturnType<typeof storedRef>) {
  saveStored(s);
}

export const LANG_LABEL: Record<Lang, string> = {
  zh: '中文',
  en: '英文',
  ja: '日文',
  ko: '韩文',
};

export const LANG_PAIR_LABEL: Record<string, string> = {
  'zh-en': '中译英',
  'en-zh': '英译中',
  'zh-ja': '中译日',
  'ja-zh': '日译中',
  'zh-ko': '中译韩',
  'ko-zh': '韩译中',
  'en-ja': '英译日',
  'ja-en': '日译英',
};

export const PROVIDERS: { id: Provider; label: string; tag: string }[] = [
  { id: 'openai', label: 'OpenAI', tag: 'GPT-4.1 / 4o' },
  { id: 'deepseek', label: 'DeepSeek', tag: 'deepseek-chat' },
  { id: 'doubao', label: '豆包', tag: '火山方舟' },
  { id: 'sensenova', label: '日日新', tag: '商汤 SenseChat' },
  { id: 'mathpix', label: 'Mathpix', tag: '公式 OCR' },
  { id: 'azure', label: 'Azure AI', tag: 'Vision' },
  { id: 'aws', label: 'AWS Textract', tag: '文档 OCR' },
];
