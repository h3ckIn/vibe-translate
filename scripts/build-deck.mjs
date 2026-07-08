// One-shot script to generate the Vibe Translate deck.
// Run with: node --experimental-vm-modules scripts/build-deck.mjs
import PptxGenJS from 'pptxgenjs';
import { writeFile } from 'node:fs/promises';

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'Vibe Translate · Vibe Coding Final';
pres.author = 'Vibe Coding Team';

const C = {
  paper: 'FBFBF4',
  canvas: 'F4F1E8',
  rule: 'E8E6DE',
  ink: '1C1C1C',
  brand: '1F7A5A',
  brandLight: 'D2E8DB',
  warn: 'E07A3F',
  ok: '3FB47B',
};

const FONT_TITLE = 'Calibri';
const FONT_BODY = 'Calibri';

const newSlide = (title, subtitle) => {
  const s = pres.addSlide();
  s.background = { color: C.paper };
  // top brand bar
  s.addShape('rect', { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: C.brand } });
  // title
  s.addText(title, {
    x: 0.6, y: 0.45, w: 12.0, h: 0.95,
    fontSize: 36, fontFace: FONT_TITLE, bold: true, color: C.ink,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 1.35, w: 12.0, h: 0.5,
      fontSize: 16, fontFace: FONT_BODY, color: C.brand,
    });
  }
  // footer
  s.addText('Vibe Translate · 2026', {
    x: 0.6, y: 7.05, w: 12.0, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY, color: '8C8A82',
  });
  return s;
};

const bullet = (s, x, y, w, h, items, opts = {}) => {
  s.addText(
    items.map((t) => ({
      text: typeof t === 'string' ? t : t.text,
      options: { bullet: typeof t === 'string' ? { code: '25CF' } : (t.bullet ?? { code: '25CF' }), ...(t.options || {}) },
    })),
    {
      x, y, w, h,
      fontSize: opts.fontSize ?? 16,
      fontFace: FONT_BODY,
      color: C.ink,
      paraSpaceAfter: 6,
      valign: 'top',
    }
  );
};

// ===== Slide 1: Cover =====
{
  const s = pres.addSlide();
  s.background = { color: C.paper };
  s.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: C.paper } });
  s.addShape('rect', { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: C.brand } });
  s.addText('Vibe', { x: 0.9, y: 2.1, w: 12.0, h: 1.4, fontSize: 96, bold: true, color: C.ink, fontFace: FONT_TITLE });
  s.addText('Translate', { x: 0.9, y: 3.3, w: 12.0, h: 1.0, fontSize: 60, color: C.brand, fontFace: FONT_TITLE, italic: true });
  s.addText('用 Vibe Coding 构建的浏览器 PPT / PDF 翻译工作台', {
    x: 0.9, y: 4.6, w: 12.0, h: 0.5, fontSize: 20, color: '4A4A4A', fontFace: FONT_BODY,
  });
  s.addText('翻译记忆库 · 语料库 · 实时字幕 · 多模型 API', {
    x: 0.9, y: 5.05, w: 12.0, h: 0.4, fontSize: 16, color: C.brand, fontFace: FONT_BODY,
  });
  s.addShape('line', { x: 0.9, y: 5.7, w: 4, h: 0, line: { color: C.ink, width: 1 } });
  s.addText('提交人 / 课程：Vibe Coding 期末作业  · 2026.06', {
    x: 0.9, y: 5.85, w: 12.0, h: 0.4, fontSize: 14, color: '6E6C66', fontFace: FONT_BODY,
  });
}

