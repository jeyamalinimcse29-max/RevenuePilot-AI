import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment') || undefined;
    const customers = db.getCustomers();
    const filtered = segment ? customers.filter(c => c.segment === segment) : customers;
    return NextResponse.json({ success: true, customers: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
