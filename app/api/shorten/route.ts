import { NextRequest, NextResponse } from 'next/server';
import { normalizeAndValidateUrl, createOrGetShortUrl } from '@/lib/shortener';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    const hostHeader = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const validation = normalizeAndValidateUrl(url, hostHeader);

    if (!validation.valid || !validation.normalizedUrl) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid URL' },
        { status: 400 }
      );
    }

    const { urlRecord, isExisting } = createOrGetShortUrl(validation.normalizedUrl);

    // Compute protocol & host for absolute short URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = hostHeader || 'localhost:3000';
    const shortUrl = `${protocol}://${host}/${urlRecord.code}`;

    return NextResponse.json(
      {
        success: true,
        code: urlRecord.code,
        shortUrl,
        originalUrl: urlRecord.original_url,
        createdAt: urlRecord.created_at,
        isExisting,
      },
      { status: isExisting ? 200 : 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
