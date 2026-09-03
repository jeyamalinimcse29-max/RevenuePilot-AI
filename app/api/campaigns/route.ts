import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import { AgentTools } from '@/lib/agent/tools';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    seedDatabase(false);
    const campaigns = db.getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaign = await AgentTools.create_campaign_draft(body);
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
