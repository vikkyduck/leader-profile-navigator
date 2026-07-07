import jsPDF from 'jspdf';
import logoSrc from '@/assets/logo-bez-vody.png';
import { dejaVuSansBase64 } from './dejavu-sans-base64';

interface BlockStat {
  id: string;
  label: string;
  checked: number;
  total: number;
  pct: number;
}

interface PdfData {
  percentage: number;
  resultTitle: string;
  resultRange: string;
  resultDescription: string;
  totalChecked: number;
  totalCriteria: number;
  blockStats: BlockStat[];
  weakestBlock: BlockStat | null;
  weakestBlockQuestion: string;
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
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateResultsPdf(data: PdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register Cyrillic font
  doc.addFileToVFS('DejaVuSans.ttf', dejaVuSansBase64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Purple-gray color palette
  type RGB = [number, number, number];
  const primary: RGB = [100, 60, 180];      // deep purple
  const violet: RGB = [139, 92, 246];       // violet-500
  const slate: RGB = [100, 116, 139];       // slate-500
  const slateDark: RGB = [71, 85, 105];     // slate-600
  const gray: RGB = [107, 114, 128];
  const dark: RGB = [30, 27, 45];           // deep purple-gray
  const lightBg: RGB = [245, 243, 250];     // soft purple tint

  function getColorForPct(pct: number): RGB {
    if (pct >= 80) return primary;
    if (pct >= 60) return violet;
    if (pct >= 40) return slate;
    return slateDark;
  }

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // --- Logo ---
  try {
    const img = await loadImage(logoSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const logoData = canvas.toDataURL('image/png');
    const logoH = 12;
    const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
    doc.addImage(logoData, 'PNG', margin, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text('БЕЗ ВОДЫ', margin, y + 8);
    y += 14;
  }

  // --- Title ---
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...dark);
  doc.text('Результаты диагностики', margin, y + 8);
  y += 14;

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, margin, y + 4);
  y += 10;

  // --- Main result card ---
  const cardH = 38;
  const resultColor = getColorForPct(data.percentage);
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'F');
  doc.setDrawColor(...resultColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'S');

  // Result level title
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`${data.resultRange} «Да»`, margin + 6, y + 8);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...resultColor);
  doc.text(data.resultTitle, margin + 6, y + 18);

  // Stats
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Отмечено', margin + 6, y + 26);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.text(`${data.totalChecked}/${data.totalCriteria}`, margin + 6, y + 34);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Процент', margin + 50, y + 26);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...resultColor);
  doc.text(`${data.percentage}%`, margin + 50, y + 34);

  y += cardH + 8;

  // --- Description ---
  checkPageBreak(40);
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  const descParagraphs = data.resultDescription.split('\n\n');
  for (const para of descParagraphs) {
    const lines = wrapText(doc, para, contentWidth);
    checkPageBreak(lines.length * 4.5 + 4);
    for (const line of lines) {
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  }

  y += 4;

  // --- Block Results ---
  checkPageBreak(20);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.text('Результаты по блокам', margin, y);
  y += 8;

  // Separate into strengths and development areas
  const strengths = data.blockStats.filter(b => b.pct >= 60);
  const development = data.blockStats.filter(b => b.pct < 60);

  // --- Strengths ---
  if (strengths.length > 0) {
    checkPageBreak(14);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text('Сильные стороны', margin, y);
    y += 6;

    for (const block of strengths) {
      checkPageBreak(12);
      const barY = y;
      const barW = contentWidth - 50;
      const color = getColorForPct(block.pct);

      // Label
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(block.label, margin, barY + 4);

      // Stats
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(`${block.checked}/${block.total} (${block.pct}%)`, pageWidth - margin, barY + 4, { align: 'right' });

      // Bar background
      const barX = margin;
      const barTop = barY + 6;
      doc.setFillColor(230, 228, 240);
      doc.roundedRect(barX, barTop, barW, 3, 1.5, 1.5, 'F');

      // Bar fill
      doc.setFillColor(...color);
      const fillW = Math.max(1, (block.pct / 100) * barW);
      doc.roundedRect(barX, barTop, fillW, 3, 1.5, 1.5, 'F');

      y += 14;
    }
    y += 4;
  }

  // --- Development areas ---
  if (development.length > 0) {
    checkPageBreak(14);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...slate);
    doc.text('Сферы для развития', margin, y);
    y += 6;

    for (const block of development) {
      checkPageBreak(12);
      const barY = y;
      const barW = contentWidth - 50;
      const color = getColorForPct(block.pct);

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(block.label, margin, barY + 4);

      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(`${block.checked}/${block.total} (${block.pct}%)`, pageWidth - margin, barY + 4, { align: 'right' });

      const barX = margin;
      const barTop = barY + 6;
      doc.setFillColor(230, 228, 240);
      doc.roundedRect(barX, barTop, barW, 3, 1.5, 1.5, 'F');

      doc.setFillColor(...color);
      const fillW = Math.max(1, (block.pct / 100) * barW);
      doc.roundedRect(barX, barTop, fillW, 3, 1.5, 1.5, 'F');

      y += 14;
    }
    y += 4;
  }

  // --- Weakest block recommendation ---
  if (data.weakestBlock) {
    checkPageBreak(30);
    const recH = 28;
    doc.setFillColor(242, 238, 252); // soft purple bg
    doc.roundedRect(margin, y, contentWidth, recH, 3, 3, 'F');
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, recH, 3, 3, 'S');

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(`Ваш главный рычаг — «${data.weakestBlock.label}»`, margin + 5, y + 8);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    const qLines = wrapText(doc, data.weakestBlockQuestion, contentWidth - 10);
    let qY = y + 14;
    for (const line of qLines) {
      doc.text(line, margin + 5, qY);
      qY += 4;
    }

    y += recH + 8;
  }

  // --- Footer ---
  checkPageBreak(16);
  doc.setDrawColor(210, 205, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Диагностика «Голубой океан» · withoutwater.ru', margin, y);
  doc.text('БЕЗ ВОДЫ', pageWidth - margin, y, { align: 'right' });

  // Save
  doc.save('diagnostika-bez-vody.pdf');
}
