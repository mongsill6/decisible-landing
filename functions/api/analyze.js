export async function onRequestPost(context) {
  const { ANTHROPIC_API_KEY } = context.env;

  // CORS headers — restrict to decisible.pages.dev only
  const allowedOrigins = ['https://decisible.pages.dev', 'https://decisible.com'];
  const origin = context.request.headers.get('Origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://decisible.pages.dev';

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };

  // Block requests not from our domain
  const referer = context.request.headers.get('Referer') || '';
  const isAllowedOrigin = allowedOrigins.some(o => origin.startsWith(o));
  const isAllowedReferer = allowedOrigins.some(o => referer.startsWith(o));
  if (origin && !isAllowedOrigin && !isAllowedReferer) {
    return Response.json({ error: 'Unauthorized' }, { status: 403, headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500, headers: corsHeaders });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
  }

  const { product, category, price, market, context: extraContext } = body;

  if (!product || !category || !price) {
    return Response.json({ error: 'Missing required fields: product, category, price' }, { status: 400, headers: corsHeaders });
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Anthropic API error: ${response.status}`, detail: errText }, { status: 502, headers: corsHeaders });
    }

    const data = await response.json();
    return Response.json({ result: data.content[0].text }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: 'Failed to call AI API', detail: String(err) }, { status: 500, headers: corsHeaders });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
