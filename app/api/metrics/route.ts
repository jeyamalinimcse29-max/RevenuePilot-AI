import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    seedDatabase(false); // auto-init if empty
    const metrics = db.getMetrics();
    const attributions = db.getAttributions();
    return NextResponse.json({
      success: true,
      metrics,
      attributions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
