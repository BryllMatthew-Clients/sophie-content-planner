import { getRecentTopics, getRecentAngles } from './history.js';

// ── Topic pool ────────────────────────────────────────────────
// Each topic: { topic, audience, platform, priority (1–5) }
// platform: 'linkedin' | 'facebook' | 'youtube' | 'any'

export const TOPIC_POOL = [
  // Entity structure
  { topic: 'S-Corp reasonable salary: how the IRS calculates it and what triggers an audit', audience: 'Entrepreneur', platform: 'linkedin', priority: 5 },
  { topic: 'LLC vs S-Corp vs C-Corp: which entity saves the most at each income level', audience: 'Entrepreneur', platform: 'youtube', priority: 5 },
  { topic: 'How C-Corp retained earnings create a long-term tax-free wealth vault', audience: 'Founder', platform: 'linkedin', priority: 4 },
  { topic: 'Solo 401(k) contribution limits 2026 and the self-employed tax shelter most miss', audience: 'Entrepreneur', platform: 'any', priority: 5 },
  { topic: 'SEP-IRA vs Solo 401(k): which one reduces your taxable income more', audience: 'Medical Pro', platform: 'youtube', priority: 4 },
  { topic: 'Multi-entity holding company structure for founders with multiple revenue streams', audience: 'Founder', platform: 'linkedin', priority: 4 },
  { topic: 'QBID — the 20% pass-through deduction most S-Corp owners never claim fully', audience: 'Entrepreneur', platform: 'any', priority: 4 },

  // Real estate
  { topic: 'Cost segregation study: front-loading $500K+ in depreciation in year one', audience: 'Real Estate', platform: 'youtube', priority: 5 },
  { topic: 'Short-term rental tax loophole: material participation vs passive activity rules', audience: 'Real Estate', platform: 'linkedin', priority: 5 },
  { topic: 'Real Estate Professional Status: the exact hours test and what it unlocks at $200K+', audience: 'Real Estate', platform: 'youtube', priority: 5 },
  { topic: '1031 exchange: defer capital gains indefinitely using IRS Section 1031', audience: 'Real Estate', platform: 'any', priority: 4 },
  { topic: 'Opportunity Zones: invest realized gains to eliminate capital gains tax entirely', audience: 'Real Estate', platform: 'linkedin', priority: 4 },
  { topic: 'STR passive loss rules vs active participation: why it matters above $100K income', audience: 'Real Estate', platform: 'facebook', priority: 4 },
  { topic: 'Depreciation recapture at sale: the tax trap real estate investors overlook', audience: 'Real Estate', platform: 'linkedin', priority: 3 },
  { topic: 'Short-term rentals vs long-term rentals: the tax math comparison', audience: 'Real Estate', platform: 'youtube', priority: 4 },

  // Deductions & credits
  { topic: 'Augusta Rule (Section 280A): how to rent your home to your business tax-free', audience: 'Entrepreneur', platform: 'linkedin', priority: 5 },
  { topic: 'Home office deduction done right: the safe harbor vs actual expense method', audience: 'Entrepreneur', platform: 'any', priority: 4 },
  { topic: 'Section 179 vs bonus depreciation for business vehicles and equipment in 2026', audience: 'Entrepreneur', platform: 'youtube', priority: 4 },
  { topic: 'Hiring your children in the family business: legal payroll tax savings strategy', audience: 'Entrepreneur', platform: 'facebook', priority: 5 },
  { topic: 'Self-employed health insurance deduction: the write-off most physicians miss', audience: 'Medical Pro', platform: 'linkedin', priority: 5 },
  { topic: 'Business meal deductions after TCJA: what qualifies and how to document it', audience: 'Entrepreneur', platform: 'facebook', priority: 3 },
  { topic: 'Research and Development (R&D) tax credits for founders: the overlooked windfall', audience: 'Founder', platform: 'linkedin', priority: 4 },

  // Advanced strategies
  { topic: 'Mega backdoor Roth: the six-figure retirement loophole for high earners', audience: 'High-Income W2', platform: 'youtube', priority: 5 },
  { topic: 'Backdoor Roth IRA: step-by-step guide for earners above the Roth income limit', audience: 'High-Income W2', platform: 'linkedin', priority: 5 },
  { topic: 'Defined benefit pension plan: sheltering $265K+ annually for self-employed physicians', audience: 'Medical Pro', platform: 'youtube', priority: 5 },
  { topic: 'Oil and gas deductions: 80–100% first-year write-off for accredited investors', audience: 'Founder', platform: 'linkedin', priority: 4 },
  { topic: 'Charitable Remainder Trust: turn appreciated assets into a tax deduction + income stream', audience: 'Founder', platform: 'facebook', priority: 3 },
  { topic: 'Installment sale strategy: spreading a business sale to stay in lower brackets', audience: 'Founder', platform: 'linkedin', priority: 4 },

  // IRS & compliance
  { topic: 'IRS audit triggers for high-income earners: what to avoid and what to keep documenting', audience: 'Medical Pro', platform: 'linkedin', priority: 4 },
  { topic: 'Quarterly estimated taxes: how to calculate and avoid underpayment penalties', audience: 'High-Income W2', platform: 'facebook', priority: 4 },
  { topic: 'Tax loss harvesting: using investment losses to offset W2 and business income', audience: 'High-Income W2', platform: 'linkedin', priority: 4 },
  { topic: 'Year-end tax planning: the December moves that change your April tax bill', audience: 'Entrepreneur', platform: 'any', priority: 5 },
  { topic: 'S-Corp election deadline: when to file and what you lose by missing it', audience: 'Entrepreneur', platform: 'facebook', priority: 4 },

  // Wealth building
  { topic: 'How to reinvest tax savings into income-producing real estate systematically', audience: 'Entrepreneur', platform: 'facebook', priority: 4 },
  { topic: 'Tax-advantaged account stacking: HSA + 401(k) + Roth for maximum shelter', audience: 'High-Income W2', platform: 'youtube', priority: 4 },
  { topic: 'Converting a taxable bonus or business sale into a tax-efficient outcome', audience: 'Founder', platform: 'linkedin', priority: 4 },
];

