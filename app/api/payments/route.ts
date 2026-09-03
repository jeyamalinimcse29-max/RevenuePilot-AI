import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    seedDatabase(false);
    const payments = db.getPayments();
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