// ===== Slide 2: 目录 =====
{
  const s = newSlide('目录 · Agenda', '六大板块 · 总览整套系统的设计与实现');
  const items = [
    '① 设计思路：为什么做 Vibe Translate',
    '② 功能介绍：工作台 · 字幕 · 记忆 · 语料 · 术语 · 任务',
    '③ 翻译记忆库 (TM)：自动沉淀 · 相似度复用',
    '④ 语料库 (Corpus)：RAG 风格增强 · 内置行业示例',
    '⑤ 实时字幕：浏览器语音识别 + 翻译叠加',
    '⑥ 加 PI & 部署：自定义域名 + Vercel 一步上线',
  ];
  bullet(s, 0.8, 2.1, 11.7, 4.5, items, { fontSize: 20 });
  // decorative chips
  ['设计', '功能', '记忆', '语料', '字幕', '部署'].forEach((t, i) => {
    s.addShape('roundRect', {
      x: 0.8 + i * 1.95, y: 6.3, w: 1.75, h: 0.45,
      fill: { color: i === 0 ? C.brand : C.brandLight },
      line: { type: 'none' },
      rectRadius: 0.18,
    });
    s.addText(t, { x: 0.8 + i * 1.95, y: 6.3, w: 1.75, h: 0.45, fontSize: 12, color: i === 0 ? C.paper : C.brand, bold: true, align: 'center', valign: 'middle' });
  });
}

// ===== Slide 3: 设计思路 =====
{
  const s = newSlide('设计思路', '把繁琐的"上传→复制→翻译→回填"压缩到一个浏览器标签');
  s.addText('痛点', { x: 0.7, y: 2.0, w: 4, h: 0.5, fontSize: 18, bold: true, color: C.warn, fontFace: FONT_BODY });
  bullet(s, 0.7, 2.55, 4.2, 3.5, [
    'PPT/PDF 翻译需要在多工具间来回切换',
    '同一术语每次都译法不一致',
    '缺乏积累：每次都从零开始',
    '没有一键回写演示文稿的能力',
  ], { fontSize: 16 });

  s.addText('设计原则', { x: 5.5, y: 2.0, w: 4, h: 0.5, fontSize: 18, bold: true, color: C.brand, fontFace: FONT_BODY });
  bullet(s, 5.5, 2.55, 7.0, 3.5, [
    '零安装：纯前端 SPA，打开即用',
    '三段流水线：解析 → 记忆+术语 → 多模型 LLM',
    '多源 API 优先：auto 模式下按价格/质量自动降级',
    '数据本地化：API Key & 记忆库仅存浏览器',
    '可分享：可导出 MD/JSON/DOCX/PDF/原版 PPTX',
  ], { fontSize: 16 });

  s.addShape('roundRect', { x: 0.7, y: 6.0, w: 11.9, h: 0.8, fill: { color: C.brandLight }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Slogan  ▸  "Vibe Coding · 30 秒把英文 PPT 变成中文版"', {
    x: 0.7, y: 6.0, w: 11.9, h: 0.8, fontSize: 18, bold: true, color: C.brand, align: 'center', valign: 'middle',
  });
}

