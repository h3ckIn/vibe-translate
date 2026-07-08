// PPTX → text segments. PPTX is a zip of XML files; we extract slide texts.
import JSZip from 'jszip';
import type { DocSegment } from './types';

interface PptxExtract {
  fileBase64: string;
  segments: DocSegment[];
}

export async function parsePptx(file: File, signal?: AbortSignal): Promise<PptxExtract> {
  if (signal?.aborted) throw new Error('aborted');
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => naturalSlideOrder(a, b));
  const segments: DocSegment[] = [];
  let page = 0;
  for (const path of slideFiles) {
    if (signal?.aborted) throw new Error('aborted');
    page++;
    const xml = await zip.files[path].async('text');
    const texts = extractTextRuns(xml);
    if (texts.length === 0) {
      segments.push({ id: `${page}-empty`, page, source: '', status: 'pending' });
      continue;
    }
    // Group runs by paragraph; but we keep all text of a slide as a single segment for simplicity.
    const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) segments.push({ id: `${page}-1`, page, source: joined, status: 'pending' });
  }
  const fileBase64 = await bufToBase64(buf);
  return { fileBase64, segments };
}

function naturalSlideOrder(a: string, b: string) {
  return parseInt(a.match(/slide(\d+)/)![1], 10) - parseInt(b.match(/slide(\d+)/)![1], 10);
}

function extractTextRuns(xml: string): string[] {
  const out: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const v = decodeXml(m[1]).trim();
    if (v) out.push(v);
  }
  return out;
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
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
