import jsPDF from 'jspdf';
import logoSrc from '@/assets/logo-bez-vody.png';
import { dejaVuSansBase64 } from './dejavu-sans-base64';

export interface MotivationPdfRow {
  label: string;
  significance: number;
  enablement: number;
}

export interface MotivationPdfData {
  title: string;
  subtitle: string;
  rows: MotivationPdfRow[];
  seriesALabel: string;
  seriesBLabel: string;
  /** Для командной выгрузки: сколько анкет сформировали средние */
  responses?: number;
  teamCode?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (doc.getTextWidth(test) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateMotivationPdf(data: MotivationPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.addFileToVFS('DejaVuSans.ttf', dejaVuSansBase64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  type RGB = [number, number, number];
  const primary: RGB = [100, 60, 180];
  const violet: RGB = [139, 92, 246];
  const gray: RGB = [107, 114, 128];
  const dark: RGB = [30, 27, 45];
  const lightBg: RGB = [245, 243, 250];

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  try {
    const img = await loadImage(logoSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    const logoH = 12;
    const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text('БЕЗ ВОДЫ', margin, y + 8);
    y += 14;
  }

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...dark);
  doc.text(data.title, margin, y + 8);
  y += 13;

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  const meta = [data.subtitle, `Дата: ${new Date().toLocaleDateString('ru-RU')}`];
  if (data.teamCode) meta.push(`Код: ${data.teamCode}`);
  if (data.responses !== undefined) meta.push(`Анкет: ${data.responses}`);
  doc.text(meta.join('  ·  '), margin, y + 4);
  y += 12;

  // --- Сводка ---
  const avg = (pick: (r: MotivationPdfRow) => number) =>
    data.rows.reduce((s, r) => s + pick(r), 0) / data.rows.length;
  const avgA = avg((r) => r.significance);
  const avgB = avg((r) => r.enablement);

  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(data.seriesALabel, margin + 6, y + 7);
  doc.text(data.seriesBLabel, margin + contentWidth / 2 + 6, y + 7);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(avgA.toFixed(1), margin + 6, y + 15);
  doc.setTextColor(...violet);
  doc.text(avgB.toFixed(1), margin + contentWidth / 2 + 6, y + 15);
  y += 27;

  // --- Таблица ---
  const colGap = 22;
  const colB = 22;
  const colA = 22;
  const labelWidth = contentWidth - colA - colB - colGap;

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Мотив', margin, y);
  doc.text(data.seriesALabel, margin + labelWidth, y, { align: 'right' });
  doc.text(data.seriesBLabel, margin + labelWidth + colA, y, { align: 'right' });
  doc.text('Разрыв', margin + labelWidth + colA + colB, y, { align: 'right' });
  y += 3;
  doc.setDrawColor(220, 218, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFontSize(9);
  for (const row of data.rows) {
    doc.setFont('DejaVuSans', 'normal');
    const lines = wrapText(doc, row.label, labelWidth - 4);
    const rowH = Math.max(lines.length * 4.5, 6);
    checkPageBreak(rowH + 4);

    doc.setTextColor(...dark);
    lines.forEach((line, i) => doc.text(line, margin, y + i * 4.5));

    const gap = row.significance - row.enablement;
    doc.setFont('DejaVuSans', 'bold');
    doc.setTextColor(...primary);
    doc.text(row.significance.toFixed(1), margin + labelWidth, y, { align: 'right' });
    doc.setTextColor(...violet);
    doc.text(row.enablement.toFixed(1), margin + labelWidth + colA, y, { align: 'right' });
    doc.setTextColor(...(gap > 0 ? primary : gray));
    doc.text(
      `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`,
      margin + labelWidth + colA + colB,
      y,
      { align: 'right' }
    );

    y += rowH + 2;
    doc.setDrawColor(235, 233, 242);
    doc.line(margin, y - 1.5, margin + contentWidth, y - 1.5);
  }

  y += 4;
  checkPageBreak(14);
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  const note = wrapText(
    doc,
    'Разрыв — это значимость мотива минус то, насколько компания даёт его реализовать. Положительное значение означает дефицит: мотив важен, но не находит опоры в работе.',
    contentWidth
  );
  note.forEach((line, i) => doc.text(line, margin, y + i * 4));

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`motivaciya-${data.teamCode ?? 'lichnyy'}-${stamp}.pdf`);
}