// ===== Slide 4: 技术架构 =====
{
  const s = newSlide('技术架构', 'React + Vite + Tailwind · 浏览器内运行的 6 段式翻译管线');
  // Boxes
  const boxes = [
    { x: 0.5, y: 2.2, w: 2.0, h: 1.2, t: '上传', d: 'PPTX / PDF' },
    { x: 2.7, y: 2.2, w: 2.0, h: 1.2, t: '解析', d: 'JSZip / PDF.js' },
    { x: 4.9, y: 2.2, w: 2.0, h: 1.2, t: 'OCR 兜底', d: 'Mathpix / Azure' },
    { x: 7.1, y: 2.2, w: 2.0, h: 1.2, t: 'TM + 术语', d: '本地查表' },
    { x: 9.3, y: 2.2, w: 2.0, h: 1.2, t: '语料 RAG', d: '关键词检索' },
    { x: 11.5, y: 2.2, w: 1.3, h: 1.2, t: 'LLM', d: 'OpenAI/DS' },
  ];
  boxes.forEach((b, i) => {
    s.addShape('roundRect', { x: b.x, y: b.y, w: b.w, h: b.h, fill: { color: i === 5 ? C.brand : C.brandLight }, line: { type: 'none' }, rectRadius: 0.08 });
    s.addText(b.t, { x: b.x, y: b.y + 0.1, w: b.w, h: 0.5, fontSize: 16, bold: true, color: i === 5 ? C.paper : C.brand, align: 'center' });
    s.addText(b.d, { x: b.x, y: b.y + 0.6, w: b.w, h: 0.4, fontSize: 11, color: i === 5 ? C.paper : '4A4A4A', align: 'center' });
    if (i < 5) {
      s.addShape('rightTriangle', { x: b.x + b.w + 0.05, y: b.y + 0.5, w: 0.1, h: 0.2, fill: { color: C.ink }, line: { type: 'none' }, rotate: 90 });
    }
  });

  // lower zone
  s.addText('持久层 · Browser', { x: 0.5, y: 4.0, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.brand });
  bullet(s, 0.5, 4.4, 5.5, 2.4, [
    'localStorage 存储 API Key / 偏好',
    'IndexedDB 缓存翻译记忆库',
    '所有数据不离开本机',
  ], { fontSize: 14 });

  s.addText('外部 LLM Provider', { x: 7.0, y: 4.0, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.brand });
  bullet(s, 7.0, 4.4, 6.0, 2.4, [
    'OpenAI (gpt-4.1-mini / 4o)',
    'DeepSeek (deepseek-chat)',
    '豆包 (doubao-1-5-pro)',
    '未配置 Key 时自动启用本地 Mock',
  ], { fontSize: 14 });
}

// ===== Slide 5: 工作台截图说明 =====
{
  const s = newSlide('工作台 · 截图解读', '三栏布局：左控制 · 右译文 · 底术语库');
  s.addShape('roundRect', { x: 0.7, y: 2.0, w: 5.5, h: 4.8, fill: { color: C.paper }, line: { color: C.rule, width: 1 }, rectRadius: 0.12 });
  s.addText('左栏 · 控制台', { x: 0.95, y: 2.15, w: 5, h: 0.4, fontSize: 16, bold: true, color: C.brand });
  bullet(s, 0.95, 2.6, 5.0, 4.0, [
    '上传卡片 · 拖拽 .pptx / .pdf',
    '语种胶囊：中↔英 / 日 / 韩',
    'OCR 引擎：自动 / Mathpix / Azure / AWS / 本地 / 仅文本',
    '翻译优先：auto / OpenAI / DeepSeek / 豆包',
    'API Key 面板：6 个供应商独立管理',
  ], { fontSize: 14 });

  s.addShape('roundRect', { x: 6.4, y: 2.0, w: 6.2, h: 4.8, fill: { color: C.paper }, line: { color: C.rule, width: 1 }, rectRadius: 0.12 });
  s.addText('右栏 · 译文预览', { x: 6.65, y: 2.15, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.brand });
  bullet(s, 6.65, 2.6, 5.6, 4.0, [
    '顶部 5 个导出按钮：MD / JSON / DOCX / PDF / PPTX',
    '段落筛选：全部 / 已完成 / 记忆复用 / LLM 生成',
    '每段标记：TM ✓ / LLM · 流式回显',
    '底部进度条：实时翻译进度',
  ], { fontSize: 14 });

  s.addText('底部全宽 · 术语库 / 翻译记忆 / 语料库 / 任务中心 / 实时字幕  ↗ 顶部 Tab 一键切换', {
    x: 0.7, y: 6.9, w: 12, h: 0.3, fontSize: 12, color: '6E6C66', italic: true,
  });
}

