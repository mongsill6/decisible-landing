const ALLOWED_ORIGIN = 'https://decisible.pages.dev';
const DAILY_LIMIT = 10; // IP당 하루 최대 요청 수

// CORS 헤더 (오리진 고정)
function corsHeaders(requestOrigin) {
  const origin = requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// KV 기반 IP Rate Limiter
async function checkRateLimit(kv, ip) {
  if (!kv) return { allowed: true, remaining: DAILY_LIMIT }; // KV 없으면 패스 (로컬 개발)

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `ratelimit:${ip}:${today}`;

  const raw = await kv.get(key);
  const count = raw ? parseInt(raw) : 0;

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, count };
  }

  // 카운터 증가, 자정까지 TTL
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const ttl = Math.floor((midnight - now) / 1000);

  await kv.put(key, String(count + 1), { expirationTtl: ttl });

  return { allowed: true, remaining: DAILY_LIMIT - (count + 1), count: count + 1 };
}

export async function onRequestPost(context) {
  const { ANTHROPIC_API_KEY, RATE_LIMIT_KV } = context.env;
  const headers = corsHeaders(context.request.headers.get('Origin'));

  // IP 추출 (Cloudflare는 CF-Connecting-IP 헤더 제공)
  const ip =
    context.request.headers.get('CF-Connecting-IP') ||
    context.request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown';

  // Rate Limit 체크
  const rateLimit = await checkRateLimit(RATE_LIMIT_KV, ip);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: 'Daily limit reached',
        message: `You've reached the daily limit of ${DAILY_LIMIT} analyses. Try again tomorrow.`,
      },
      { status: 429, headers }
    );
  }

  if (!ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500, headers });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
  }

  const { product, category, price, market, context: extraContext } = body;

  if (!product || !category || !price) {
    return Response.json(
      { error: 'Missing required fields: product, category, price' },
      { status: 400, headers }
    );
  }

  const systemPrompt = `You are a senior Amazon Merchandising Director with 10 years of product launch experience. You have launched hundreds of products across consumer electronics, accessories, outdoor gear, and lifestyle categories. You think like a product strategist: you weigh market opportunity against execution risk, and you are NOT afraid to say NO.

Your job is to analyze a product launch opportunity and deliver a clear GO or NO-GO decision with reasoning.

Evaluate these 5 dimensions:
1. MARKET DEMAND — Is demand real, consistent, growing?
2. COMPETITION — Can a new entrant grab 1-3% share?
3. MARGIN — Does it hit 25%+ net after FBA fees + PPC + COGS?
4. DIFFERENTIATION — What do bad reviews reveal? Is there a gap?
5. LAUNCH RISK — Min inventory? IP risks? Timeline to first sale?

Output format (use exactly this structure):
## VERDICT: [GO ✅ / NO-GO ❌ / CONDITIONAL GO ⚠️]
**Confidence:** High/Medium/Low
**One-Line Summary:** [why in plain English]

---
## DIMENSION SCORES
- Market Demand: X/10
- Competition: X/10
- Margin Viability: X/10
- Differentiation: X/10
- Launch Risk: X/10
**Overall: XX/50**

---
## KEY INSIGHTS
[3-5 bullet points]

## RISKS TO WATCH
[2-3 specific risks]

## IF YOU GO: 90-Day Action Plan
[3-5 actionable steps]

Be direct. A wrong YES costs money. A right NO saves it.`;

  const userMessage = `Product: ${product}
Category: ${category}
Target Price: $${price}
Market: ${market || 'US'}
${extraContext ? `Additional Context: ${extraContext}` : ''}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return Response.json(
        { error: `Analysis service error (${response.status}). Please try again.`, detail: errText },
        { status: 502, headers }
      );
    }

    const data = await response.json();
    return Response.json(
      {
        result: data.content[0].text,
        remaining: rateLimit.remaining,
      },
      { headers }
    );
  } catch (err) {
    if (err.name === 'AbortError') {
      return Response.json(
        { error: 'Analysis timed out. Please try again.' },
        { status: 504, headers }
      );
    }
    return Response.json(
      { error: 'Failed to run analysis. Please try again.' },
      { status: 500, headers }
    );
  }
}

// CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: corsHeaders(context.request.headers.get('Origin')),
  });
}
