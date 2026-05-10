import 'dotenv/config';
import { generateWithCache, extractText, buildSystemParts } from './lib/claude.js';
import { ensureOutputDirs, readLatestOutput, writeOutput, initStore } from './lib/storage.js';
import { markPending } from './lib/approvals.js';
import { pickTopicsForPlatform } from './lib/topic-pool.js';
import { buildAvoidList, recordGeneration } from './lib/history.js';

async function main() {
  ensureOutputDirs();
  await initStore();

  const researchBrief = await readLatestOutput('research');
  if (!researchBrief) {
    console.error('No research brief found. Run `npm run research` first.');
    process.exit(1);
  }

  const selectedTopics = pickTopicsForPlatform('youtube', 5);
  const avoidList = await buildAvoidList(30);

  console.log(`Generating 5 YouTube topic scripts:\n${selectedTopics.map((t, i) => `  ${i + 1}. ${t.topic} (${t.audience})`).join('\n')}\n`);

  const topicList = selectedTopics.map((t, i) =>
    `  ${i + 1}. "${t.topic}" — Target audience: ${t.audience}`
  ).join('\n');

  const systemParts = buildSystemParts('youtube-planner.md');
  const prompt = `Research context:\n${researchBrief.slice(0, 3000)}${avoidList}\n\nGenerate exactly 5 YouTube topics with scripts for Sophie Nguyen.\n\nUse EXACTLY these topics (in this order):\n${topicList}\n\nFor each topic use this format:\n\n## YouTube Topic N: [Title based on the assigned topic]\n**Audience:** [exact audience from the topic list]\n**Target keyword:** [SEO phrase]\n\n**Hook script (spoken, first 30 seconds):**\n[2-4 sentence spoken hook with a real dollar amount or IRS code section]\n\n**Key points:**\n- [Point 1]\n- [Point 2]\n- [Point 3]\n\n**CTA:** [One sentence call to action for end of video]\n\n---`;

  const response = await generateWithCache(systemParts, prompt, {
    model: 'claude-sonnet-4-6',
    maxTokens: 3000,
    temperature: 0.7,
  });

  const date = new Date().toISOString().slice(0, 10);
  const researchDate = researchBrief.match(/Generated: (\d{4}-\d{2}-\d{2})/)?.[1] ?? 'unknown';
  const header = `# Sophie Nguyen — YouTube Topics & Scripts\nGenerated: ${date}\nResearch Source: ${researchDate}-research.md\n\n---\n\n`;
  const content = header + extractText(response);

  const filePath = await writeOutput('youtube', content);
  await markPending('youtube', 5);
  await recordGeneration({ topics: selectedTopics.map(t => t.topic), angles: [] });
  console.log(`5 YouTube topic scripts saved to: ${filePath}`);
}

main()
  .catch(err => { console.error('YouTube planner failed:', err.message); process.exit(1); })
  .catch(err => { console.error('YouTube script failed:', err.message); process.exit(1); });