// ===== Slide 6: 翻译记忆库 =====
{
  const s = newSlide('翻译记忆库 · TM', '让"越用越准"成为产品的底层能力');
  bullet(s, 0.7, 2.0, 6.0, 4.5, [
    '每次翻译完成自动写入 {原文, 译文, 方向, 时间}',
    '下次翻译前先用 trigram-Jaccard 相似度匹配',
    '阈值 ≥ 0.78 直接复用，保证术语一致',
    '记忆可视化：表格 + 关键词检索',
    '一键清空 · 全部数据本地',
  ], { fontSize: 16 });

  // mock table
  const rows = [
    ['Welcome to Vibe Translate', '欢迎使用 Vibe 翻译', 'en→zh', 3],
    ['Quarterly revenue grew 12%', '季度营收同比增长 12%', 'en→zh', 5],
    ['Customer acquisition cost', '客户获取成本', 'en→zh', 2],
  ];
  s.addShape('roundRect', { x: 7.0, y: 2.0, w: 5.6, h: 4.5, fill: { color: C.paper }, line: { color: C.rule }, rectRadius: 0.1 });
  s.addText('记忆库样例', { x: 7.2, y: 2.1, w: 5.2, h: 0.4, fontSize: 14, bold: true, color: C.brand });
  s.addTable(
    [
      [
        { text: '原文', options: { bold: true, fill: { color: C.brandLight } } },
        { text: '译文', options: { bold: true, fill: { color: C.brandLight } } },
        { text: '方向', options: { bold: true, fill: { color: C.brandLight } } },
        { text: '使用', options: { bold: true, fill: { color: C.brandLight } } },
      ],
      ...rows.map((r) => r.map((c) => ({ text: c, options: { fontSize: 11 } }))),
    ],
    { x: 7.2, y: 2.6, w: 5.2, h: 3.5, fontFace: FONT_BODY, color: C.ink, border: { type: 'solid', color: C.rule, pt: 0.5 } }
  );
}

