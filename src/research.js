import 'dotenv/config';
import { getAllTrendingQueries } from './lib/trends.js';
import { search } from './lib/search.js';
import { generateWithCache, extractText, buildSystemParts } from './lib/claude.js';
import { ensureOutputDirs, writeOutput } from './lib/storage.js';
import { markPending } from './lib/approvals.js';
import { pickTopicsForPlatform, pickSearchQueries } from './lib/topic-pool.js';
import { buildAvoidList, recordGeneration } from './lib/history.js';

const SUBREDDITS = [
  'tax',
  'smallbusiness',
  'realestateinvesting',
  'financialindependence',
  'wealthbuilding',
];

async function fetchRedditPosts() {
  const { default: Snoowrap } = await import('snoowrap');
  const {
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USERNAME,
    REDDIT_PASSWORD,
    REDDIT_USER_AGENT,
  } = process.env;

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    console.log('Reddit credentials not configured — skipping Reddit signals.');
    return [];
  }

  const r = new Snoowrap({
    userAgent: REDDIT_USER_AGENT || 'SophieContentBot/1.0',
    clientId: REDDIT_CLIENT_ID,
    clientSecret: REDDIT_CLIENT_SECRET,
    username: REDDIT_USERNAME,
    password: REDDIT_PASSWORD,
  });

  const posts = [];
  for (const sub of SUBREDDITS) {
    try {
      const hot = await r.getSubreddit(sub).getHot({ limit: 10 });
      for (const p of hot) {
        posts.push({
          subreddit: sub,
          title: p.title,
          score: p.score,
          numComments: p.num_comments,
          body: p.selftext?.slice(0, 300) ?? '',
        });
      }
    } catch {
      console.warn(`Could not fetch r/${sub} — skipping.`);
    }
  }

  return posts
    .sort((a, b) => (b.score * b.numComments) - (a.score * a.numComments))
    .slice(0, 15);
}

async function fetchSearchResults(queries) {
  const results = [];
  for (const q of queries) {
    const hits = await search(q, 5);
    if (hits.length) results.push({ query: q, results: hits });
  }
  return results;
}

async function main() {
  ensureOutputDirs();

  // Pick fresh topics from the pool (any platform) and derive search queries from them
  const selectedTopics = pickTopicsForPlatform('any', 5);
  const searchQueries = pickSearchQueries(selectedTopics);

  console.log(`Researching topics:\n${selectedTopics.map((t, i) => `  ${i + 1}. ${t.topic}`).join('\n')}\n`);
  console.log('Fetching trending signals...\n');

  const [trendsData, searchResults, redditPosts] = await Promise.all([
    getAllTrendingQueries(),
    fetchSearchResults(searchQueries),
    fetchRedditPosts(),
  ]);

  const signalDump = JSON.stringify({ trendsData, searchResults, redditPosts }, null, 2);
  const topicGuidance = `\n\nFocus your research brief on these priority topics this week:\n${selectedTopics.map((t, i) => `  ${i + 1}. ${t.topic} (audience: ${t.audience})`).join('\n')}\n`;
  const avoidList = buildAvoidList(30);

  console.log('Synthesizing research brief with Claude...\n');

  const systemParts = buildSystemParts('research.md');
  const response = await generateWithCache(
    systemParts,
    `Here are this week's trending signals. Synthesize them into a 5-topic research brief following the format in your instructions.${topicGuidance}${avoidList}\n\n${signalDump}`,
    { model: 'claude-haiku-4-5', maxTokens: 3000, temperature: 0.5 }
  );

  const date = new Date().toISOString().slice(0, 10);
  const header = `# Sophie Nguyen — Weekly Research Brief\nGenerated: ${date}\n\n---\n\n`;
  const content = header + extractText(response);

  const filePath = writeOutput('research', content);
  markPending('research', 1);
  recordGeneration({ topics: selectedTopics.map(t => t.topic), angles: [] });
  console.log(`Research brief saved to: ${filePath}`);
}

main().catch(err => {
  console.error('Research script failed:', err.message);
  process.exit(1);
});
