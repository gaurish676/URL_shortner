import { NextResponse } from 'next/server';
import { getAllUrlsWithStats } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const urls = getAllUrlsWithStats();
    return NextResponse.json({ success: true, urls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