// ===== Slide 7: 语料库 =====
{
  const s = newSlide('语料库 · Corpus', '为 LLM 提供"风格"而非"答案"，避免逐字抄袭');
  bullet(s, 0.7, 2.0, 6.0, 4.5, [
    '内置 3 个行业语料：商务 / 学术 / 产品',
    '支持 CSV / JSONL 上传 · 每行 `en = zh`',
    '翻译时按 token 命中，作为风格参考注入 Prompt',
    '与"术语库强制替换"解耦，互不冲突',
    '删除 / 重命名 · 全部本地存储',
  ], { fontSize: 16 });

  s.addShape('roundRect', { x: 7.0, y: 2.0, w: 5.6, h: 4.5, fill: { color: C.canvas }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Prompt 注入示意', { x: 7.2, y: 2.1, w: 5.2, h: 0.4, fontSize: 14, bold: true, color: C.brand });
  s.addText(
    [
      { text: 'System: You are Vibe Translate…\n', options: { fontSize: 12, color: C.ink } },
      { text: 'System: Reference examples:\n', options: { fontSize: 12, color: C.brand, bold: true } },
      { text: '  Quarterly revenue grew by 12% YoY.\n  → 季度营收同比增长 12%。\n', options: { fontSize: 11, color: '4A4A4A' } },
      { text: '  Customer acquisition cost dropped.\n  → 客户获取成本显著下降。\n', options: { fontSize: 11, color: '4A4A4A' } },
      { text: '\nUser: Translate this slide…', options: { fontSize: 12, color: C.ink } },
    ],
    { x: 7.2, y: 2.6, w: 5.2, h: 3.8, fontFace: 'Consolas', valign: 'top' }
  );
}

// ===== Slide 8: 实时字幕 =====
{
  const s = newSlide('实时字幕 · Live Subtitle', '把演讲 / 课堂 / 会议实时双语化');
  bullet(s, 0.7, 2.0, 6.0, 4.5, [
    '基于浏览器原生 Web Speech API，零后端',
    '麦克风 → 实时识别 → 调 LLM 翻译 → 双语叠加',
    '可调字号 14-32 / 顶部或底部位置',
    '支持中 / 英 / 日 / 韩 四向互译',
    '未配置 API Key 时回退本地 Mock，演示永远可用',
  ], { fontSize: 16 });

  s.addShape('roundRect', { x: 7.0, y: 2.0, w: 5.6, h: 4.5, fill: { color: '111111' }, line: { type: 'none' }, rectRadius: 0.1 });
  s.addText('Welcome to our Q3 product roadmap review.', { x: 7.2, y: 2.4, w: 5.2, h: 0.6, fontSize: 18, color: 'FFFFFF', bold: true });
  s.addText('欢迎参加我们第三季度的产品路线图评审。', { x: 7.2, y: 3.0, w: 5.2, h: 0.6, fontSize: 18, color: '3FB47B' });
  s.addText('Today we will focus on platform stability…', { x: 7.2, y: 4.0, w: 5.2, h: 0.6, fontSize: 18, color: 'FFFFFF', bold: true });
  s.addText('今天我们将聚焦于平台稳定性……', { x: 7.2, y: 4.6, w: 5.2, h: 0.6, fontSize: 18, color: '3FB47B' });
  s.addText('●  LIVE · 12 FPS · 38dB', { x: 7.2, y: 5.6, w: 5.2, h: 0.4, fontSize: 12, color: 'E07A3F' });
}

// ===== Slide 9: 加 PI (添加 API Key) =====
{
  const s = newSlide('加 PI · 自带 API 自由切换', '所有 Key 仅存浏览器 localStorage，绝不上传');
  const providers = [
    { t: 'OpenAI', d: 'sk-…  ·  gpt-4.1-mini / 4o' },
    { t: 'DeepSeek', d: 'sk-…  ·  deepseek-chat' },
    { t: '豆包', d: '火山方舟 · doubao-1-5-pro' },
    { t: 'Mathpix', d: '公式 OCR 首选' },
    { t: 'Azure AI', d: 'Vision 文档 OCR' },
    { t: 'AWS Textract', d: '结构化抽取' },
  ];
  providers.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.7 + col * 4.0;
    const y = 2.1 + row * 1.6;
    s.addShape('roundRect', { x, y, w: 3.7, h: 1.3, fill: { color: C.paper }, line: { color: C.rule }, rectRadius: 0.1 });
    s.addText(p.t, { x: x + 0.2, y: y + 0.15, w: 3.3, h: 0.4, fontSize: 18, bold: true, color: C.brand });
    s.addText(p.d, { x: x + 0.2, y: y + 0.6, w: 3.3, h: 0.4, fontSize: 12, color: '4A4A4A' });
    s.addText('在左侧栏粘贴 Key 即可启用', { x: x + 0.2, y: y + 0.95, w: 3.3, h: 0.3, fontSize: 10, color: C.warn, italic: true });
  });
  s.addText('支持自定义 Base URL（企业代理 / 转发网关）', {
    x: 0.7, y: 5.6, w: 12, h: 0.4, fontSize: 14, color: C.ink, bold: true,
  });
}

