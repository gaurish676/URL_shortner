import { NextRequest, NextResponse } from 'next/server';
import { getUrlByCode, isReservedSlug } from '@/lib/shortener';
import { recordClick } from '@/lib/tracker';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  // Ignore reserved and asset paths
  if (!code || isReservedSlug(code)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const record = getUrlByCode(code);

  if (!record) {
    // Return friendly HTML 404 page for nonexistent short links
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Link Not Found | URL Shortener</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
          <div class="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center shadow-xl backdrop-blur">
            <div class="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              404
            </div>
            <h1 class="text-2xl font-bold text-white mb-2">Short Link Not Found</h1>
            <p class="text-slate-400 mb-6 text-sm">The link code <span class="font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${code}</span> does not exist or may have been removed.</p>
            <a href="/" class="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Go to Dashboard
            </a>
          </div>
        </body>
      </html>`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // Prevent counting browser prefetch requests if headers specify
  const purpose = request.headers.get('purpose') || request.headers.get('sec-purpose');
  if (purpose !== 'prefetch') {
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');

    recordClick(record.id, {
      userAgent,
      referer,
    });
  }

  // HTTP 307 Temporary Redirect with explicit cache-busting headers
  // This guarantees intermediate proxies & browsers will never cache the redirect and skip click tracking
  const response = NextResponse.redirect(record.original_url, { status: 307 });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
