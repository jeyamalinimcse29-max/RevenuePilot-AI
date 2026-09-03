import { NextResponse } from 'next/server';
import { processVerifiedPayment } from '@/lib/razorpay/verification';
import { db } from '@/lib/db';
import { detectOpportunities } from '@/lib/engine/detector';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if client is reporting a simulated or real payment failure
    if (body.status === 'FAILED' || body.failed) {
      const orderId = body.razorpay_order_id || 'order_fail_' + Date.now();
      const paymentId = body.razorpay_payment_id || 'pay_fail_' + Math.random().toString(36).substring(2, 9);
      const amount = Number(body.amount) || 4999;
      const failureReason = body.failure_reason || 'card_declined';
      const failureDescription = body.failure_description || 'Card declined by issuing bank during 3D Secure verification.';
      const customerId = body.customerId || 'cust_02';

      let payment = db.getPaymentByOrderId(orderId);
      if (payment) {
        db.updatePaymentFailure(payment.id, 'BAD_REQUEST_ERROR', failureReason, failureDescription);
      } else {
        const resolvedCustomer = db.getOrCreateCustomer({ id: customerId });
        payment = db.createPayment({
          id: paymentId,
          merchant_id: 'mch_razor_pilot_01',
          checkout_id: body.checkoutId || null,
          customer_id: resolvedCustomer.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: null,
          amount,
          currency: 'INR',
          status: 'FAILED',
          failure_code: 'BAD_REQUEST_ERROR',
          failure_reason: failureReason,
          failure_description: failureDescription,
          payment_method: body.payment_method || 'card',
          is_recovery_payment: false,
          opportunity_id: null,
          verified_at: null,
        });
      }

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'rzp_client_event',
        opportunity_id: null,
        action_id: null,
        payment_id: payment.id,
        event_type: 'PAYMENT_FAILED',
        actor_type: 'RAZORPAY_WEBHOOK',
        metadata: {
          order_id: orderId,
          payment_id: paymentId,
          failure_reason: failureReason,
          failure_description: failureDescription,
          amount,
        },
      });

      // Run detection to generate failed payment opportunity
      detectOpportunities();

      return NextResponse.json({
        success: false,
        paymentStatus: 'FAILED',
        message: 'Payment failed and recorded in ledger. Agent opportunity generated for revenue at risk.',
      });
    }

    // Handle Successful Payment Verification
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    const opportunityId = body.opportunityId;
    const actionId = body.actionId;
    const checkoutId = body.checkoutId;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'order_id and payment_id are required' }, { status: 400 });
    }

    const result = await processVerifiedPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature || 'sig_test_verified',
      opportunity_id: opportunityId,
      action_id: actionId,
      checkout_id: checkoutId,
    });

    if (!result.verified) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
      metrics: db.getMetrics(),
    });
  } catch (error: any) {
    console.error('Error in payment verification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
