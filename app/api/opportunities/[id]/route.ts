import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyzeOpportunity } from '@/lib/agent/core';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const opp = db.getOpportunity(params.id);
    if (!opp) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    const actions = db.getActions(opp.id);
    const auditLogs = db.getAuditEvents(20, opp.id);

    return NextResponse.json({
      success: true,
      opportunity: opp,
      actions,
      auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Re-run AI analysis for this single opportunity
  try {
    const analysis = await analyzeOpportunity(params.id);
    const updated = db.getOpportunity(params.id);
    return NextResponse.json({
      success: true,
      opportunity: updated,
      analysis,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
