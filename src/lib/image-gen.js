import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// ── Content parser ────────────────────────────────────────────

export function parsePostForImage(content, title) {
  let headline = '';
  const hookPatterns = [
    /(?:HOOK|Hook)[:\s*]+[""]?(.+?)[""]?(?:\n|$)/i,
    /###\s+\*\*Hook[:\s]+\*\*\s*\n[""]?(.+?)[""]?(?:\n|$)/i,
    /\*\*HOOK\*\*\s*\n(.+?)(?:\n|$)/i,
  ];
  for (const re of hookPatterns) {
    const m = content.match(re);
    if (m) { headline = m[1].replace(/["""*]/g, '').trim(); break; }
  }
  if (!headline) {
    const lines = content.split('\n').map(l => l.replace(/^[#*>\-•\s]+/, '').trim());
    headline = lines.find(l => l.length > 30 && !/^(Hook|Body|CTA|Flip|Visual|Generated|Research|Sophie)/i.test(l)) || title;
  }
  if (headline.length > 120) headline = headline.slice(0, 117) + '…';

  const bullets = [];
  const bulletRe = /^[\s]*(?:[•\-\*]|\d+[.):]|Step\s+\d+[.:])\s+\*{0,2}(.+?)\*{0,2}$/gm;
  let m;
  while ((m = bulletRe.exec(content)) !== null && bullets.length < 3) {
    const line = m[1].replace(/\*\*/g, '').trim();
    if (line.length > 10 && line.length < 120) bullets.push(line);
  }
  if (bullets.length === 0) {
    const boldRe = /\*\*(.+?)\*\*/g;
    while ((m = boldRe.exec(content)) !== null && bullets.length < 3) {
      const line = m[1].trim();
      if (line.length > 15 && line.length < 100 && !line.startsWith('##')) bullets.push(line);
    }
  }
  if (bullets.length === 0) {
    bullets.push('Legal tax reduction strategies for high-income earners');
    bullets.push('Entity structuring that protects and grows your wealth');
  }

  return { headline, bullets, title };
}

// ── Text wrap helper ──────────────────────────────────────────

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── SVG builder ───────────────────────────────────────────────

function buildSvg(parsed, width, height) {
  const { headline, bullets } = parsed;

  const pad = Math.round(width * 0.08);
  const innerW = width - pad * 2;

  // Font sizes
  const badgeFs   = Math.round(width * 0.018);
  const headlineFs = Math.round(width * 0.048);
  const bulletFs   = Math.round(width * 0.026);
  const footerFs   = Math.round(width * 0.020);
  const brandFs    = Math.round(width * 0.023);

  // Headline wrap: ~22 chars per line at 1200px
  const headlineCharsPerLine = Math.round(innerW / (headlineFs * 0.55));
  const headlineLines = wrapText(headline, headlineCharsPerLine);

  // Bullet wrap
  const bulletCharsPerLine = Math.round((innerW - 36) / (bulletFs * 0.56));

  // Layout Y positions
  const barH    = 6;
  const topBarY = 0;
  const badgeY  = barH + pad * 0.7;
  const headlineStartY = badgeY + badgeFs + pad * 0.6;
  const headlineLH = headlineFs * 1.32;
  const headlineEndY = headlineStartY + headlineLines.length * headlineLH;
  const dividerY = headlineEndY + pad * 0.4;
  const bulletStartY = dividerY + pad * 0.45;
  const bulletLH = bulletFs * 1.5;

  // Calculate total bullet block height
  const bulletBlocks = bullets.map(b => wrapText(b, bulletCharsPerLine));
  const totalBulletH = bulletBlocks.reduce((acc, lines) => acc + lines.length * bulletLH + 6, 0);

  const footerY = height - pad * 0.6 - barH;

  // Build headline tspans
  const headlineTspans = headlineLines.map((ln, i) =>
    `<tspan x="${pad}" dy="${i === 0 ? '0' : headlineLH}">${escapeXml(ln)}</tspan>`
  ).join('');

  // Build bullet elements
  let bulletY = bulletStartY;
  const bulletElems = bulletBlocks.map((lines, bi) => {
    const arrowX = pad;
    const textX  = pad + 30;
    const startY = bulletY;
    const tspans = lines.map((ln, li) =>
      `<tspan x="${textX}" dy="${li === 0 ? '0' : bulletLH}">${escapeXml(ln)}</tspan>`
    ).join('');
    bulletY += lines.length * bulletLH + 6;
    return `
    <text x="${arrowX}" y="${startY}" font-family="Arial,sans-serif" font-size="${bulletFs}" fill="#7B8C3F" font-weight="700">→</text>
    <text x="${textX}" y="${startY}" font-family="Arial,sans-serif" font-size="${bulletFs}" fill="#2a3a52">${tspans}</text>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#F7F3EC"/>

  <!-- Top accent bar -->
  <rect x="0" y="${topBarY}" width="${width}" height="${barH}" fill="#7B8C3F"/>

  <!-- Badge -->
  <text x="${pad}" y="${badgeY + badgeFs}"
    font-family="Arial,sans-serif" font-size="${badgeFs}" font-weight="700"
    letter-spacing="2" fill="#7B8C3F" text-transform="uppercase">TAX STRATEGY · SOPHIE NGUYEN</text>

  <!-- Headline -->
  <text x="${pad}" y="${headlineStartY + headlineFs * 0.85}"
    font-family="Georgia,'Times New Roman',serif" font-size="${headlineFs}"
    font-weight="400" fill="#1a2436" line-height="${headlineLH}">
    ${headlineTspans}
  </text>

  <!-- Divider -->
  <rect x="${pad}" y="${dividerY}" width="${innerW}" height="1" fill="#1a2436" opacity="0.15"/>

  <!-- Bullets -->
  ${bulletElems}

  <!-- Footer divider -->
  <rect x="${pad}" y="${footerY - footerFs * 2.2}" width="${innerW}" height="1" fill="#1a2436" opacity="0.1"/>

  <!-- Footer left: Name + role -->
  <text x="${pad}" y="${footerY - footerFs * 0.9}"
    font-family="Arial,sans-serif" font-size="${footerFs}" font-weight="700" fill="#1a2436">Sophie Nguyen</text>
  <text x="${pad}" y="${footerY}"
    font-family="Arial,sans-serif" font-size="${Math.round(footerFs * 0.82)}" fill="#666666">Tax Strategist · Paramount Tax Richardson</text>

  <!-- Footer right: Brand -->
  <text x="${width - pad}" y="${footerY - Math.round(footerFs * 0.3)}"
    font-family="Arial,sans-serif" font-size="${brandFs}" font-weight="700"
    fill="#7B8C3F" text-anchor="end">sophie.so</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="${height - barH}" width="${width}" height="${barH}" fill="#7B8C3F"/>
</svg>`;
}

// ── Public API ────────────────────────────────────────────────

export async function generateImages(parsed, index) {
  const squareDir   = path.join(ROOT, 'output', 'images', 'linkedin');
  const portraitDir = path.join(ROOT, 'output', 'images', 'instagram');
  fs.mkdirSync(squareDir,   { recursive: true });
  fs.mkdirSync(portraitDir, { recursive: true });

  const slug = `post-${index}`;
  const squarePath   = path.join(squareDir,   `${slug}-square.png`);
  const portraitPath = path.join(portraitDir, `${slug}-portrait.png`);

  const squareSvg   = buildSvg(parsed, 1200, 1200);
  const portraitSvg = buildSvg(parsed, 1080, 1350);

  await sharp(Buffer.from(squareSvg))
    .png()
    .toFile(squarePath);

  await sharp(Buffer.from(portraitSvg))
    .png()
    .toFile(portraitPath);

  return {
    square:   `/images/linkedin/${slug}-square.png`,
    portrait: `/images/instagram/${slug}-portrait.png`,
  };
}

// No-op for backwards compatibility (was used to close Puppeteer browser)
export async function closeBrowser() {}
