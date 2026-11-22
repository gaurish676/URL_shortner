'use client';

import React, { useEffect, useState } from 'react';
import { X, MousePointerClick, Calendar, Clock, Globe, Laptop, ArrowUpRight, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface ClickItem {
  id: string;
  timestamp: string;
  user_agent: string | null;
  referer: string | null;
}

interface AnalyticsData {
  id: string;
  code: string;
  original_url: string;
  created_at: string;
  totalClicks: number;
  clicks: ClickItem[];
}

interface UrlAnalyticsModalProps {
  code: string | null;
  onClose: () => void;
}

export default function UrlAnalyticsModal({ code, onClose }: UrlAnalyticsModalProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/urls/${code}/analytics`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load analytics');
        }
        setData(json.analytics);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [code]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!code) return null;

  const shortUrl = typeof window !== 'undefined' ? `${window.location.origin}/${code}` : `/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return {
        formatted: d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        iso: ts,
      };
    } catch {
      return { formatted: ts, iso: ts };
    }
  };

  const getRelativeTime = (ts: string) => {
    try {
      const diffMs = Date.now() - new Date(ts).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const parseBrowser = (ua: string | null) => {
    if (!ua) return 'Direct / Unknown';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('curl/')) return 'cURL CLI';
    return ua.slice(0, 24);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/25">
                /{code}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            {data && (
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2 truncate max-w-xl">
                <span>Target:</span>
                <a
                  href={data.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-blue-400 underline truncate flex items-center gap-1"
                >
                  {data.original_url}
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !data ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-3" />
              <p>Fetching click telemetry and analytics...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Total Clicks</span>
                    <MousePointerClick className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">
                    {data.totalClicks}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Recorded across all devices
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>First Click</span>
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {data.clicks.length > 0
                      ? formatTimestamp(data.clicks[data.clicks.length - 1].timestamp).formatted
                      : 'No clicks yet'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.clicks.length > 0
                      ? getRelativeTime(data.clicks[data.clicks.length - 1].timestamp)
                      : 'Awaiting first visitor'}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Most Recent Click</span>
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {data.clicks.length > 0
                      ? formatTimestamp(data.clicks[0].timestamp).formatted
                      : 'No clicks yet'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.clicks.length > 0
                      ? getRelativeTime(data.clicks[0].timestamp)
                      : 'Awaiting activity'}
                  </div>
                </div>
              </div>

              {/* Click Log Table */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Timestamped Click Activity History ({data.clicks.length})
                  </h3>
                  {data.clicks.length > 100 && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Showing latest 100 of {data.clicks.length} clicks
                    </span>
                  )}
                </div>

                {data.clicks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No clicks have been recorded for this short link yet.
                    <p className="text-xs text-slate-500 mt-1">
                      Share the link or visit it directly to observe real-time tracking here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-700/80 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Timestamp (UTC / Local)</th>
                          <th className="py-2.5 px-4">Relative Time</th>
                          <th className="py-2.5 px-4">Client / User-Agent</th>
                          <th className="py-2.5 px-4">Referrer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {data.clicks.slice(0, 100).map((click, index) => {
                          const formatted = formatTimestamp(click.timestamp);
                          return (
                            <tr key={click.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="py-3 px-4 text-slate-500 font-mono">
                                {data.clicks.length - index}
                              </td>
                              <td className="py-3 px-4 font-mono whitespace-nowrap">
                                <span className="text-white font-medium">{formatted.formatted}</span>
                                <span className="text-slate-500 block text-[10px] mt-0.5">{formatted.iso}</span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                                {getRelativeTime(click.timestamp)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5" title={click.user_agent || 'Unknown'}>
                                  <Laptop className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="truncate max-w-[200px] text-slate-300">
                                    {parseBrowser(click.user_agent)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1 text-slate-400 truncate max-w-[160px]">
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                                  <span className="truncate">
                                    {click.referer || 'Direct visit'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
