import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const checkout = db.getCheckoutByToken(params.token);
    if (!checkout) {
      return NextResponse.json({ success: false, error: 'Invalid or expired recovery link.' }, { status: 404 });
    }

    // Record Customer Return event in audit trail
    db.recordAudit({
      merchant_id: 'mch_razor_pilot_01',
      agent_run_id: 'cust_recovery_flow',
      opportunity_id: null,
      action_id: null,
      payment_id: null,
      event_type: 'CUSTOMER_RETURNED',
      actor_type: 'CUSTOMER',
      metadata: {
        checkout_id: checkout.id,
        customer_name: checkout.customer_name,
        recovery_token: params.token,
        cart_total: checkout.total_amount,
      },
    });

    return NextResponse.json({
      success: true,
      checkout,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
