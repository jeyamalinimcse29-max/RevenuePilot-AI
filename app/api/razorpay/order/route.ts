import { NextResponse } from 'next/server';
import { createTestOrder } from '@/lib/razorpay/client';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const currency = body.currency || 'INR';
    const checkoutId = body.checkoutId;
    const opportunityId = body.opportunityId;
    const actionId = body.actionId;
    const customerId = body.customerId || 'cust_08';

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Resolve to a real customer row so `payments.customer_id` passes the FK check.
    const resolvedCustomer = db.getOrCreateCustomer({ id: customerId });

    const order = await createTestOrder({
      amount,
      currency,
      receipt: `rcpt_${checkoutId || 'dir'}_${Date.now()}`,
      notes: {
        checkout_id: checkoutId || '',
        opportunity_id: opportunityId || '',
        action_id: actionId || '',
        customer_id: customerId,
      },
    });

    // Create payment record in CREATED state
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 9);
    db.createPayment({
      id: paymentId,
      merchant_id: 'mch_razor_pilot_01',
      checkout_id: checkoutId || null,
      customer_id: resolvedCustomer.id,
      razorpay_order_id: order.id,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount,
      currency,
      status: 'CREATED',
      failure_code: null,
      failure_reason: null,
      failure_description: null,
      payment_method: null,
      is_recovery_payment: Boolean(opportunityId),
      opportunity_id: opportunityId || null,
      verified_at: null,
    });

    db.recordAudit({
      merchant_id: 'mch_razor_pilot_01',
      agent_run_id: 'rzp_order_init',
      opportunity_id: opportunityId || null,
      action_id: actionId || null,
      payment_id: paymentId,
      event_type: 'RAZORPAY_ORDER_CREATED',
      actor_type: 'SYSTEM',
      metadata: {
        order_id: order.id,
        amount,
        currency,
        is_recovery: Boolean(opportunityId),
        is_simulated: order.is_simulated,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo123456789',
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
