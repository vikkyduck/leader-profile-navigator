import jsPDF from 'jspdf';
import logoSrc from '@/assets/logo-bez-vody.png';
import { dejaVuSansBase64 } from './dejavu-sans-base64';

interface EdTechRiskItem {
  label: string;
  description: string;
  isChecked: boolean;
}

interface EdTechTeamStat {
  label: string;
  pct: number;
}

interface EdTechRiskPdfData {
  levelTitle: string;
  levelTagline: string;
  levelDescription: string;
  checkedCount: number;
  total: number;
  items: EdTechRiskItem[];
  teamId: string;
  teamResponseCount: number;
  teamStats: EdTechTeamStat[]; // empty if no team
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
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (doc.getTextWidth(test) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateEdTechRiskPdf(data: EdTechRiskPdfData): Promise<void> {
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
  const slate: RGB = [100, 116, 139];
  const gray: RGB = [107, 114, 128];
  const dark: RGB = [30, 27, 45];
  const lightBg: RGB = [245, 243, 250];
  const softBar: RGB = [230, 228, 240];
  const softMuted: RGB = [246, 246, 250];

  function getBarColor(pct: number): RGB {
    if (pct >= 70) return primary;
    if (pct >= 40) return violet;
    return slate;
  }

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function drawBar(label: string, pct: number, sub: string, color: RGB) {
    checkPageBreak(14);
    const barY = y;
    const barW = contentWidth - 50;

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(label, margin, barY + 4);

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(sub, pageWidth - margin, barY + 4, { align: 'right' });

    const barTop = barY + 6;
    doc.setFillColor(...softBar);
    doc.roundedRect(margin, barTop, barW, 3, 1.5, 1.5, 'F');

    doc.setFillColor(...color);
    const fillW = Math.max(1, (pct / 100) * barW);
    doc.roundedRect(margin, barTop, fillW, 3, 1.5, 1.5, 'F');

    y += 13;
  }

  function drawItemCard(item: EdTechRiskItem, accent: RGB, bg: RGB, marker: string) {
    const titleLines = wrapText(doc, `${marker} ${item.label}`, contentWidth - 8);
    const descLines = (() => {
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(9.5);
      return wrapText(doc, item.description, contentWidth - 8);
    })();
    const cardH = 6 + titleLines.length * 5 + 2 + descLines.length * 4.5 + 5;
    checkPageBreak(cardH + 2);

    doc.setFillColor(...bg);
    doc.roundedRect(margin, y, contentWidth, cardH, 2.5, 2.5, 'F');
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, cardH, 2.5, 2.5, 'S');

    let ty = y + 6;
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    for (const line of titleLines) {
      doc.text(line, margin + 4, ty);
      ty += 5;
    }
    ty += 1;

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    for (const line of descLines) {
      doc.text(line, margin + 4, ty);
      ty += 4.5;
    }

    y += cardH + 3;
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
  doc.setFontSize(20);
  doc.setTextColor(...dark);
  doc.text('Ваш потенциал устойчивости', margin, y + 8);
  y += 14;

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text('EdTech Risk Management Radar', margin, y + 4);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth - margin, y + 4, {
    align: 'right',
  });
  y += 10;

  // --- Level card ---
  const cardH = 42;
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'F');
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'S');

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(data.levelTagline, margin + 6, y + 8);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...primary);
  doc.text(data.levelTitle, margin + 6, y + 18);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Опоры устойчивости', margin + 6, y + cardH - 4);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`${data.checkedCount}/${data.total}`, margin + 46, y + cardH - 4);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Зоны уязвимости', margin + 78, y + cardH - 4);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primary);
  doc.text(`${data.total - data.checkedCount}/${data.total}`, margin + 116, y + cardH - 4);

  y += cardH + 8;

  // --- Level description ---
  const paragraphs = data.levelDescription.split('\n\n');
  for (const p of paragraphs) {
    const lines = (() => {
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(10);
      return wrapText(doc, p, contentWidth);
    })();
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    for (const line of lines) {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 3;
  }
  y += 3;

  // --- Supports ---
  const supports = data.items.filter((i) => i.isChecked);
  const gaps = data.items.filter((i) => !i.isChecked);

  if (supports.length > 0) {
    checkPageBreak(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text(`Ваши опоры устойчивости · ${supports.length}`, margin, y);
    y += 4;
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(
      'На эти практики можно опереться, когда внешние условия перестанут быть предсказуемыми',
      margin,
      y + 4,
    );
    y += 9;

    for (const s of supports) {
      drawItemCard(s, primary, lightBg, '✓');
    }
    y += 2;
  }

  // --- Gaps ---
  if (gaps.length > 0) {
    checkPageBreak(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text(`Зоны уязвимости · ${gaps.length}`, margin, y);
    y += 4;
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    const subLines = wrapText(
      doc,
      'Пропущенные утверждения — места, где стресс покажет трещину раньше всего. Даже 1–2 закрытых пункта заметно поднимают устойчивость.',
      contentWidth,
    );
    for (const line of subLines) {
      doc.text(line, margin, y + 4);
      y += 4;
    }
    y += 6;

    for (const g of gaps) {
      drawItemCard(g, slate, softMuted, '·');
    }
    y += 2;
  }

  // --- Team portrait ---
  if (data.teamId && data.teamResponseCount > 0 && data.teamStats.length > 0) {
    checkPageBreak(30);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text('Командный портрет устойчивости', margin, y);
    y += 4;
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    const memberWord = data.teamResponseCount === 1 ? 'участник' : 'участников';
    doc.text(
      `Команда «${data.teamId}» · ${data.teamResponseCount} ${memberWord}`,
      margin,
      y + 4,
    );
    y += 9;

    for (const stat of data.teamStats) {
      drawBar(stat.label, stat.pct, `${stat.pct}%`, getBarColor(stat.pct));
    }
    y += 4;
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(210, 205, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('EdTech Risk Management Radar · radars.tools', margin, pageHeight - 9);
    doc.text(`Стр. ${i} из ${pageCount}`, pageWidth - margin, pageHeight - 9, {
      align: 'right',
    });
  }

  doc.save('edtech-risk-radar.pdf');
}
