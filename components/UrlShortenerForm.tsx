'use client';

import React, { useState } from 'react';
import { Link2, ArrowRight, Check, Copy, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface UrlShortenerFormProps {
  onUrlCreated?: () => void;
}

export default function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    code: string;
    shortUrl: string;
    originalUrl: string;
    isExisting?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setResult({
        code: data.code,
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        isExisting: data.isExisting,
      });

      setInputUrl('');
      if (onUrlCreated) {
        onUrlCreated();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = result.shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-6 h-6 text-blue-400" />
          Shorten a Long URL
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Paste any long URL to generate a collision-resistant short link with full click tracking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste long URL (e.g., https://example.com/very/long/path)..."
              disabled={loading}
              className="w-full bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Shortening...
              </>
            ) : (
              <>
                Shorten URL
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && (
        <div className="mt-6 pt-6 border-t border-slate-700/60 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Generated Short Link</span>
            {result.isExisting && (
              <span className="text-amber-400 font-normal lowercase">(existing link reused)</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-700 rounded-xl p-3.5">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-mono text-base sm:text-lg font-semibold text-blue-400 truncate block">
                {result.shortUrl}
              </span>
              <span className="text-xs text-slate-400 truncate block mt-0.5" title={result.originalUrl}>
                Target: {result.originalUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors"
                title="Open short URL in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                Visit
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
