import { NextResponse } from 'next/server';
import { rejectAction } from '@/lib/policy/gate';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const merchantId = body.merchantId || 'mch_razor_pilot_01';
    const actor = body.actor || 'Merchant Admin (Dashboard)';
    const notes = body.notes;

    const result = rejectAction({
      opportunityId: params.id,
      merchantId,
      actor,
      notes,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error('Error rejecting action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
