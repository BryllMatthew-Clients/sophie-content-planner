import fetch from 'node-fetch';

export async function braveSearch(query, count = 5) {
  const key = process.env.BRAVE_API_KEY;
  if (!key || key.startsWith('BSA...')) return [];

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', count);
  url.searchParams.set('freshness', 'pm');

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': key,
    },
  });

  if (!res.ok) {
    console.warn(`Brave search failed for "${query}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.web?.results ?? []).map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    age: r.age,
  }));
}

export async function serperSearch(query, count = 5) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: count }),
  });

  if (!res.ok) {
    console.warn(`Serper search failed for "${query}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.organic ?? []).map(r => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    age: r.date ?? null,
  }));
}

export async function search(query, count = 5) {
  const braveResults = await braveSearch(query, count);
  if (braveResults.length) return braveResults;
  return serperSearch(query, count);
}
