import { NextRequest, NextResponse } from 'next/server';
import { getUrlDetailedAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    const analytics = getUrlDetailedAnalytics(code);
    if (!analytics) {
      return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, analytics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
