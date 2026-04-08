import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Buffer } from 'node:buffer';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
    out[key] = value;
  }
  return out;
}

const fileEnv = {
  // Base app env first, then local proxy secrets override.
  ...loadEnvFile(resolve(process.cwd(), '.env')),
  ...loadEnvFile(resolve(process.cwd(), '.env.proxy')),
};

const env = { ...fileEnv, ...process.env };

const PORT = Number(env.AI_PROXY_PORT || 8787);
const HOST = env.AI_PROXY_HOST || '0.0.0.0';

const KEYS = {
  groq: env.AI_GROQ_API_KEY || '',
  deepseek: env.AI_DEEPSEEK_API_KEY || '',
  kimi: env.AI_KIMI_API_KEY || '',
  mistral: env.AI_MISTRAL_API_KEY || '',
  glm5: env.AI_GLM5_API_KEY || '',
  openrouter: env.AI_OPENROUTER_API_KEY || '',
  gemini: env.AI_GEMINI_API_KEY || '',
  anthropic: env.AI_ANTHROPIC_API_KEY || '',
};

const PROVIDER_CONFIG = {
  groq: {
    type: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    key: KEYS.groq,
  },
  deepseek: {
    type: 'openai',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    key: KEYS.deepseek,
  },
  kimi: {
    type: 'openai',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'moonshotai/kimi-k2.5',
    key: KEYS.kimi,
  },
  mistral: {
    type: 'openai',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'mistralai/mistral-large-3-675b-instruct-2512',
    key: KEYS.mistral,
  },
  glm5: {
    type: 'openai',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'z-ai/glm5',
    key: KEYS.glm5,
  },
  openrouter: {
    type: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: env.AI_OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    key: KEYS.openrouter,
  },
  gemini: {
    type: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: env.AI_GEMINI_MODEL || 'gemini-2.0-flash',
    key: KEYS.gemini,
  },
  anthropic: {
    type: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20240620',
    key: KEYS.anthropic,
  },
};

const FALLBACK_ORDER = ['groq', 'openrouter', 'gemini', 'deepseek', 'mistral', 'glm5', 'kimi', 'anthropic'];

const METRICS = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  totalSuccess: 0,
  totalFailures: 0,
  endpoint: {
    generate: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
    homeSignal: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
  },
  provider: {},
  recentErrors: [],
};

function ensureProviderMetric(providerName) {
  if (!METRICS.provider[providerName]) {
    METRICS.provider[providerName] = {
      attempts: 0,
      success: 0,
      failures: 0,
      latencyMsSum: 0,
      lastError: null,
    };
  }
  return METRICS.provider[providerName];
}

function pushRecentError(scope, message) {
  METRICS.recentErrors.push({
    at: new Date().toISOString(),
    scope,
    message: String(message || 'unknown'),
  });
  if (METRICS.recentErrors.length > 25) {
    METRICS.recentErrors.shift();
  }
}

function recordEndpointMetric(endpointKey, success, latencyMs) {
  METRICS.totalRequests += 1;
  const endpointMetric = METRICS.endpoint[endpointKey];
  endpointMetric.requests += 1;
  endpointMetric.latencyMsSum += Math.max(0, Math.round(latencyMs));
  if (success) {
    METRICS.totalSuccess += 1;
    endpointMetric.success += 1;
  } else {
    METRICS.totalFailures += 1;
    endpointMetric.failures += 1;
  }
}

function getMetricsSnapshot() {
  const avg = (sum, count) => (count > 0 ? Math.round(sum / count) : 0);
  const providerSummary = Object.fromEntries(
    Object.entries(METRICS.provider).map(([name, m]) => [
      name,
      {
        attempts: m.attempts,
        success: m.success,
        failures: m.failures,
        avgLatencyMs: avg(m.latencyMsSum, m.success + m.failures),
        lastError: m.lastError,
      },
    ])
  );
  return {
    startedAt: METRICS.startedAt,
    totals: {
      requests: METRICS.totalRequests,
      success: METRICS.totalSuccess,
      failures: METRICS.totalFailures,
      successRate:
        METRICS.totalRequests > 0
          ? Number((METRICS.totalSuccess / METRICS.totalRequests).toFixed(3))
          : 0,
    },
    endpoint: {
      generate: {
        ...METRICS.endpoint.generate,
        avgLatencyMs: avg(METRICS.endpoint.generate.latencyMsSum, METRICS.endpoint.generate.requests),
      },
      homeSignal: {
        ...METRICS.endpoint.homeSignal,
        avgLatencyMs: avg(METRICS.endpoint.homeSignal.latencyMsSum, METRICS.endpoint.homeSignal.requests),
      },
    },
    provider: providerSummary,
    recentErrors: METRICS.recentErrors,
  };
}

