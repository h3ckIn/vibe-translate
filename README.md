# Vibe Translate · 一键 PPT / PDF 翻译工作台

> 用 **Vibe Coding** 风格构建的浏览器内翻译工具：上传 PPTX / PDF → 自动 OCR → 翻译记忆库 + 术语库 + 语料库增强 → 多模型 LLM 翻译 → 实时字幕 → 一键导出 MD/JSON/DOCX/PDF/原版 PPTX。

## ✨ 核心特性

| 模块 | 说明 |
|------|------|
| 📂 **多格式上传** | `.pptx` / `.pdf` 拖拽即传，自动分段 |
| 🔍 **多 OCR 引擎** | 自动 / Mathpix / Azure AI / AWS Textract / 本地 Tesseract / 仅文本 |
| 🧠 **翻译记忆库 (TM)** | 每次翻译自动沉淀、相似度匹配复用 |
| 📚 **语料库 (Corpus)** | 内置商务 / 学术 / 产品示例，支持上传 CSV/JSONL |
| 📒 **术语库 (Glossary)** | 强制指定译法，翻译时硬替换 |
| 🤖 **多模型翻译** | OpenAI · DeepSeek · 豆包 火山方舟 + 自定义 Base URL |
| 🎙️ **实时字幕** | Web Speech API 麦克风识别 + 翻译叠加，可调字号/位置 |
| 📤 **多格式导出** | Markdown / JSON / DOCX / PDF / 原版回写 PPTX |
| 🔒 **隐私优先** | API Key & 全部数据仅存浏览器 localStorage |

## 🚀 三步部署到公网

### 方式 A：Vercel 一键导入（推荐）
1. 把本仓库推到 GitHub。
2. 打开 [vercel.com/new](https://vercel.com/new) → Import Project。
3. Framework Preset = **Vite**（已通过 `vercel.json` 自动识别）。
4. 直接点 Deploy，1 分钟后会得到形如 `https://vibe-translate-xxx.vercel.app` 的链接。

### 方式 B：自定义域名
1. 在域名服务商（阿里云 / Cloudflare / Porkbun / Namecheap）添加 CNAME 记录：
   ```
   主机记录：translate（或 @）
   记录类型：CNAME
   记录值：cname.vercel-dns.com
   ```
2. 回到 Vercel 项目 → Settings → Domains → 输入 `translate.yourdomain.com` → Add。
3. Vercel 自动签发 Let's Encrypt SSL，国内浏览器即可 https 访问。

### 方式 C：本地预览
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出 dist/
npm run preview  # http://localhost:4173
```

## 🧩 技术架构

```
┌─────────────────────────── Browser SPA ───────────────────────────┐
│  React 18 + TypeScript + Vite 5 + Tailwind 3 + Zustand            │
│                                                                   │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │Upload│→│Parse│→│ OCR │→│ TM  │→│Glossary│→│Corpus│→│ LLM │    │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘    │
│                                                                   │
│  Export: MD | JSON | DOCX | PDF | PPTX                            │
└───────────────────────────────────────────────────────────────────┘
              │                │                │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │  OpenAI   │    │ DeepSeek  │    │   豆包    │
        │ Azure OCR │    │ Mathpix   │    │ AWS Textract
        └───────────┘    └───────────┘    └───────────┘
```

## 🔑 推荐的 API Key 顺序（成本从低到高）

1. **DeepSeek** — 性价比最高，中英文俱佳
2. **OpenAI gpt-4.1-mini** — 复杂句式最稳
3. **豆包** — 国内访问最快

> 把任意一个 Key 填到左侧「API Key」面板，翻译优先选 `auto` 即可自动按可用性降级。**未配置任何 Key 时会自动启用本地 Mock 翻译，演示永远可用。**

## 📂 目录结构

```
src/
├── components/        # 12 个组件，单文件 < 200 行
├── lib/
│   ├── translate.ts   # 统一翻译接口 + 多 Provider
│   ├── parsePptx.ts   # PPTX → 段落
│   ├── parsePdf.ts    # PDF → 段落
│   ├── ocr.ts         # OCR 适配器
│   ├── tm.ts          # 翻译记忆匹配
│   ├── corpus.ts      # 语料检索
│   ├── export.ts      # 5 种格式导出
│   └── speech.ts      # Web Speech API 包装
├── store/useApp.ts    # Zustand 全局状态
├── App.tsx · main.tsx · index.css
scripts/
└── build-deck.mjs     # 自动生成讲稿 PPT
```

## 🗣️ 配套 PPT

```bash
node scripts/build-deck.mjs
# → Vibe-Translate-讲稿.pptx
```

12 页讲稿：封面 · 目录 · 设计思路 · 技术架构 · 工作台 · 翻译记忆 · 语料 · 字幕 · 加 PI · 部署 · 心法复盘 · 致谢。

## 🛡️ 隐私声明

- 所有 API Key 仅保存在你的浏览器 `localStorage`，永远不会上传到任何服务器。
- 翻译记忆 / 术语库 / 语料库 / 任务历史同样仅本地存储。
- 应用不依赖任何后端，可离线运行翻译记忆检索和术语库强制替换。

## 📝 License

MIT · 2026
