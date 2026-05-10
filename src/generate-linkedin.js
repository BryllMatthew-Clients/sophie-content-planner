import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateWithCache, extractText, buildSystemParts } from './lib/claude.js';
import { ensureOutputDirs, readLatestOutput, writeOutput } from './lib/storage.js';
import { parsePostForImage, generateImages, closeBrowser } from './lib/image-gen.js';
import { markPending } from './lib/approvals.js';
import { pickTopicsForPlatform, pickAnglesForRun, ANGLES } from './lib/topic-pool.js';
import { buildAvoidList, recordGeneration } from './lib/history.js';
import { buildInspirationContext } from './lib/inspiration.js';

const DISCLAIMER = `\n---\n*This content is for educational purposes only and does not constitute specific legal, tax, or financial advice. Consult a qualified tax professional for guidance tailored to your situation.*`;

async function generatePost(topicObj, angleKey, researchContext, systemParts, index) {
  const angle = ANGLES[angleKey];
  const prompt = `Research context:\n${researchContext}\n\nGenerate LinkedIn Post #${index + 1} on the topic: "${topicObj.topic}"\nTarget audience: ${topicObj.audience}\n\nContent angle — ${angleKey}:\n${angle.instruction}\nSuggested hook style: "${angle.hook}"\n\nFollow the Sophie format exactly:\n- HOOK: 1-2 lines calling out the specific audience affected (use the angle hook style above)\n- BODY: 4-6 bullet points with whitespace between each. Teach one specific strategy.\n- THE FLIP: 2-3 lines connecting the tax saving to wealth building / investing\n- CTA: One question or call to action\n- VISUAL CONCEPT: Art direction brief using the image-concept.md format\n\nDo NOT add a disclaimer — it will be appended automatically.`;

  const response = await generateWithCache(systemParts, prompt, {
    model: 'claude-sonnet-4-6',
    maxTokens: 700,
    temperature: 0.8,
  });

  return extractText(response);
}

async function main() {
  ensureOutputDirs();

  const researchBrief = readLatestOutput('research');
  if (!researchBrief) {
    console.error('No research brief found. Run `npm run research` first.');
    process.exit(1);
  }

  const selectedTopics = pickTopicsForPlatform('linkedin', 5);
  const selectedAngles = pickAnglesForRun(5);
  const researchContext = researchBrief.slice(0, 3000) + buildAvoidList(30) + buildInspirationContext();

  console.log(`Generating 5 LinkedIn posts:\n${selectedTopics.map((t, i) => `  ${i + 1}. [${selectedAngles[i]}] ${t.topic}`).join('\n')}\n`);

  const systemParts = buildSystemParts('linkedin-generator.md');
  const posts = [];

  for (let i = 0; i < 5; i++) {
    const topicObj = selectedTopics[i] ?? selectedTopics[0];
    const angleKey = selectedAngles[i] ?? selectedAngles[0];
    console.log(`Generating post ${i + 1}/5 [${angleKey}]: ${topicObj.topic}...`);
    const postText = await generatePost(topicObj, angleKey, researchContext, systemParts, i);
    posts.push(`## Post ${i + 1} of 5 — ${topicObj.topic}\n\n${postText}${DISCLAIMER}`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const researchDate = researchBrief.match(/Generated: (\d{4}-\d{2}-\d{2})/)?.[1] ?? 'unknown';
  const header = `# Sophie Nguyen — LinkedIn Posts\nGenerated: ${date}\nResearch Source: ${researchDate}-research.md\n\n---\n\n`;
  const content = header + posts.join('\n\n---\n\n');

  const filePath = writeOutput('linkedin', content);
  markPending('linkedin', posts.length);
  recordGeneration({ topics: selectedTopics.map(t => t.topic), angles: selectedAngles });

  // Generate static images for each post
  console.log('\nGenerating static images...');
  const imageIndex = {};
  for (let i = 0; i < posts.length; i++) {
    const topic = (selectedTopics[i] ?? selectedTopics[0]).topic.replace(/\*\*/g, '');
    const parsed = parsePostForImage(posts[i], topic);
    process.stdout.write(`  Image ${i + 1}/5 (${topic.slice(0, 30)})...`);
    imageIndex[i + 1] = await generateImages(parsed, i + 1);
    console.log(' done');
  }
  await closeBrowser();

  const jsonPath = path.join(path.dirname(filePath), `${date}-linkedin-images.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(imageIndex, null, 2));
  console.log(`\n5 LinkedIn posts saved to: ${filePath}`);
  console.log(`Image index saved to: ${jsonPath}`);
}

main().catch(err => {
  console.error('LinkedIn generator failed:', err.message);
  process.exit(1);
});
