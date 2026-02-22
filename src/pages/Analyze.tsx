import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, ArrowRight, ChevronLeft, Mail, TrendingUp, Lightbulb, AlertTriangle, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────

interface FormData {
  product: string; category: string; price: string; market: string; context: string;
}
type VerdictType = 'GO' | 'NO-GO' | 'CONDITIONAL' | null;
interface DimScore { label: string; score: number; }

// ── Simple section extractor ─────────────────────────────────────────────
// 정규식으로 ## 헤더 기준 섹션 텍스트만 추출. list parser 없음.

function extractSection(text: string, headingPattern: RegExp): string {
  const start = text.search(headingPattern);
  if (start === -1) return '';
  const body = text.slice(start).replace(headingPattern, '');
  const nextSection = body.search(/^##\s/m);
  return (nextSection === -1 ? body : body.slice(0, nextSection)).trim();
}

// ── Parsers ──────────────────────────────────────────────────────────────

function detectVerdict(text: string): VerdictType {
  const upper = text.toUpperCase();
  if (upper.includes('NO-GO')) return 'NO-GO';
  if (upper.includes('CONDITIONAL GO')) return 'CONDITIONAL';
  if (upper.includes('VERDICT: GO') || upper.includes('GO ✅')) return 'GO';
  return null;
}

function parseDimScores(text: string): DimScore[] {
  return ['Market Demand', 'Competition', 'Margin Viability', 'Differentiation', 'Launch Risk']
    .flatMap(label => {
      const m = new RegExp(`${label}[:\\s]+([0-9]+)\\s*/\\s*10`, 'i').exec(text);
      return m ? [{ label, score: parseInt(m[1]) }] : [];
    });
}

function parseOverall(text: string): number | null {
  const m = /Overall[:\s]+([0-9]+)\s*\/\s*50/i.exec(text);
  return m ? parseInt(m[1]) : null;
}

function parseConfidence(text: string): string | null {
  const m = /\*\*Confidence:\*\*\s*(High|Medium|Low)/i.exec(text);
  return m ? m[1] : null;
}

function parseOneLiner(text: string): string | null {
  const m = /\*\*One-Line Summary:\*\*\s*(.+)/i.exec(text);
  return m ? m[1].trim() : null;
}

// ── Style helpers ────────────────────────────────────────────────────────

const verdictCfg: Record<NonNullable<VerdictType>, { bg: string; border: string; badge: string; label: string }> = {
  GO:          { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', badge: 'bg-emerald-500 text-white',  label: 'GO ✅' },
  'NO-GO':     { bg: 'bg-red-950/40',     border: 'border-red-500/50',     badge: 'bg-red-500 text-white',     label: 'NO-GO ❌' },
  CONDITIONAL: { bg: 'bg-yellow-950/40',  border: 'border-yellow-500/50',  badge: 'bg-yellow-400 text-black',  label: 'CONDITIONAL GO ⚠️' },
};

function scoreCol(s: number) {
  if (s >= 7) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
  if (s >= 4) return { bar: 'bg-yellow-400',  text: 'text-yellow-400'  };
  return       { bar: 'bg-red-500',            text: 'text-red-400'     };
}

const mdClass = `prose prose-invert max-w-none
  prose-h2:text-white prose-h2:font-black prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
  prose-h3:text-emerald-400 prose-h3:font-bold prose-h3:text-sm
  prose-strong:text-white
  prose-p:text-slate-300 prose-p:text-sm prose-p:leading-relaxed prose-p:my-1
  prose-li:text-slate-300 prose-li:text-sm prose-li:leading-relaxed
  prose-ol:text-slate-300 prose-ul:text-slate-300
  prose-hr:border-slate-700`;

// ── localStorage ─────────────────────────────────────────────────────────

const getUsageCount      = ()    => parseInt(localStorage.getItem('decisible_usage_count')  || '0');
const incrementUsage     = ()    => localStorage.setItem('decisible_usage_count', String(getUsageCount() + 1));
const hasSubmittedEmail  = ()    => !!localStorage.getItem('decisible_email_submitted');

// ── Component ────────────────────────────────────────────────────────────

export default function Analyze() {
  const [form, setForm] = useState<FormData>({ product: '', category: '', price: '', market: 'US', context: '' });
  const [loading, setLoading]         = useState(false);
  const [result,  setResult]          = useState<string | null>(null);
  const [error,   setError]           = useState<string | null>(null);
  const [verdict, setVerdict]         = useState<VerdictType>(null);
  const [showGate, setShowGate]       = useState(false);
  const [gateEmail, setGateEmail]     = useState('');
  const [gateBusy, setGateBusy]       = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Core analysis call ────────────────────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true); setResult(null); setError(null); setVerdict(null);
    try {
      const res  = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed');
      setResult(data.result);
      setVerdict(detectVerdict(data.result));
      incrementUsage();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ── Form submit: email gate check ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = getUsageCount();
    if (count >= 2 && !hasSubmittedEmail()) {
      setShowGate(true);
      return;
    }
    await runAnalysis();
  };

  // ── Email gate submit ─────────────────────────────────────────────────
  const handleGate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateBusy(true);
    try {
      await fetch('https://formsubmit.co/ajax/hdj0611@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: gateEmail, source: 'email-gate', _subject: 'Decisible email gate signup' }),
      });
    } catch { /* non-blocking */ }
    localStorage.setItem('decisible_email_submitted', '1');
    setShowGate(false);
    setGateBusy(false);
    await runAnalysis();
  };

  const isValid = form.product.trim() && form.category.trim() && form.price.trim();
  const vcfg    = verdict ? verdictCfg[verdict] : null;

  // Derived from result
  const dims       = result ? parseDimScores(result)   : [];
  const overall    = result ? parseOverall(result)     : null;
  const confidence = result ? parseConfidence(result)  : null;
  const oneLiner   = result ? parseOneLiner(result)    : null;
  const insightsMd = result ? extractSection(result, /##\s*KEY INSIGHTS[^\n]*\n/i)          : '';
  const risksMd    = result ? extractSection(result, /##\s*RISKS TO WATCH[^\n]*\n/i)        : '';
  const actionMd   = result ? extractSection(result, /##\s*IF YOU GO[^\n]*\n/i)             : '';

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">

      {/* ── Email Gate Modal ─────────────────────────────────────── */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <Mail size={24} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2">Unlock Unlimited Analyses</h2>
            <p className="text-slate-400 text-center text-sm mb-5">Join 500+ Amazon sellers making smarter decisions</p>
            <div className="bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-slate-300 text-sm">You've used your <span className="text-emerald-400 font-bold">2 free analyses</span></p>
              <p className="text-slate-500 text-xs mt-1">Enter your email to continue — it's free</p>
            </div>
            <form onSubmit={handleGate} className="flex flex-col gap-3">
              <input type="email" value={gateEmail} onChange={e => setGateEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
              <button type="submit" disabled={gateBusy || !gateEmail.trim()}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition">
                {gateBusy ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : 'Get Access →'}
              </button>
            </form>
            <p className="text-slate-600 text-xs text-center mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      )}

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-40 bg-[#0F172A]/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">Decisi<span className="text-emerald-500">ble</span></Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition">
              <ChevronLeft size={16} /> Home
            </Link>
            <a href="/#waitlist" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition">
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            AI Launch Analyzer — Powered by Claude
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Should You <span className="text-emerald-500">Launch It?</span>
          </h1>
          <p className="text-slate-400 text-lg">Get a GO / NO-GO decision in 30 seconds — backed by 10-year MD expertise.</p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Product Idea <span className="text-emerald-400">*</span></label>
              <input name="product" value={form.product} onChange={onChange}
                placeholder="e.g. Stainless steel insulated water bottle with straw lid"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category <span className="text-emerald-400">*</span></label>
                <input name="category" value={form.category} onChange={onChange} placeholder="e.g. Kitchen & Dining"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Target Price ($) <span className="text-emerald-400">*</span></label>
                <input name="price" value={form.price} onChange={onChange} type="number" min="1" step="0.01" placeholder="e.g. 25"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Market</label>
              <select name="market" value={form.market} onChange={onChange}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition">
                <option value="US">US — Amazon.com</option>
                <option value="EU">EU — Amazon.de / .fr / .it</option>
                <option value="UK">UK — Amazon.co.uk</option>
                <option value="Global">Global — Multi-market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Additional Context <span className="text-slate-500 font-normal">(optional)</span></label>
              <textarea name="context" value={form.context} onChange={onChange} rows={3}
                placeholder="e.g. Competitor ASIN: B08XYZ, avg BSR 12,000, my COGS is ~$7..."
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none" />
            </div>
            <button type="submit" disabled={!isValid || loading}
              className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition text-lg">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing with AI…</> : <><ArrowRight size={20} /> Analyze Now</>}
            </button>
          </div>
        </form>

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-6 mb-8 text-red-300">
            <p className="font-semibold mb-1">Analysis Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────────── */}
        {result && vcfg && (
          <div className={`rounded-2xl border shadow-xl ${vcfg.bg} ${vcfg.border} p-8 space-y-5`}>

            {/* 1. Verdict + Confidence */}
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

            {/* 2. One-Line Summary */}
            {oneLiner && (
              <p className="text-xl text-slate-200 italic leading-relaxed border-l-4 border-slate-500 pl-4">
                "{oneLiner}"
              </p>
            )}

            {/* 3. Dimension Scores */}
            {dims.length > 0 && (
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-emerald-400" /> Dimension Scores
                </h3>
                <div className="space-y-3">
                  {dims.map(({ label, score }) => {
                    const c = scoreCol(score);
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300 text-sm">{label}</span>
                          <span className={`font-black text-sm ${c.text}`}>{score}/10</span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${score * 10}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {overall !== null && (
                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm font-semibold">Overall Score</span>
                      <span className="text-2xl font-black text-white">{overall}<span className="text-slate-500 text-sm font-normal">/50</span></span>
                    </div>
                    <div className="w-full bg-slate-700/60 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all duration-700 ${scoreCol(overall / 5).bar}`} style={{ width: `${(overall / 50) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1"><span>0</span><span>25</span><span>50</span></div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Key Insights card */}
            {insightsMd && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-emerald-500 rounded-xl p-5">
                <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lightbulb size={15} /> Key Insights
                </h3>
                <div className={mdClass}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{insightsMd}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 5. Risks card */}
            {risksMd && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-orange-500 rounded-xl p-5">
                <h3 className="text-orange-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={15} /> Risks to Watch
                </h3>
                <div className={mdClass}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{risksMd}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 6. Action Plan card */}
            {actionMd && (
              <div className="bg-[#1E293B] border border-slate-700 border-l-4 border-l-blue-500 rounded-xl p-5">
                <h3 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Rocket size={15} /> 90-Day Action Plan
                </h3>
                <div className={mdClass}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{actionMd}</ReactMarkdown>
                </div>
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
