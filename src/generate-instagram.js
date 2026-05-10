import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ensureOutputDirs, readLatestOutput, writeOutput, readLatestJson } from './lib/storage.js';
import { parsePostForImage, generateImages, closeBrowser } from './lib/image-gen.js';
import { markPending } from './lib/approvals.js';

const DISCLAIMER = `\n\n*This content is for educational purposes only and does not constitute specific legal, tax, or financial advice. Consult a qualified tax professional for guidance tailored to your situation.*`;

function extractTopicsAndPosts(md) {
  if (!md) return [];
  const result = [];
  for (const sec of md.split(/\n---\n/)) {
    const m = sec.match(/## Post (\d+) of \d+ [—–-] (.+)/);
    if (!m) continue;
    result.push({ index: parseInt(m[1]), title: m[2].replace(/\*\*/g, '').trim(), content: sec.trim() });
  }
  return result;
}

async function main() {
  ensureOutputDirs();

  const linkedInMd = readLatestOutput('linkedin');
  if (!linkedInMd) {
    console.error('No LinkedIn output found. Run `npm run generate-linkedin` first.');
    process.exit(1);
  }

  const posts = extractTopicsAndPosts(linkedInMd);
  if (!posts.length) {
    console.error('Could not parse LinkedIn posts for Instagram.');
    process.exit(1);
  }

  console.log(`Generating Instagram content from ${posts.length} LinkedIn posts...`);

  // Load existing LinkedIn image index so we know which images already exist
  const existingIndex = readLatestJson('linkedin') ?? {};

  const imageIndex = {};
  const instaPosts = [];

  for (const post of posts) {
    const i = post.index;
    process.stdout.write(`  Post ${i} — ${post.title.slice(0, 35)}...`);

    // Reuse portrait image if LinkedIn already generated it
    const existing = existingIndex[i];
    if (existing?.portrait) {
      imageIndex[i] = { portrait: existing.portrait };
      console.log(' (reused existing image)');
    } else {
      const parsed = parsePostForImage(post.content, post.title);
      const urls = await generateImages(parsed, i);
      imageIndex[i] = { portrait: urls.portrait };
      console.log(' done');
    }

    instaPosts.push(`## Instagram Post ${i} of ${posts.length} — ${post.title}\n\n${post.content}\n\n*(Image: ${imageIndex[i].portrait})*${DISCLAIMER}`);
  }

  await closeBrowser();

  const date = new Date().toISOString().slice(0, 10);
  const researchDate = linkedInMd.match(/Generated: (\d{4}-\d{2}-\d{2})/)?.[1] ?? 'unknown';
  const header = `# Sophie Nguyen — Instagram Posts\nGenerated: ${date}\nSource: ${researchDate}-linkedin.md\n\n---\n\n`;
  const mdContent = header + instaPosts.join('\n\n---\n\n');

  const filePath = writeOutput('instagram', mdContent);

  // Save image index alongside
  const jsonPath = path.join(path.dirname(filePath), `${date}-instagram-images.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(imageIndex, null, 2));

  markPending('instagram', posts.length);
  console.log(`\n${posts.length} Instagram posts saved to: ${filePath}`);
}

main().catch(err => {
  console.error('Instagram generator failed:', err.message);
  process.exit(1);
});
