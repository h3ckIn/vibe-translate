import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import type { DocSegment, TaskRecord } from './types';

export function toMarkdown(segments: DocSegment[]): string {
  return segments
    .map((s) => `## Slide ${s.page}\n\n${s.target || s.source}`)
    .join('\n\n---\n\n');
}

export function toJSON(segments: DocSegment[]): string {
  return JSON.stringify(segments, null, 2);
}

export function downloadFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportMarkdown(task: TaskRecord) {
  const blob = new Blob([toMarkdown(task.segments)], { type: 'text/markdown;charset=utf-8' });
  downloadFile(`${task.name}.md`, blob);
}

export function exportJSON(task: TaskRecord) {
  const blob = new Blob([toJSON(task.segments)], { type: 'application/json' });
  downloadFile(`${task.name}.json`, blob);
}

export function exportPDF(task: TaskRecord) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const w = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(task.name, margin, y);
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const s of task.segments) {
    const heading = `Slide ${s.page}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    if (y > 780) {
      doc.addPage();
      y = margin;
    }
    doc.text(heading, margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const body = s.target || s.source;
    const lines = doc.splitTextToSize(body, w);
    for (const line of lines) {
      if (y > 800) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    }
    y += 10;
  }
  doc.save(`${task.name}.pdf`);
}

export async function exportDOCX(task: TaskRecord) {
  // Build a minimal .docx by writing OOXML directly (no dep on docx package to save bytes).
  const segs = task.segments.map((s) => ({
    page: s.page,
    text: s.target || s.source,
  }));
  const docXml = buildDocxXml(segs);
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CT_XML);
  zip.file('_rels/.rels', RELS_XML);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', DOC_RELS_XML);
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadFile(`${task.name}.docx`, blob);
}

export async function exportPPTX(task: TaskRecord) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = task.name;
  for (const s of task.segments) {
    const slide = pres.addSlide();
    slide.background = { color: 'FBFBF4' };
    slide.addText(`#${s.page}`, { x: 0.5, y: 0.2, fontSize: 12, color: '1F7A5A', bold: true });
    const body = (s.target || s.source).split('\n').map((t) => ({ text: t, options: { breakLine: true } }));
    slide.addText(body as any, { x: 0.5, y: 0.7, w: 12.3, h: 6.0, fontSize: 22, color: '1C1C1C', fontFace: 'Inter' });
  }
  await pres.writeFile({ fileName: `${task.name}-translated.pptx` });
}

const CT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

function buildDocxXml(segs: { page: number; text: string }[]): string {
  const paragraphs = segs
    .map(
      (s) => `
<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">Slide ${s.page}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">${escapeXml(s.text)}</w:t></w:r></w:p>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${paragraphs}</w:body>
</w:document>`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
