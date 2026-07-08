import type { OcrEngine } from './types';

export interface OcrResult {
  page: number;
  text: string;
}

export interface OcrConfig {
  apiKeys: {
    mathpix: string;
    azure: string;
    aws: string;
  };
  azureEndpoint?: string;
}

export async function runOcr(
  file: File,
  engine: OcrEngine,
  onProgress: (p: number) => void,
  config?: OcrConfig
): Promise<OcrResult[]> {
  const engines: OcrEngine[] = engine === 'auto' 
    ? ['local', 'mathpix', 'azure', 'aws'] 
    : [engine];

  for (const e of engines) {
    try {
      onProgress(0.1);
      const result = await runEngine(e, file, onProgress, config);
      if (result.length > 0 && result[0].text.trim()) {
        return result;
      }
    } catch (err) {
      console.warn(`OCR engine ${e} failed:`, err);
    }
  }

  return [
    {
      page: 1,
      text: '(OCR failed) 所有 OCR 引擎均失败，请检查 API Key 是否有效，或选择「仅文本」模式处理纯文本 PDF。',
    },
  ];
}

async function runEngine(
  engine: OcrEngine,
  file: File,
  onProgress: (p: number) => void,
  config?: OcrConfig
): Promise<OcrResult[]> {
  switch (engine) {
    case 'mathpix':
      return await runMathpix(file, onProgress, config?.apiKeys.mathpix);
    case 'azure':
      return await runAzure(file, onProgress, config?.apiKeys.azure, config?.azureEndpoint);
    case 'aws':
      return await runAws(file, onProgress, config?.apiKeys.aws);
    case 'local':
      return await runLocal(file, onProgress);
    case 'text':
    default:
      return [{ page: 1, text: '' }];
  }
}

async function runLocal(file: File, onProgress: (p: number) => void): Promise<OcrResult[]> {
  onProgress(0.05);
  const { createWorker } = await import('tesseract.js');
  
  // 加载 pdf.js
  const pdfjs = await loadPdfjs();
  onProgress(0.15);
  
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  onProgress(0.25);
  
  // 中英文混合识别（chi_sim=简体中文，eng=英文）
  const worker = await createWorker(['eng', 'chi_sim'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(0.3 + m.progress * 0.6);
      }
    },
  });

  try {
    const results: OcrResult[] = [];
    const scale = 3; // 3x 缩放大幅提高识别精度
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // 白色背景填充
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      
      // 图像预处理：增强对比度
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const processed = enhanceContrast(imageData);
      ctx.putImageData(processed, 0, 0);
      
      const imageBase64 = canvas.toDataURL('image/png');
      const { data: { text } } = await worker.recognize(imageBase64);
      
      results.push({ page: i, text: text.trim() });
      onProgress(0.3 + (i / doc.numPages) * 0.65);
    }
    
    await worker.terminate();
    onProgress(1);
    
    if (results.every(r => !r.text)) {
      return [{ page: 1, text: '(无法识别文本，请尝试使用云端 OCR 引擎)' }];
    }
    
    return results;
  } catch (e) {
    await worker.terminate().catch(() => {});
    console.error('local OCR error:', e);
    throw new Error('local OCR failed');
  }
}

// 增强对比度 + 灰度化，提升 Tesseract 识别准确率
function enhanceContrast(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // 灰度化
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // 对比度增强（1.5 倍）
    const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
    data[i] = data[i + 1] = data[i + 2] = enhanced;
  }
  return imageData;
}

async function loadPdfjs() {
  const w = window as any;
  if (w.__pdfjs) return w.__pdfjs;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('pdfjs load failed'));
    document.head.appendChild(s);
  });
  const pdfjs = (window as any).pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  w.__pdfjs = pdfjs;
  return pdfjs;
}

async function runMathpix(file: File, onProgress: (p: number) => void, apiKey?: string): Promise<OcrResult[]> {
  if (!apiKey) throw new Error('Mathpix API key missing');
  
  onProgress(0.2);
  const buffer = await file.arrayBuffer();
  const base64 = await arrayBufferToBase64(buffer);
  
  onProgress(0.5);
  const res = await fetch('https://api.mathpix.com/v3/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'app_id': 'app_id',
      'app_key': apiKey,
    },
    body: JSON.stringify({
      src: `data:application/pdf;base64,${base64}`,
      formats: ['text'],
      skip_recrop: true,
    }),
  });
  
  if (!res.ok) throw new Error(`Mathpix ${res.status}`);
  
  const data = await res.json();
  onProgress(1);
  
  return [{ page: 1, text: data.text || '' }];
}

async function runAzure(file: File, onProgress: (p: number) => void, apiKey?: string, endpoint?: string): Promise<OcrResult[]> {
  if (!apiKey) throw new Error('Azure API key missing');
  
  const url = (endpoint || 'https://api.cognitive.microsoft.com') + '/vision/v3.1/read/analyze';
  
  onProgress(0.2);
  const buffer = await file.arrayBuffer();
  
  onProgress(0.4);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/pdf',
    },
    body: buffer,
  });
  
  if (!res.ok) throw new Error(`Azure ${res.status}`);
  
  const opLoc = res.headers.get('Operation-Location');
  if (!opLoc) throw new Error('Azure operation location missing');
  
  onProgress(0.6);
  let result: any;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const statusRes = await fetch(opLoc, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    });
    result = await statusRes.json();
    if (result.status === 'succeeded') break;
    if (result.status === 'failed') throw new Error('Azure OCR failed');
    onProgress(0.6 + i * 0.02);
  }
  
  onProgress(1);
  
  if (!result?.analyzeResult?.readResults) {
    return [{ page: 1, text: '' }];
  }
  
  return result.analyzeResult.readResults.map((page: any, idx: number) => ({
    page: idx + 1,
    text: page.lines?.map((l: any) => l.text).join('\n') || '',
  }));
}

async function runAws(file: File, onProgress: (p: number) => void, apiKey?: string): Promise<OcrResult[]> {
  throw new Error('AWS Textract 需要安装 @aws-sdk/client-textract 依赖');
}

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const u8 = new Uint8Array(buffer);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)) as number[]);
  }
  return btoa(bin);
}
