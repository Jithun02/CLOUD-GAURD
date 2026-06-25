import { NextResponse } from 'next/server';
import { getAwsSummary } from '../../../lib/aws';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = await getAwsSummary();
  return NextResponse.json(summary, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}