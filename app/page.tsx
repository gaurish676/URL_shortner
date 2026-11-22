'use client';

import React, { useState, useEffect, useCallback } from 'react';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlList, { UrlItem } from '@/components/UrlList';
import UrlAnalyticsModal from '@/components/UrlAnalyticsModal';
import { Sparkles, Activity, Link as LinkIcon, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/urls');
      const data = await res.json();
      if (res.ok && data.success) {
        setUrls(data.urls || []);
      }
    } catch (err) {
      console.error('Failed to load URLs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const totalClicksAcrossAll = urls.reduce((acc, curr) => acc + (Number(curr.total_clicks) || 0), 0);

  return (
    <main className="min-h-screen text-slate-100 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header section */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Next.js Real-Time URL Platform
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          LinkPulse
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Shorten long links instantly with collision-resistant routing and deep timestamped click analytics.
        </p>

        {/* Global Metric Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8 text-sm">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2">
            <LinkIcon className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">{urls.length}</span>
            <span className="text-slate-400">URLs Created</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">{totalClicksAcrossAll}</span>
            <span className="text-slate-400">Total Visits Tracked</span>
          </div>
        </div>
      </header>

      {/* Feature 1: URL Shortener Form */}
      <section aria-label="URL Shortener Form">
        <UrlShortenerForm onUrlCreated={fetchUrls} />
      </section>

      {/* Feature 2 & 3: Analytics Dashboard & URLs Table */}
      <section aria-label="Analytics Dashboard">
        <UrlList
          urls={urls}
          loading={loading}
          onRefresh={fetchUrls}
          onSelectUrl={(code) => setSelectedCode(code)}
        />
      </section>

      {/* Feature 3: Detailed Analytics Modal */}
      <UrlAnalyticsModal
        code={selectedCode}
        onClose={() => setSelectedCode(null)}
      />

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-500 py-6 border-t border-slate-800/60">
        LinkPulse URL Shortener & Analytics &bull; Next.js App Router &bull; SQLite Persistence
      </footer>
    </main>
  );
}