function sendJson(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(text);
}

function getActiveProviders(preferred, options = {}) {
  const allowFallback = options.allowFallback !== false;
  const first = preferred && PROVIDER_CONFIG[preferred] ? [preferred] : [];
  const ordered = [...first, ...FALLBACK_ORDER.filter((p) => p !== preferred)];
  const active = ordered.filter((p) => PROVIDER_CONFIG[p] && PROVIDER_CONFIG[p].key);
  const maxAttempts = Number.isFinite(options.maxAttempts) && options.maxAttempts > 0
    ? Math.max(1, Math.floor(options.maxAttempts))
    : active.length;
  if (!allowFallback) return active.slice(0, 1);
  if (options.fastMode) return active.slice(0, 1);
  return active.slice(0, maxAttempts);
}

function buildTimeoutSignal(timeoutMs) {
  const safeTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : null;
  if (!safeTimeout) return undefined;
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error('Request timed out')), safeTimeout);
  return controller.signal;
}

async function callOpenAICompat(cfg, messages, generation = {}) {
  const headers = {
    Authorization: `Bearer ${cfg.key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (cfg.type === 'openrouter') {
    headers['HTTP-Referer'] = env.AI_OPENROUTER_SITE_URL || 'http://localhost';
    headers['X-Title'] = env.AI_OPENROUTER_APP_NAME || 'ZCE AI Proxy';
  }

  const resp = await fetch(cfg.url, {
    method: 'POST',
    headers,
    signal: buildTimeoutSignal(generation.timeoutMs),
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: typeof generation.temperature === 'number' ? generation.temperature : 0.45,
      top_p: 1,
      max_tokens: Number.isFinite(generation.maxTokens) ? generation.maxTokens : 1200,
      stream: false,
      ...(cfg.model === 'moonshotai/kimi-k2.5' ? { chat_template_kwargs: { thinking: false } } : {}),
      ...(cfg.model === 'z-ai/glm5' ? { chat_template_kwargs: { enable_thinking: false, clear_thinking: true } } : {}),
    }),
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim?.();
  if (!text) throw new Error('Provider returned empty text');
  return text;
}

function toGeminiContents(messages) {
  const contents = [];
  let systemInstruction = '';

  for (const message of messages || []) {
    if (!message || typeof message.content !== 'string') continue;
    const text = message.content.trim();
    if (!text) continue;

    if (message.role === 'system') {
      systemInstruction = systemInstruction ? `${systemInstruction}\n\n${text}` : text;
      continue;
    }

    const role = message.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text }] });
  }

  if (!contents.length) {
    contents.push({ role: 'user', parts: [{ text: 'Generate a concise helpful response.' }] });
  }

  return { contents, systemInstruction };
}

async function callGemini(cfg, messages, generation = {}) {
  const endpoint = `${cfg.url}/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.key)}`;
  const { contents, systemInstruction } = toGeminiContents(messages);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    signal: buildTimeoutSignal(generation.timeoutMs),
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: {
        temperature: typeof generation.temperature === 'number' ? generation.temperature : 0.45,
        topP: 1,
        maxOutputTokens: Number.isFinite(generation.maxTokens) ? generation.maxTokens : 1200,
      },
    }),
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim();

  if (!text) throw new Error('Provider returned empty text');
  return text;
}

async function callAnthropic(cfg, messages, generation = {}) {
  const resp = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'x-api-key': cfg.key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      accept: 'application/json',
    },
    signal: buildTimeoutSignal(generation.timeoutMs),
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: Number.isFinite(generation.maxTokens) ? generation.maxTokens : 1200,
      messages,
    }),
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  const text = data?.content?.[0]?.text?.trim?.();
  if (!text) throw new Error('Provider returned empty text');
  return text;
}

async function generateWithFallback({ provider, messages, generation }) {
  const candidates = getActiveProviders(provider, {
    allowFallback: generation?.allowFallback,
    fastMode: generation?.fastMode,
    maxAttempts: generation?.maxAttempts,
  });
  if (!candidates.length) {
    throw new Error('No AI provider keys configured on proxy server');
  }

  let lastError = null;
  for (const name of candidates) {
    const startedAt = Date.now();
    const metric = ensureProviderMetric(name);
    metric.attempts += 1;
    try {
      const cfg = PROVIDER_CONFIG[name];
      let text = '';
      if (cfg.type === 'anthropic') text = await callAnthropic(cfg, messages, generation);
      else if (cfg.type === 'gemini') text = await callGemini(cfg, messages, generation);
      else text = await callOpenAICompat(cfg, messages, generation);

      metric.success += 1;
      metric.latencyMsSum += Math.max(0, Date.now() - startedAt);
      return { text, providerUsed: name };
    } catch (err) {
      lastError = err;
      metric.failures += 1;
      metric.latencyMsSum += Math.max(0, Date.now() - startedAt);
      metric.lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw lastError || new Error('All providers failed');
}

function buildGenerateMessages(body) {
  const userName = body?.userName || 'AGENT';
  const level = body?.level || 1;
  const promptType = body?.promptType || 'main';
  const system =
    typeof body?.systemPrompt === 'string' && body.systemPrompt.trim()
      ? body.systemPrompt.trim()
      : `You are Z.A.N.E. Coaching assistant. User=${userName}. Level=${level}. PromptType=${promptType}. Be concise, actionable, and direct.`;
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  return [{ role: 'system', content: system }, ...incoming];
}

function buildHomeSignalMessages(body) {
  const userName = body?.userName || 'AGENT';
  const level = body?.level || 1;
  const kind = body?.kind || 'quote';
  const mode = body?.mode || 'classic';
  const memory = body?.memoryContext ? `\nMemory: ${body.memoryContext}` : '';

  return [
    {
      role: 'system',
      content: `Generate exactly one ${kind} for a mobile home screen. Keep it short. No markdown.`,
    },
    {
      role: 'user',
      content: `User=${userName}, Level=${level}, Mode=${mode}.${memory}`,
    },
  ];
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      return sendJson(res, 204, {});
    }

    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { ok: true, providersConfigured: Object.entries(KEYS).filter(([, v]) => !!v).map(([k]) => k) });
    }

    if (req.method === 'GET' && req.url === '/metrics') {
      return sendJson(res, 200, { ok: true, metrics: getMetricsSnapshot() });
    }

    if (req.method === 'POST' && req.url === '/ai/generate') {
      const reqStartedAt = Date.now();
      const body = await readBody(req);
      const messages = buildGenerateMessages(body);
      const result = await generateWithFallback({
        provider: body?.provider,
        messages,
        generation: {
          maxTokens: Number(body?.maxTokens),
          temperature: typeof body?.temperature === 'number' ? body.temperature : undefined,
          timeoutMs: Number(body?.timeoutMs),
          allowFallback: body?.allowFallback !== false,
          fastMode: body?.fastMode === true,
          maxAttempts: Number(body?.maxAttempts),
        },
      });
      recordEndpointMetric('generate', true, Date.now() - reqStartedAt);
      return sendJson(res, 200, { text: result.text, providerUsed: result.providerUsed });
    }

    if (req.method === 'POST' && req.url === '/ai/home-signal') {
      const reqStartedAt = Date.now();
      const body = await readBody(req);
      const messages = buildHomeSignalMessages(body);
      const result = await generateWithFallback({ provider: body?.provider, messages });
      recordEndpointMetric('homeSignal', true, Date.now() - reqStartedAt);
      return sendJson(res, 200, { text: result.text, providerUsed: result.providerUsed });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    pushRecentError('server', message);
    if (req.url === '/ai/generate') recordEndpointMetric('generate', false, 0);
    if (req.url === '/ai/home-signal') recordEndpointMetric('homeSignal', false, 0);
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown proxy error' });
  }
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.log(`[ai-proxy] port ${PORT} already in use on ${HOST}. Reusing existing proxy instance if it is healthy.`);
    process.exit(0);
  }
  console.error('[ai-proxy] failed to start:', error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`[ai-proxy] listening on http://${HOST}:${PORT}`);
  console.log('[ai-proxy] set EXPO_PUBLIC_AI_PROXY_URL to this URL (use LAN IP for real devices)');
});
