import { useState } from 'react';
import { Loader2, ArrowRight, ChevronLeft, Mail, TrendingUp, AlertTriangle, Lightbulb, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FormData {
  product: string;
  category: string;
  price: string;
  market: string;
  context: string;
}

type VerdictType = 'GO' | 'NO-GO' | 'CONDITIONAL' | null;

// ─── Parsers ───────────────────────────────────────────────────────────────

function detectVerdict(text: string): VerdictType {
  const upper = text.toUpperCase();
  if (upper.includes('NO-GO')) return 'NO-GO';
  if (upper.includes('CONDITIONAL GO')) return 'CONDITIONAL';
  if (upper.includes('VERDICT: GO') || upper.includes('GO ✅')) return 'GO';
  return null;
}

interface DimensionScore {
  label: string;
  score: number;
}

function parseDimensionScores(text: string): DimensionScore[] {
  const dimensions = [
    'Market Demand',
    'Competition',
    'Margin Viability',
    'Differentiation',
    'Launch Risk',
  ];
  return dimensions.flatMap(label => {
    const match = new RegExp(`${label}[:\\s]+([0-9]+)\\s*/\\s*10`, 'i').exec(text);
    if (!match) return [];
    return [{ label, score: parseInt(match[1]) }];
  });
}

function parseOverallScore(text: string): number | null {
  const match = /Overall[:\s]+([0-9]+)\s*\/\s*50/i.exec(text);
  return match ? parseInt(match[1]) : null;
}

function parseConfidence(text: string): string | null {
  const match = /\*\*Confidence:\*\*\s*(High|Medium|Low)/i.exec(text);
  return match ? match[1] : null;
}

function parseOneLiner(text: string): string | null {
  const match = /\*\*One-Line Summary:\*\*\s*(.+)/i.exec(text);
  return match ? match[1].trim() : null;
}

function extractSection(text: string, heading: string): string {
  const headingPattern = new RegExp(`##\\s*${heading}[^\\n]*\\n`, 'i');
  const start = text.search(headingPattern);
  if (start === -1) return '';
  const afterHeading = text.slice(start).replace(headingPattern, '');
  const nextSection = afterHeading.search(/^##\s/m);
  return (nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection)).trim();
}

function parseListItems(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.length > 0);
}

// ─── Styles ────────────────────────────────────────────────────────────────

const verdictConfig: Record<NonNullable<VerdictType>, { bg: string; border: string; badge: string; label: string; glow: string }> = {
  GO: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-500 text-white',
    label: 'GO ✅',
    glow: 'shadow-emerald-500/10',
  },
  'NO-GO': {
    bg: 'bg-red-950/40',
    border: 'border-red-500/50',
    badge: 'bg-red-500 text-white',
    label: 'NO-GO ❌',
    glow: 'shadow-red-500/10',
  },
  CONDITIONAL: {
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-500/50',
    badge: 'bg-yellow-400 text-black',
    label: 'CONDITIONAL GO ⚠️',
    glow: 'shadow-yellow-500/10',
  },
};

function scoreColor(score: number) {
  if (score >= 7) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
  if (score >= 4) return { bar: 'bg-yellow-400', text: 'text-yellow-400' };
  return { bar: 'bg-red-500', text: 'text-red-400' };
}

// localStorage helpers
const getUsageCount = () => parseInt(localStorage.getItem('decisible_usage_count') || '0');
const incrementUsageCount = () => {
  localStorage.setItem('decisible_usage_count', String(getUsageCount() + 1));
};
const hasSubmittedEmail = () => !!localStorage.getItem('decisible_email_submitted');

// ─── Component ─────────────────────────────────────────────────────────────

