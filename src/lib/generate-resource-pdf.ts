import jsPDF from 'jspdf';
import logoSrc from '@/assets/logo-bez-vody.png';
import { dejaVuSansBase64 } from './dejavu-sans-base64';
import type { ArchetypeInfo } from '@/data/resource-radar';

interface BlockStat {
  id: string;
  label: string;
  checked: number;
  total: number;
  pct: number;
}

interface TeamBlockStat {
  id: string;
  label: string;
  pct: number;
}

interface ResourceRadarPdfData {
  archetypes: ArchetypeInfo[];
  blockStats: BlockStat[];
  totalChecked: number;
  totalCriteria: number;
  overallPct: number;
  teamId: string;
  teamResponseCount: number;
  teamBlockStats: TeamBlockStat[]; // empty if no team
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
    if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateResourceRadarPdf(data: ResourceRadarPdfData): Promise<void> {
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

  function getLeakColor(pct: number): RGB {
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
  doc.text('Карта ваших ресурсов', margin, y + 8);
  y += 14;

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text('Тонус-менеджмент · что забирает мой ресурс', margin, y + 4);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth - margin, y + 4, {
    align: 'right',
  });
  y += 10;

  // --- Archetype header card (single or dual) ---
  const primary0 = data.archetypes[0];
  const hasDual = data.archetypes.length > 1;

  if (primary0) {
    const cardH = hasDual ? 38 : 42;
    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'F');
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'S');

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(hasDual ? 'Ваши архетипы' : 'Ваш архетип', margin + 6, y + 8);

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(hasDual ? 15 : 18);
    doc.setTextColor(...primary);
    const namesLine = data.archetypes.map((a) => a.name).join(' + ');
    doc.text(namesLine, margin + 6, y + 18);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    const taglineText = hasDual
      ? 'Двойной источник ресурса — оба профиля важны для восстановления'
      : primary0.tagline;
    const taglineLines = wrapText(doc, taglineText, contentWidth - 12);
    let tY = y + 25;
    for (const line of taglineLines) {
      doc.text(line, margin + 6, tY);
      tY += 4.5;
    }

    // Stats row
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Отмечено', margin + 6, y + cardH - 4);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text(`${data.totalChecked}/${data.totalCriteria}`, margin + 28, y + cardH - 4);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('Сила сигнала', margin + 60, y + cardH - 4);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(`${data.overallPct}%`, margin + 84, y + cardH - 4);

    y += cardH + 8;
  }

  // --- Per-archetype full description (loop) ---
  for (let aIdx = 0; aIdx < data.archetypes.length; aIdx++) {
    const archetype = data.archetypes[aIdx];

    if (hasDual) {
      checkPageBreak(14);
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...primary);
      doc.text(`${aIdx + 1}. ${archetype.name}`, margin, y);
      y += 6;
    }

    // Uniqueness
    checkPageBreak(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text('Ваша уникальность', margin, y);
    y += 6;

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const uLines = wrapText(doc, archetype.uniqueness, contentWidth);
    for (const line of uLines) {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 5;

    // Why drains
    checkPageBreak(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text('Почему вы «гаснете»', margin, y);
    y += 6;

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const dLines = wrapText(doc, archetype.whyDrains, contentWidth);
    for (const line of dLines) {
      checkPageBreak(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 5;

    // Recovery
    checkPageBreak(20);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text('Экологичное восстановление', margin, y);
    y += 6;

    for (const r of archetype.recovery) {
      checkPageBreak(20);
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(`• ${r.title}`, margin, y);
      y += 5;

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      const rLines = wrapText(doc, r.text, contentWidth - 4);
      for (const line of rLines) {
        checkPageBreak(5);
        doc.text(line, margin + 4, y);
        y += 4.5;
      }
      y += 4;
    }

    // Early warnings
    if (archetype.earlyWarnings) {
      checkPageBreak(30);
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primary);
      doc.text('Карта сигналов: пора восстановиться', margin, y);
      y += 5;

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(
        `Маркеры раннего оповещения · ${archetype.earlyWarnings.level}`,
        margin,
        y,
      );
      y += 6;

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      for (const sig of archetype.earlyWarnings.signals) {
        const lines = wrapText(doc, `• ${sig}`, contentWidth - 4);
        const blockH = lines.length * 4.5 + 2;
        checkPageBreak(blockH);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], i === 0 ? margin : margin + 4, y);
          y += 4.5;
        }
        y += 1.5;
      }
      y += 4;
    }
  }

  // --- Personal block stats ---
  checkPageBreak(20);
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text('Источники энергии по блокам', margin, y);
  y += 4;
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Чем выше процент — тем сильнее блок влияет на ваш ресурс', margin, y + 4);
  y += 9;

  for (const block of data.blockStats) {
    drawBar(
      block.label,
      block.pct,
      `${block.checked}/${block.total} (${block.pct}%)`,
      getLeakColor(block.pct),
    );
  }
  y += 4;

  // --- Team portrait ---
  if (data.teamId && data.teamResponseCount > 0 && data.teamBlockStats.length > 0) {
    checkPageBreak(30);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text('Командный портрет', margin, y);
    y += 4;
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    const memberWord =
      data.teamResponseCount === 1 ? 'участник' : 'участников';
    doc.text(
      `Команда «${data.teamId}» · ${data.teamResponseCount} ${memberWord}`,
      margin,
      y + 4,
    );
    y += 9;

    for (const block of data.teamBlockStats) {
      drawBar(block.label, block.pct, `${block.pct}%`, getLeakColor(block.pct));
    }
    y += 4;
  }

  // --- Footer on every page ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(210, 205, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('Тонус-менеджмент · withoutwater.ru', margin, pageHeight - 9);
    doc.text(`Стр. ${i} из ${pageCount}`, pageWidth - margin, pageHeight - 9, {
      align: 'right',
    });
  }

  doc.save('karta-resursov.pdf');
}
