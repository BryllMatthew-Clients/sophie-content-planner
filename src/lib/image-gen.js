import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kvSet, kvGet } from './kv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// ── Brand tokens ──────────────────────────────────────────────
const NAVY  = '#0A1628';
const GOLD  = '#C9A84C';
const WHITE = '#FFFFFF';
const GOLD_DIM = '#8B6B2A';

// ── Content parser ─────────────────────────────────────────────

export function parsePostForImage(content, title) {
  // Headline from hook
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
  if (headline.length > 110) headline = headline.slice(0, 107) + '…';

  // Bullets
  const bullets = [];
  const bulletRe = /^[\s]*(?:[•\-\*]|\d+[.):]|Step\s+\d+[.:])\s+\*{0,2}(.+?)\*{0,2}$/gm;
  let m;
  while ((m = bulletRe.exec(content)) !== null && bullets.length < 3) {
    const line = m[1].replace(/\*\*/g, '').trim();
    if (line.length > 10 && line.length < 100) bullets.push(line);
  }
  if (bullets.length === 0) {
    const boldRe = /\*\*(.+?)\*\*/g;
    while ((m = boldRe.exec(content)) !== null && bullets.length < 3) {
      const line = m[1].trim();
      if (line.length > 15 && line.length < 100 && !line.startsWith('##')) bullets.push(line);
    }
  }
  if (bullets.length === 0) {
    bullets.push('Legal strategies most CPAs never mention');
    bullets.push('Entity structures that protect and grow wealth');
  }

  // CTA — prefer explicitly labelled section, fall back to short default
  let cta = 'DM "STRATEGY" for a free consult';
  const ctaPatterns = [
    /(?:CTA|Call.to.Action)[:\s*]+[""]?(.+?)[""]?(?:\n|$)/i,
    /\*\*CTA\*\*[:\s]*\n(.+?)(?:\n|$)/i,
  ];
  for (const re of ctaPatterns) {
    const cm = content.match(re);
    if (cm?.[1]) {
      const candidate = cm[1].replace(/["""*]/g, '').trim();
      if (candidate.length > 5) { cta = candidate; break; }
    }
  }
  if (cta.length > 42) cta = cta.slice(0, 39) + '…';

  return { headline, bullets, cta, title };
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
  const { headline, bullets, cta } = parsed;

  const pad  = Math.round(width * 0.08);
  const padR = Math.round(width * 0.07);
  const innerW = width - pad - padR;

  // Font sizes
  const badgeFs    = Math.round(width * 0.017);
  const headlineFs = Math.round(width * (headline.length < 50 ? 0.056 : headline.length < 80 ? 0.046 : 0.038));
  const bulletFs   = Math.round(width * 0.025);
  const ctaFs      = Math.round(width * 0.024);
  const footerFs   = Math.round(width * 0.019);

  // Headline wrap — use 0.62 ratio for Arial Black (wide bold font)
  const hlChars = Math.round(innerW / (headlineFs * 0.62));
  const headlineLines = wrapText(headline, hlChars);
  const headlineLH = headlineFs * 1.28;

  // Bullet wrap
  const blChars = Math.round((innerW - 40) / (bulletFs * 0.56));
  const bulletBlocks = bullets.map(b => wrapText(b, blChars));
  const bulletLH = bulletFs * 1.55;

  // Layout Y positions
  const topBarH  = 8;
  const badgeY   = topBarH + pad * 0.75;
  const accentLineY = badgeY + badgeFs + Math.round(pad * 0.3);
  const hlStartY = accentLineY + Math.round(pad * 0.6);
  const hlEndY   = hlStartY + headlineLines.length * headlineLH;
  const dividerY = hlEndY + Math.round(pad * 0.5);
  const blStartY = dividerY + Math.round(pad * 0.5);
  const totalBulletH = bulletBlocks.reduce((s, ls) => s + ls.length * bulletLH + 8, 0);
  const blEndY   = blStartY + totalBulletH;

  // CTA box
  const ctaBoxH  = Math.round(ctaFs * 2.4);
  const ctaBoxY  = blEndY + Math.round(pad * 0.55);
  const ctaBoxW  = Math.round(innerW * 0.82);

  // Footer
  const footerDivY = height - Math.round(pad * 1.1) - footerFs * 2.6 - 8;
  const footerNameY = footerDivY + footerFs * 1.5;
  const footerRoleY = footerNameY + footerFs * 1.25;

  // Build headline tspans
  const hlTspans = headlineLines.map((ln, i) =>
    `<tspan x="${pad}" dy="${i === 0 ? '0' : headlineLH}">${escapeXml(ln)}</tspan>`
  ).join('');

  // Build bullet elements
  let bulletY = blStartY;
  const bulletElems = bulletBlocks.map((lines, bi) => {
    const markerX = pad;
    const textX   = pad + 36;
    const startY  = bulletY;
    const tspans  = lines.map((ln, li) =>
      `<tspan x="${textX}" dy="${li === 0 ? '0' : bulletLH}">${escapeXml(ln)}</tspan>`
    ).join('');
    bulletY += lines.length * bulletLH + 8;
    // Gold checkmark circle
    const cy = startY - bulletFs * 0.28;
    return `
    <circle cx="${markerX + 10}" cy="${cy}" r="${Math.round(bulletFs * 0.45)}" fill="${GOLD}" opacity="0.9"/>
    <text x="${markerX + 10}" y="${cy + Math.round(bulletFs * 0.32)}"
      font-family="Arial,sans-serif" font-size="${Math.round(bulletFs * 0.62)}" font-weight="900"
      fill="${NAVY}" text-anchor="middle">${bi + 1}</text>
    <text x="${textX}" y="${startY}"
      font-family="Arial,sans-serif" font-size="${bulletFs}" fill="${WHITE}"
      font-weight="400" opacity="0.92">${tspans}</text>`;
  }).join('');

  // Decorative background elements
  const circleR = Math.round(width * 0.55);
  const diagLineSpacing = Math.round(width * 0.045);
  const numDiagLines = 8;
  const diagLines = Array.from({ length: numDiagLines }, (_, i) => {
    const x1 = width - Math.round(width * 0.28) + i * diagLineSpacing;
    return `<line x1="${x1}" y1="0" x2="${x1 - height * 0.5}" y2="${height}" stroke="${GOLD}" stroke-width="1" opacity="0.07"/>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${NAVY}"/>

  <!-- Subtle radial glow top-right -->
  <radialGradient id="glow" cx="85%" cy="10%" r="55%">
    <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="${NAVY}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>

  <!-- Diagonal texture lines (right side) -->
  ${diagLines}

  <!-- Large faint circle accent bottom-left -->
  <circle cx="${Math.round(width * -0.05)}" cy="${Math.round(height * 1.05)}"
    r="${circleR}" fill="none" stroke="${GOLD}" stroke-width="${Math.round(width * 0.003)}" opacity="0.08"/>

  <!-- Top gold bar -->
  <rect x="0" y="0" width="${width}" height="${topBarH}" fill="${GOLD}"/>

  <!-- Eyebrow badge -->
  <text x="${pad}" y="${badgeY + badgeFs}"
    font-family="Arial,Helvetica,sans-serif" font-size="${badgeFs}" font-weight="700"
    letter-spacing="3" fill="${GOLD}">TAX STRATEGY · SOPHIE NGUYEN</text>

  <!-- Short gold accent line under badge -->
  <rect x="${pad}" y="${accentLineY}" width="${Math.round(width * 0.12)}" height="2" fill="${GOLD}"/>

  <!-- Headline -->
  <text x="${pad}" y="${hlStartY + headlineFs * 0.82}"
    font-family="'Arial Black',Arial,Helvetica,sans-serif" font-size="${headlineFs}"
    font-weight="900" fill="${WHITE}">
    ${hlTspans}
  </text>

  <!-- Divider -->
  <rect x="${pad}" y="${dividerY}" width="${innerW}" height="1" fill="${GOLD}" opacity="0.35"/>

  <!-- Bullets -->
  ${bulletElems}

  <!-- CTA box -->
  <rect x="${pad}" y="${ctaBoxY}" width="${ctaBoxW}" height="${ctaBoxH}"
    rx="${Math.round(ctaBoxH * 0.18)}" fill="${GOLD}"/>
  <text x="${pad + Math.round(ctaBoxW * 0.5)}" y="${ctaBoxY + Math.round(ctaBoxH * 0.63)}"
    font-family="Arial,Helvetica,sans-serif" font-size="${ctaFs}" font-weight="700"
    fill="${NAVY}" text-anchor="middle">${escapeXml(cta)} →</text>

  <!-- Brand tagline -->
  <text x="${pad}" y="${ctaBoxY + ctaBoxH + Math.round(pad * 0.85)}"
    font-family="Georgia,'Times New Roman',serif" font-size="${Math.round(footerFs * 1.05)}"
    font-style="italic" fill="${GOLD}" opacity="0.55">Legally. Strategically. Permanently.</text>

  <!-- Footer divider -->
  <rect x="${pad}" y="${footerDivY}" width="${innerW}" height="1" fill="${GOLD}" opacity="0.25"/>

  <!-- Footer: name + role -->
  <text x="${pad}" y="${footerNameY}"
    font-family="Arial,Helvetica,sans-serif" font-size="${footerFs}" font-weight="700" fill="${WHITE}">Sophie Nguyen</text>
  <text x="${pad}" y="${footerRoleY}"
    font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(footerFs * 0.85)}" fill="${GOLD}" opacity="0.8">Tax Strategist · Paramount Tax Richardson</text>

  <!-- Footer: site (right-aligned) -->
  <text x="${width - padR}" y="${footerNameY}"
    font-family="'Arial Black',Arial,Helvetica,sans-serif" font-size="${Math.round(footerFs * 1.1)}" font-weight="900"
    fill="${GOLD}" text-anchor="end">sophie.so</text>

  <!-- Bottom gold bar -->
  <rect x="0" y="${height - topBarH}" width="${width}" height="${topBarH}" fill="${GOLD}"/>

</svg>`;
}

// ── Public API ────────────────────────────────────────────────

export async function generateImages(parsed, index) {
  const squareDir   = path.join(ROOT, 'output', 'images', 'linkedin');
  const portraitDir = path.join(ROOT, 'output', 'images', 'instagram');
  fs.mkdirSync(squareDir,   { recursive: true });
  fs.mkdirSync(portraitDir, { recursive: true });

  const slug = `post-${index}`;
  const squareSvg   = buildSvg(parsed, 1200, 1200);
  const portraitSvg = buildSvg(parsed, 1080, 1350);

  await Promise.all([
    sharp(Buffer.from(squareSvg)).png().toFile(path.join(squareDir,   `${slug}-square.png`)),
    sharp(Buffer.from(portraitSvg)).png().toFile(path.join(portraitDir, `${slug}-portrait.png`)),
    // Persist SVGs to Upstash so images can be regenerated after a redeploy
    kvSet(`sophie:svg:linkedin:${slug}-square`,   squareSvg),
    kvSet(`sophie:svg:instagram:${slug}-portrait`, portraitSvg),
  ]);

  return {
    square:   `/images/linkedin/${slug}-square.png`,
    portrait: `/images/instagram/${slug}-portrait.png`,
  };
}

// Generates a single 1200x1200 square image for Facebook (or any platform dir)
export async function generatePlatformImage(parsed, index, platformDir) {
  const imgDir = path.join(ROOT, 'output', 'images', platformDir);
  fs.mkdirSync(imgDir, { recursive: true });
  const slug = `post-${index}`;
  const svg  = buildSvg(parsed, 1200, 1200);
  await Promise.all([
    sharp(Buffer.from(svg)).png().toFile(path.join(imgDir, `${slug}-square.png`)),
    kvSet(`sophie:svg:${platformDir}:${slug}-square`, svg),
  ]);
  return `/images/${platformDir}/${slug}-square.png`;
}

// Regenerate a PNG from its Upstash SVG and cache it to the local filesystem.
// Returns the PNG buffer, or null if the SVG isn't in Upstash.
export async function regenerateFromUpstash(dir, file) {
  const slug = file.replace('.png', '');
  const svg  = await kvGet(`sophie:svg:${dir}:${slug}`);
  if (!svg || typeof svg !== 'string') return null;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const filePath = path.join(ROOT, 'output', 'images', dir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
  return png;
}

export async function closeBrowser() {}