export default function Analyze() {
  const [form, setForm] = useState<FormData>({
    product: '',
    category: '',
    price: '',
    market: 'US',
    context: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<VerdictType>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const [gateSubmitting, setGateSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setVerdict(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed');
      setResult(data.result);
      setVerdict(detectVerdict(data.result));
      incrementUsageCount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = getUsageCount();
    if (count >= 2 && !hasSubmittedEmail()) {
      setShowEmailGate(true);
      return;
    }
    await runAnalysis();
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateSubmitting(true);
    try {
      await fetch('https://formsubmit.co/ajax/hdj0611@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: gateEmail, source: 'decisible-email-gate', _subject: 'New Decisible waitlist signup (email gate)' }),
      });
    } catch { /* continue on fail */ }
    localStorage.setItem('decisible_email_submitted', '1');
    setShowEmailGate(false);
    setGateSubmitting(false);
    await runAnalysis();
  };

  const isValid = form.product.trim() && form.category.trim() && form.price.trim();
  const vcfg = verdict ? verdictConfig[verdict] : null;

  // Parsed data
  const dimensions = result ? parseDimensionScores(result) : [];
  const overall = result ? parseOverallScore(result) : null;
  const confidence = result ? parseConfidence(result) : null;
  const oneLiner = result ? parseOneLiner(result) : null;
  const keyInsights = result ? parseListItems(extractSection(result, 'KEY INSIGHTS')) : [];
  const risks = result ? parseListItems(extractSection(result, 'RISKS TO WATCH')) : [];
  const actionPlan = result ? parseListItems(extractSection(result, 'IF YOU GO[^\\n]*')) : [];

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">

      {/* Email Gate Modal */}
      {showEmailGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <Mail size={24} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2">Unlock Unlimited Analyses</h2>
            <p className="text-slate-400 text-center text-sm mb-6">Join 500+ Amazon sellers making smarter decisions</p>
            <div className="bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3 mb-6 text-center">
              <p className="text-slate-300 text-sm">You've used your <span className="text-emerald-400 font-bold">2 free analyses</span></p>
              <p className="text-slate-500 text-xs mt-1">Enter your email to continue — it's free</p>
            </div>
            <form onSubmit={handleGateSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={gateEmail}
                onChange={e => setGateEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={gateSubmitting || !gateEmail.trim()}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition"
              >
                {gateSubmitting ? <><Loader2 size={18} className="animate-spin" />Submitting...</> : 'Get Access →'}
              </button>
            </form>
            <p className="text-slate-600 text-xs text-center mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 bg-[#0F172A]/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">
            Decisi<span className="text-emerald-500">ble</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition">
              <ChevronLeft size={16} />Home
            </Link>
            <a href="/#waitlist" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition">
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            AI Launch Analyzer — Powered by Claude
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Should You <span className="text-emerald-500">Launch It?</span>
          </h1>
          <p className="text-slate-400 text-lg">Get a GO / NO-GO decision in 30 seconds — backed by 10-year MD expertise.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Product Idea <span className="text-emerald-400">*</span></label>
              <input name="product" value={form.product} onChange={handleChange}
                placeholder="e.g. Stainless steel insulated water bottle with straw lid"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category <span className="text-emerald-400">*</span></label>
                <input name="category" value={form.category} onChange={handleChange}
                  placeholder="e.g. Kitchen & Dining"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Target Price ($) <span className="text-emerald-400">*</span></label>
                <input name="price" value={form.price} onChange={handleChange}
                  type="number" min="1" step="0.01" placeholder="e.g. 25"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Market</label>
              <select name="market" value={form.market} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition">
                <option value="US">US — Amazon.com</option>
                <option value="EU">EU — Amazon.de / .fr / .it</option>
                <option value="UK">UK — Amazon.co.uk</option>
                <option value="Global">Global — Multi-market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Context <span className="text-slate-500 font-normal">(optional)</span></label>
              <textarea name="context" value={form.context} onChange={handleChange} rows={3}
                placeholder="e.g. Competitor ASIN: B08XYZ, avg BSR 12,000, my COGS is ~$7..."
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none" />
            </div>
            <button type="submit" disabled={!isValid || loading}
              className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition text-lg">
              {loading ? <><Loader2 size={20} className="animate-spin" />Analyzing with AI...</> : <><ArrowRight size={20} />Analyze Now</>}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-6 mb-8 text-red-300">
            <p className="font-semibold mb-1">Analysis Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ─── Result ─────────────────────────────────────────────── */}
        {result && vcfg && (
          <div className={`rounded-2xl border shadow-xl ${vcfg.bg} ${vcfg.border} ${vcfg.glow} p-8 space-y-6`}>

            {/* Verdict + Confidence */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-5 py-2 rounded-full text-sm font-black tracking-wider ${vcfg.badge}`}>
                {vcfg.label}
              </span>
              {confidence && (
                <span className="px-3 py-1.5 bg-slate-700/60 border border-slate-600 rounded-full text-slate-300 text-xs font-semibold">
                  Confidence: {confidence}
                </span>
              )}
            </div>

            {/* One-liner */}
            {oneLiner && (
              <p className="text-xl text-slate-200 italic leading-relaxed border-l-4 border-slate-500 pl-4">
                "{oneLiner}"
              </p>
            )}

            {/* ── Dimension Scores ───────────────────── */}
            {dimensions.length > 0 && (
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Dimension Scores
                </h3>
                <div className="space-y-3">
                  {dimensions.map(({ label, score }) => {
                    const col = scoreColor(score);
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300 text-sm">{label}</span>
                          <span className={`font-black text-sm ${col.text}`}>{score}/10</span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${col.bar}`}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Score gauge */}
                {overall !== null && (
                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm font-semibold">Overall Score</span>
                      <span className="text-2xl font-black text-white">{overall}<span className="text-slate-500 text-sm font-normal">/50</span></span>
                    </div>
                    <div className="w-full bg-slate-700/60 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${scoreColor(overall / 5).bar}`}
                        style={{ width: `${(overall / 50) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>0</span><span>25</span><span>50</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Key Insights ───────────────────────── */}
            {keyInsights.length > 0 && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-emerald-500 rounded-xl p-5">
                <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Lightbulb size={16} />Key Insights
                </h3>
                <ul className="space-y-2.5">
                  {keyInsights.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Risks ──────────────────────────────── */}
            {risks.length > 0 && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-orange-500 rounded-xl p-5">
                <h3 className="text-orange-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} />Risks to Watch
                </h3>
                <ul className="space-y-2.5">
                  {risks.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="text-orange-400 mt-0.5 shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Action Plan ────────────────────────── */}
            {actionPlan.length > 0 && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-blue-500 rounded-xl p-5">
                <h3 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Rocket size={16} />90-Day Action Plan
                </h3>
                <ol className="space-y-2.5">
                  {actionPlan.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                      <span className="text-blue-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row items-center gap-4">
              <p className="text-slate-400 text-sm flex-1">Want unlimited analyses + PDF export + competitor comparison?</p>
              <Link to="/#pricing" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition text-sm whitespace-nowrap">
                Get Full Access →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
