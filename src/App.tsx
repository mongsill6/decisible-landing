import './index.css';
import { Link } from 'react-router-dom';
import WaitlistForm from './WaitlistForm';
import { BarChart3, GitFork, TrendingDown, FileText, ScanSearch, CheckCircle2, type LucideIcon } from 'lucide-react';

interface PainPoint {
  Icon: LucideIcon;
  iconColor: string;
  title: string;
  desc: string;
}

interface Step {
  num: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
}

const painPoints: PainPoint[] = [
  {
    Icon: BarChart3,
    iconColor: '#10B981',
    title: 'Data Overload',
    desc: 'Helium10 gives you numbers. Nobody tells you what to DO with them.',
  },
  {
    Icon: GitFork,
    iconColor: '#10B981',
    title: 'Decision Paralysis',
    desc: '3 product ideas. No idea which one to bet $10K on.',
  },
  {
    Icon: TrendingDown,
    iconColor: '#EF4444',
    title: 'Expensive Mistakes',
    desc: 'Wrong launch = months lost + thousands in sunk inventory costs.',
  },
];

const steps: Step[] = [
  {
    num: '01',
    Icon: FileText,
    title: 'Input',
    desc: 'Paste your product idea, niche, or competitor ASIN',
  },
  {
    num: '02',
    Icon: ScanSearch,
    title: 'Analyze',
    desc: 'AI cross-references demand, competition, margins & trends',
  },
  {
    num: '03',
    Icon: CheckCircle2,
    title: 'Decide',
    desc: 'Get GO / NO-GO with full reasoning + 90-day action plan',
  },
];

const sellerNeeds = [
  {
    emoji: '🎯',
    title: 'Clear Decision, Not More Data',
    desc: 'Sellers don\'t need another dashboard. They need someone to say GO or NO-GO — with reasoning.',
  },
  {
    emoji: '💸',
    title: 'Protect Capital Before Launch',
    desc: 'The average failed FBA launch costs $8K–$25K in sunk inventory. One good decision pays for years of subscriptions.',
  },
  {
    emoji: '⚡',
    title: 'Speed Up the Research Phase',
    desc: 'Manual product research takes 10–20 hours per product. Decisible compresses that into 30 seconds.',
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight hover:opacity-80 transition">
            Decisi<span className="text-emerald-500">ble</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/analyze"
              className="px-4 py-2 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-sm font-bold rounded-lg transition"
            >
              Try Demo →
            </Link>
            <a
              href="#waitlist"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold fade-in-up">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Early Access — Be Among the First 500 Sellers
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] mb-6 fade-in-up delay-1">
            Stop Guessing.
            <br />
            <span className="text-emerald-500">Start Knowing.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 fade-in-up delay-2">
            AI-powered product launch decisions for Amazon sellers —
            backed by 10-year MD expertise.
          </p>

          <div className="fade-in-up delay-3">
            <WaitlistForm variant="hero" />
          </div>

          <p className="mt-5 text-sm text-slate-600 fade-in-up delay-4">
            Free early access · No credit card required · Launch notifications only
          </p>

          <div className="mt-8 fade-in-up delay-4">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 font-semibold rounded-xl transition text-sm"
            >
              ✨ Try a Free Analysis Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6 bg-slate-950/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              The Problem with Amazon Tools
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              You're drowning in dashboards — but still launching blind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="mb-4">
                  <p.Icon size={32} color={p.iconColor} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                <p className="text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-3">The Solution</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
              Meet <span className="text-emerald-500">Decisible</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Decisible analyzes your product idea like a seasoned 10-year Amazon MD —
              and delivers a clear{' '}
              <span className="text-emerald-400 font-bold">GO</span>
              {' '}or{' '}
              <span className="text-red-400 font-bold">NO-GO</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="text-xs font-black text-emerald-500 mb-2 tracking-widest">{s.num}</div>
                <div className="flex justify-center mb-4">
                  <s.Icon size={32} color="#10B981" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* GO / NO-GO visual */}
          <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-8 py-5">
              <span className="text-3xl font-black text-emerald-400">GO</span>
              <span className="text-slate-400 text-sm">Launch with confidence</span>
            </div>
            <span className="text-slate-600 text-2xl font-bold">or</span>
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-8 py-5">
              <span className="text-3xl font-black text-red-400">NO-GO</span>
              <span className="text-slate-400 text-sm">Save your capital</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-slate-950/60">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-3">Why Decisible</p>
          <h2 className="text-3xl font-black text-white mb-3">
            Built for Amazon Sellers Who Think Before They Launch
          </h2>
          <p className="text-slate-400 mb-12 text-lg">
            Stop guessing. Start making decisions backed by data.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {sellerNeeds.map((s) => (
              <div key={s.title} className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 text-left">
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Waitlist */}
      <section id="waitlist" className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-3">Early Access</p>
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Launch <span className="text-emerald-500">Smarter</span>?
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Free beta for the first 500 members. No credit card needed.
          </p>
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-8">
            <WaitlistForm variant="bottom" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-950/60">
        <div className="max-w-md mx-auto text-center">
          <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl font-black text-white mb-4">
            Early Bird <span className="text-emerald-500">Pricing</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg">Lock in the lowest price before we launch.</p>

          <div className="bg-[#1E293B] border border-emerald-500/40 rounded-2xl p-8 relative">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-full tracking-wider uppercase">
                First 50 Subscribers Only
              </span>
            </div>

            {/* Features */}
            <ul className="text-left space-y-3 mb-8 mt-2">
              {[
                'Unlimited GO/NO-GO analyses',
                '5-dimension AI scoring',
                'Export results',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300">
                  <span className="text-emerald-400 text-lg">✅</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="flex items-end justify-center gap-3 mb-2">
              <span className="text-5xl font-black text-white">$29</span>
              <div className="flex flex-col items-start pb-1">
                <span className="text-slate-500 line-through text-lg">$49</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
            </div>
            <p className="text-emerald-400 text-sm font-semibold mb-8">Save $20/mo — Early bird deal</p>

            {/* CTA Button */}
            <a
              href="https://buy.polar.sh/polar_cl_HlU6DvfvjSMfEfKmZ2nNL02UkTC6Bq7xIq1eP2rtilU"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition text-lg"
            >
              Start Now — $29/mo →
            </a>

            <p className="text-slate-500 text-xs mt-4">
              30-day money-back guarantee · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <Link to="/" className="font-black text-white text-lg hover:opacity-80 transition">
            Decisi<span className="text-emerald-500">ble</span>
          </Link>
          <div className="flex gap-6">
            <a href="https://decisible.pages.dev" className="hover:text-slate-300 transition">decisible.pages.dev</a>
            <a href="mailto:hdj0611@gmail.com" className="hover:text-slate-300 transition">hdj0611@gmail.com</a>
          </div>
          <p>© 2026 Decisible. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