// ===== Slide 10: 部署 =====
{
  const s = newSlide('部署 · Vercel + 自定义域名', '3 步上线 · 全球 CDN · 自动 HTTPS');
  // step 1
  s.addShape('roundRect', { x: 0.7, y: 2.0, w: 3.9, h: 4.6, fill: { color: C.paper }, line: { color: C.rule }, rectRadius: 0.1 });
  s.addText('① 推送代码', { x: 0.9, y: 2.15, w: 3.5, h: 0.5, fontSize: 18, bold: true, color: C.brand });
  s.addText(
    [
      { text: '$ git init\n', options: { fontSize: 12 } },
      { text: '$ git add .\n', options: { fontSize: 12 } },
      { text: '$ git commit -m "vibe translate v1"\n', options: { fontSize: 12 } },
      { text: '$ git remote add origin <repo>\n', options: { fontSize: 12 } },
      { text: '$ git push -u origin main\n', options: { fontSize: 12, color: C.brand, bold: true } },
    ],
    { x: 0.9, y: 2.7, w: 3.5, h: 3.5, fontFace: 'Consolas', color: C.ink, valign: 'top' }
  );

  // step 2
  s.addShape('roundRect', { x: 4.8, y: 2.0, w: 3.9, h: 4.6, fill: { color: C.paper }, line: { color: C.rule }, rectRadius: 0.1 });
  s.addText('② Vercel 导入', { x: 5.0, y: 2.15, w: 3.5, h: 0.5, fontSize: 18, bold: true, color: C.brand });
  bullet(s, 5.0, 2.7, 3.5, 3.5, [
    '打开 vercel.com → Import Project',
    '选择 GitHub 仓库',
    'Framework Preset = Vite',
    'Build = `npm run build`',
    'Output = `dist`',
    '点击 Deploy，1 分钟拿到 *.vercel.app 链接',
  ], { fontSize: 13 });

  // step 3
  s.addShape('roundRect', { x: 8.9, y: 2.0, w: 3.7, h: 4.6, fill: { color: C.paper }, line: { color: C.rule }, rectRadius: 0.1 });
  s.addText('③ 自定义域名', { x: 9.1, y: 2.15, w: 3.4, h: 0.5, fontSize: 18, bold: true, color: C.brand });
  bullet(s, 9.1, 2.7, 3.4, 3.5, [
    '阿里云 / Cloudflare / Porkbun 均可',
    '添加 CNAME → cname.vercel-dns.com',
    'Vercel → Settings → Domains 添加域名',
    '自动签发 Let\'s Encrypt 证书',
    '例：translate.yourdomain.com',
    '全球 CDN 加速 · 国内可备案',
  ], { fontSize: 13 });
}

// ===== Slide 11: Roadmap / Vibe Coding 心法 =====
{
  const s = newSlide('Vibe Coding · 心法复盘', '把"想法 → Demo → 部署"压缩到一晚');
  s.addText('我们做对了什么', { x: 0.7, y: 2.0, w: 5.5, h: 0.4, fontSize: 18, bold: true, color: C.brand });
  bullet(s, 0.7, 2.45, 5.7, 4.0, [
    '先 PRD / 技术架构，再写代码 · 减少返工',
    '纯前端架构 → Vercel 一键部署 → 自带域名',
    'Mock 翻译兜底：永远有可演示的体验',
    'LANG_PAIR、PROVIDER 等常量集中管理',
    'Zustand 单 store，把跨页状态压平',
  ], { fontSize: 15 });

  s.addText('可以继续做的事', { x: 6.7, y: 2.0, w: 6, h: 0.4, fontSize: 18, bold: true, color: C.warn });
  bullet(s, 6.7, 2.45, 6.0, 4.0, [
    '替换为向量库（FAISS-WASM）做 TM',
    '支持多人协作 · 团队共享术语库',
    '浏览器内 Whisper 提升字幕鲁棒性',
    '做 Chrome 插件版：右键图片即译',
    '导出对齐双语文档（双语对照 PDF）',
  ], { fontSize: 15 });
}

// ===== Slide 12: Thank You =====
{
  const s = pres.addSlide();
  s.background = { color: C.brand };
  s.addText('Thank you.', { x: 0.6, y: 2.6, w: 12.0, h: 1.4, fontSize: 96, bold: true, color: C.paper, fontFace: FONT_TITLE });
  s.addText('欢迎打开 translate.yourdomain.com 体验 · 期待你的第一条翻译记忆。', {
    x: 0.6, y: 4.2, w: 12.0, h: 0.6, fontSize: 22, color: C.paper,
  });
  s.addText('— Vibe Coding 2026', { x: 0.6, y: 5.0, w: 12.0, h: 0.5, fontSize: 18, color: C.brandLight, italic: true });
}

const buf = await pres.write({ outputType: 'arraybuffer' });
await writeFile('Vibe-Translate-讲稿.pptx', Buffer.from(buf));
console.log('PPT generated: Vibe-Translate-讲稿.pptx');
