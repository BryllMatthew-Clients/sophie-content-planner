import googleTrends from 'google-trends-api';

const TAX_SEED_TERMS = [
  'S-Corp tax strategy',
  'cost segregation real estate',
  'short term rental tax',
  'solo 401k deduction',
  'tax write offs small business',
];

export async function getTrendingSearches(keyword) {
  try {
    const raw = await googleTrends.relatedQueries({ keyword, geo: 'US' });
    const data = JSON.parse(raw);
    const rising = data?.default?.rankedList?.[0]?.rankedKeyword ?? [];
    return rising.slice(0, 10).map(r => ({
      query: r.query,
      value: r.value,
      formattedValue: r.formattedValue,
    }));
  } catch {
    return [];
  }
}

export async function getAllTrendingQueries() {
  const results = [];
  for (const term of TAX_SEED_TERMS) {
    const rising = await getTrendingSearches(term);
    results.push({ seed: term, rising });
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}
