import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { readPrompt, readClaudeMd } from './storage.js';
import * as mock from './mock.js';

const MOCK = process.env.MOCK === 'true';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

let _client;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function getMockResponse(userMessage) {
  if (userMessage.includes('research brief') || userMessage.includes('trending signals')) {
    return mock.mockResearch();
  }
  if (userMessage.includes('LinkedIn Post')) {
    const match = userMessage.match(/Post #(\d+)/);
    return mock.mockLinkedIn(match ? parseInt(match[1]) - 1 : 0);
  }
  if (userMessage.includes('Facebook Post')) {
    const match = userMessage.match(/Post #(\d+)/);
    return mock.mockFacebook(match ? parseInt(match[1]) - 1 : 0);
  }
  if (userMessage.includes('YouTube')) {
    return mock.mockYoutube();
  }
  return mock.mockResearch();
}

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isOverload = err.status === 529 || err.status === 503;
      if (isOverload && i < retries - 1) {
        const wait = 1000 * 2 ** i;
        console.log(`API overloaded, retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Generate content using Claude with prompt caching on the system blocks.
 * @param {Array<{text: string, cache?: boolean}>} systemParts
 * @param {string} userMessage
 * @param {{ model?: string, maxTokens?: number, temperature?: number }} options
 */
async function ollamaGenerate(systemParts, userMessage, options = {}) {
  const { maxTokens = 2000, temperature = 0.7 } = options;
  const systemText = systemParts.map(p => p.text).join('\n\n');

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      options: { temperature, num_predict: maxTokens },
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return { content: [{ type: 'text', text: data.message.content }] };
}

export async function generateWithCache(systemParts, userMessage, options = {}) {
  if (MOCK) {
    console.log('  [mock] Returning sample content (no API call)');
    return getMockResponse(userMessage);
  }

  if (OLLAMA_MODEL) {
    return ollamaGenerate(systemParts, userMessage, options);
  }

  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const system = systemParts.map((part) => {
    const block = { type: 'text', text: part.text };
    if (part.cache) block.cache_control = { type: 'ephemeral' };
    return block;
  });

  return withRetry(() =>
    getClient().messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: userMessage }],
    })
  );
}

export function extractText(response) {
  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
}

export function buildSystemParts(promptFile) {
  return [
    { text: readClaudeMd(), cache: true },
    { text: readPrompt(promptFile), cache: true },
  ];
}
