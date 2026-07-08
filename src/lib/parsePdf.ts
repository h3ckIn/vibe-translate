// PDF → text segments. Uses pdfjs-dist (legacy build for broad browser support).
// We extract page text; if a page is image-only, we mark it as ocr-needed.
import type { DocSegment } from './types';

interface PdfExtract {
  fileBase64: string;
  segments: DocSegment[];
}

export async function parsePdf(file: File, signal?: AbortSignal): Promise<PdfExtract> {
  if (signal?.aborted) throw new Error('aborted');
  // Use pdfjs via CDN to keep bundle small & avoid SSR issues.
  const pdfjs = await loadPdfjs();
  if (signal?.aborted) throw new Error('aborted');
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const segments: DocSegment[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    if (signal?.aborted) throw new Error('aborted');
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = (content.items as { str: string }[]).map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    if (items) segments.push({ id: `${i}-1`, page: i, source: items, status: 'pending' });
    else segments.push({ id: `${i}-1`, page: i, source: `(image-only page ${i})`, status: 'pending' });
  }
  const fileBase64 = await bufToBase64(buf);
  return { fileBase64, segments };
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
  (window as any).__pdfjs = pdfjs;
  return pdfjs;
}

async function bufToBase64(buf: ArrayBuffer) {
  const u8 = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)) as number[]);
  }
  return btoa(bin);
}
