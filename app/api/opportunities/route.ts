import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectOpportunities } from '@/lib/engine/detector';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const autoDetect = searchParams.get('detect') === 'true';

    if (autoDetect) {
      detectOpportunities();
    }

    const opportunities = db.getOpportunities(status);
    return NextResponse.json({
      success: true,
      opportunities,
      count: opportunities.length,
    });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
