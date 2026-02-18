'use client';

import { useState } from 'react';

export default function PlayPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/play/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Something went wrong');
      }

      window.location.href = '/play/welcome';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight">
            oh darling,<br />
            it&apos;s all about to begin.
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            disabled={loading}
            className="w-full px-6 py-4 text-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7dd3c0]"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 text-lg font-sans tracking-wider bg-[#7dd3c0] text-black hover:bg-[#6bc2af] transition-colors disabled:opacity-50"
          >
            {loading ? "INITIATING..." : "LET'S PLAY"}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-gray-500 text-sm text-center mt-8">
          We respect your privacy. Unsubscribe at any time.
        </p>

        <p className="text-gray-700 text-xs text-center mt-12">
          © 2025
        </p>
      </div>
    </div>
  );
}
