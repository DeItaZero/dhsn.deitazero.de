import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { getExamString } from '../utils/utils';
import { ExamChange } from './file.utils';

export async function generateExamResultImage(
  change: ExamChange,
): Promise<Buffer> {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Chart Constants
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2.5;
  const barWidth = 80;
  const gap = (chartWidth - barWidth * 5) / 4;

  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  const moduleName = getExamString(change.exam);
  ctx.fillText(`Ergebnisse: ${moduleName}`, width / 2, padding - 10);

  // Calculate Max Y for scaling
  const maxCount = Math.max(...change.newDistribution.map((d) => d.COUNT), 5);
  const scale = chartHeight / (maxCount * 1.1);

  // Draw Bars
  change.newDistribution.forEach((dist, i) => {
    const x = padding + i * (barWidth + gap);
    const oldVal = change.oldDistribution ? change.oldDistribution[i].COUNT : 0;
    const diff = dist.COUNT - oldVal;

    const yBase = height - padding;
    const oldHeight = oldVal * scale;
    const diffHeight = diff * scale;

    // 1. Draw "Old" part (Sky Blue)
    ctx.fillStyle = 'skyblue';
    ctx.fillRect(x, yBase - oldHeight, barWidth, oldHeight);

    // 2. Draw "New" part (Orange) - only if there's a difference
    if (diff > 0) {
      ctx.fillStyle = 'orange';
      ctx.fillRect(x, yBase - oldHeight - diffHeight, barWidth, diffHeight);
    }

    // 3. Labels (Grade Text)
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.fillText(dist.GRADETEXT, x + barWidth / 2, yBase + 25);

    // 4. Value Labels on top
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      `${dist.COUNT} (+${diff})`,
      x + barWidth / 2,
      yBase - (oldHeight + diffHeight) - 5,
    );
  });

  // Simple Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = 'skyblue';
  ctx.fillRect(width - 150, 20, 15, 15);
  ctx.fillStyle = '#000';
  ctx.fillText('Alt', width - 125, 33);

  ctx.fillStyle = 'orange';
  ctx.fillRect(width - 80, 20, 15, 15);
  ctx.fillStyle = '#000';
  ctx.fillText('Neu', width - 55, 33);

  return canvas.toBuffer('image/png');
}
