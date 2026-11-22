'use client';

import React, { useState } from 'react';
import { Copy, Check, BarChart2, ExternalLink, Calendar, MousePointerClick, Search, RefreshCw } from 'lucide-react';

export interface UrlItem {
  id: string;
  code: string;
  original_url: string;
  created_at: string;
  total_clicks: number;
  last_clicked: string | null;
}

interface UrlListProps {
  urls: UrlItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectUrl: (code: string) => void;
}

export default function UrlList({ urls, loading, onRefresh, onSelectUrl }: UrlListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shortUrl = `${window.location.origin}/${code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const filteredUrls = urls.filter(
    (u) =>
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.original_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" />
            Shortened URLs & Analytics Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track performance metrics, click counts, and detailed real-time logs for each link.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm text-white rounded-xl pl-9 pr-3 py-2 w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading && urls.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
          <p>Loading your shortened links...</p>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-700/80 rounded-xl bg-slate-900/30">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {searchTerm ? 'No matching links found' : 'No shortened links yet'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? `No URLs matched "${searchTerm}". Try a different search term.`
              : 'Paste a long link above to generate your first tracked short URL.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <th className="py-3 px-4">Short Code & Link</th>
                <th className="py-3 px-4">Original Destination</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Total Clicks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUrls.map((url) => {
                const isCopied = copiedCode === url.code;
                return (
                  <tr
                    key={url.id}
                    onClick={() => onSelectUrl(url.code)}
                    className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-sm">
                          /{url.code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(url.code, e)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                          title="Copy short URL"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="truncate block font-normal" title={url.original_url}>
                          {url.original_url}
                        </span>
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 hover:text-slate-300 p-1 flex-shrink-0"
                          title="Visit original URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(url.created_at)}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {url.total_clicks} {url.total_clicks === 1 ? 'click' : 'clicks'}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUrl(url.code);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm group-hover:bg-indigo-600 group-hover:text-white"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        View Analytics
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