// ── Content angles ─────────────────────────────────────────────
// Angles control the narrative structure of each post

export const ANGLES = {
  'myth-bust': {
    instruction: 'Open with a common misconception high-income earners hold about this topic, stated as a myth. Then dismantle it with specific IRS code or dollar amounts. End with the correct strategy.',
    hook: 'Most people believe [myth]. They\'re wrong—and it\'s costing them.',
  },
  'case-study': {
    instruction: 'Open with a real client scenario (use an anonymized role like "a physician I worked with last year" or "a 7-figure founder"). Show the before/after tax numbers concretely. Make the savings specific and believable.',
    hook: 'A [role] came to me paying $[amount] in taxes. Here\'s how we cut that.',
  },
  'how-to': {
    instruction: 'Give a concrete, numbered step-by-step process for implementing this strategy. Each step should be specific and actionable. Avoid vague language—give real thresholds, deadlines, or IRS code references.',
    hook: 'Here\'s exactly how to [strategy] — step by step.',
  },
  'stat-hook': {
    instruction: 'Open with a specific, striking dollar amount, percentage, or IRS code section number that creates immediate curiosity or urgency. Build the post around proving or unpacking that number.',
    hook: '$[specific amount]. That\'s what [high-income earner] is leaving on the table.',
  },
  'common-mistake': {
    instruction: 'Identify the single most expensive mistake you see high-income earners make on this topic. Be specific about the audience (physicians, founders, STR operators). Show the tax cost of the mistake, then give the correct approach.',
    hook: 'The #1 mistake [audience] makes with [topic] — and what it costs them.',
  },
  'timeline': {
    instruction: 'Frame the post around a real deadline, tax year event, or time-sensitive strategy window. Create urgency with specific dates (Q4, December 31, March 15, etc.). Make the cost of inaction concrete.',
    hook: 'You have until [date] to [action]. After that, you pay.',
  },
  'comparison': {
    instruction: 'Compare two options, strategies, or entity types side by side with real numbers. Use a clear structure—Option A vs Option B. Make the winner obvious through math, not opinion.',
    hook: '[Option A] vs [Option B]: the numbers don\'t lie.',
  },
};

// ── Search query pool ─────────────────────────────────────────
// 20+ queries — 5 picked per run based on which topics were recently chosen

export const SEARCH_QUERY_POOL = [
  'S-Corp reasonable salary IRS audit 2026',
  'cost segregation study tax benefits real estate 2026',
  'short term rental tax loophole material participation IRS',
  'solo 401k contribution limits self employed 2026',
  'real estate professional status hours test qualify',
  'mega backdoor Roth high income earner 2026',
  'Augusta Rule Section 280A home office business rental',
  'LLC vs S-Corp tax savings comparison 2026',
  'opportunity zone tax benefit capital gains 2026',
  'defined benefit pension plan physician tax shelter',
  'IRS audit triggers high income earner 2026',
  'bonus depreciation Section 179 business vehicle 2026',
  'backdoor Roth IRA income limit strategy 2026',
  'QBID qualified business income deduction pass-through',
  'hiring children family business payroll tax',
  '1031 exchange rules timeline 2026',
  'year end tax planning high income strategies',
  'tax loss harvesting W2 income offset',
  'holding company structure multi-entity tax benefits',
  'STR passive loss rules high income earner',
  'R&D tax credit small business founder 2026',
  'oil gas investment deduction accredited investor',
  'depreciation recapture real estate sale strategy',
  'installment sale business capital gains tax deferral',
  'health insurance self employed deduction physician',
];

// ── Selection logic ───────────────────────────────────────────

function recentKeywords() {
  return getRecentTopics(30)
    .join(' ')
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4);
}

function topicScore(t, recentKw) {
  // Lower score = recently covered = deprioritize
  const topicWords = t.topic.toLowerCase().split(/\W+/);
  const overlap = topicWords.filter(w => w.length > 4 && recentKw.includes(w)).length;
  return t.priority - Math.min(overlap * 2, t.priority - 1);
}

export function pickTopicsForPlatform(platform, count = 5) {
  const recentKw = recentKeywords();
  const pool = TOPIC_POOL.filter(t => t.platform === platform || t.platform === 'any');
  const scored = pool.map(t => ({ ...t, score: topicScore(t, recentKw) }))
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);
  return scored.slice(0, count);
}

export function pickAnglesForRun(count = 5) {
  const recentAngles = getRecentAngles(14);
  const allAngles = Object.keys(ANGLES);
  const fresh = allAngles.filter(a => !recentAngles.includes(a));
  const pool = fresh.length >= count ? fresh : [...fresh, ...allAngles.filter(a => !fresh.includes(a))];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function pickSearchQueries(selectedTopics) {
  // Pick queries related to the selected topics, plus some fresh ones
  const topicWords = selectedTopics.flatMap(t => t.topic.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const relevant = SEARCH_QUERY_POOL.filter(q =>
    q.toLowerCase().split(/\W+/).some(w => topicWords.includes(w))
  );
  const rest = SEARCH_QUERY_POOL.filter(q => !relevant.includes(q));
  // Shuffle rest and fill to 5
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...relevant, ...rest].slice(0, 5);
}
