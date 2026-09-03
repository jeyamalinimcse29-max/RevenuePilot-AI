import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 100;
    const opportunityId = searchParams.get('opportunityId') || undefined;

    const auditEvents = db.getAuditEvents(limit, opportunityId);
    return NextResponse.json({
      success: true,
      events: auditEvents,
      count: auditEvents.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
