import { useState } from 'react';

const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/hdj0611@gmail.com';

interface Props {
  variant?: 'hero' | 'bottom';
}

export default function WaitlistForm({ variant = 'hero' }: Props) {
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');

    try {
      const res = await fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          challenge: challenge || '(not provided)',
          _subject: 'New Decisible Waitlist Signup!',
          _captcha: 'false',
        }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setChallenge('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-2xl font-bold text-white mb-2">You're in!</p>
        <p className="text-slate-400">
          We'll notify you when Decisible launches. Stay sharp.
        </p>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-base"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? 'Joining...' : 'Join Waitlist →'}
          </button>
        </div>
        {status === 'error' && (
          <p className="text-red-400 text-sm mt-3 text-center">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
      />
      <textarea
        value={challenge}
        onChange={e => setChallenge(e.target.value)}
        placeholder="What's your biggest challenge when launching on Amazon? (optional)"
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg rounded-xl transition disabled:opacity-60"
      >
        {status === 'loading' ? 'Joining...' : "Join the Waitlist — It's Free →"}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm text-center">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
