import 'dotenv/config';
import { generateWithCache, extractText, buildSystemParts } from './lib/claude.js';
import { ensureOutputDirs, readLatestOutput, writeOutput } from './lib/storage.js';
import { markPending } from './lib/approvals.js';
import { pickTopicsForPlatform, pickAnglesForRun, ANGLES } from './lib/topic-pool.js';
import { buildAvoidList, recordGeneration } from './lib/history.js';

const DISCLAIMER = `\n\n*This content is for educational purposes only and does not constitute specific legal, tax, or financial advice. Consult a qualified tax professional for guidance tailored to your situation.*`;

async function generatePost(topicObj, angleKey, researchContext, systemParts, index) {
  const angle = ANGLES[angleKey];
  const prompt = `Research context:\n${researchContext}\n\nGenerate Facebook Post #${index + 1} on the topic: "${topicObj.topic}"\nTarget audience: ${topicObj.audience}\n\nContent angle — ${angleKey}:\n${angle.instruction}\nSuggested hook style: "${angle.hook}"\n\nFollow the Sophie Facebook format:\n- Open with a personal narrative scene that fits the angle above (NOT a generic statistic)\n- The Discovery: what Sophie found or realized\n- The Strategy: actionable insight in plain language\n- The Wealth Flip: connect the savings to what the money builds next\n- CTA: drive to discovery call or sharable resource\n\nTotal length: 300–500 words. Use paragraph breaks, not bullets. Do NOT add a disclaimer — it will be appended automatically.`;

  const response = await generateWithCache(systemParts, prompt, {
    model: 'claude-sonnet-4-6',
    maxTokens: 800,
    temperature: 0.75,
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

  const selectedTopics = pickTopicsForPlatform('facebook', 5);
  const selectedAngles = pickAnglesForRun(5);
  const researchContext = researchBrief.slice(0, 3000) + buildAvoidList(30);

  console.log(`Generating 5 Facebook posts:\n${selectedTopics.map((t, i) => `  ${i + 1}. [${selectedAngles[i]}] ${t.topic}`).join('\n')}\n`);

  const systemParts = buildSystemParts('facebook-generator.md');
  const posts = [];

  for (let i = 0; i < 5; i++) {
    const topicObj = selectedTopics[i] ?? selectedTopics[0];
    const angleKey = selectedAngles[i] ?? selectedAngles[0];
    console.log(`Generating post ${i + 1}/5 [${angleKey}]: ${topicObj.topic}...`);
    const postText = await generatePost(topicObj, angleKey, researchContext, systemParts, i);
    posts.push(`## Facebook Post ${i + 1} of 5 — ${topicObj.topic}\n\n${postText}${DISCLAIMER}`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const researchDate = researchBrief.match(/Generated: (\d{4}-\d{2}-\d{2})/)?.[1] ?? 'unknown';
  const header = `# Sophie Nguyen — Facebook Posts\nGenerated: ${date}\nResearch Source: ${researchDate}-research.md\n\n---\n\n`;
  const content = header + posts.join('\n\n---\n\n');

  const filePath = writeOutput('facebook', content);
  markPending('facebook', posts.length);
  recordGeneration({ topics: selectedTopics.map(t => t.topic), angles: selectedAngles });
  console.log(`\n5 Facebook posts saved to: ${filePath}`);
}

main().catch(err => {
  console.error('Facebook generator failed:', err.message);
  process.exit(1);
});
