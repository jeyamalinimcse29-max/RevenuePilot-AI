import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { processRazorpayWebhook } from '@/lib/razorpay/verification';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Read the raw body so the HMAC is computed over the exact bytes Razorpay signed.
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Webhook secret is not configured (RAZORPAY_WEBHOOK_SECRET).' },
        { status: 500 }
      );
    }

    const isValid = Razorpay.validateWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'rzp_webhook_listener',
        opportunity_id: null,
        action_id: null,
        payment_id: null,
        event_type: 'PAYMENT_FAILED',
        actor_type: 'RAZORPAY_WEBHOOK',
        metadata: {
          error: 'Invalid Razorpay webhook HMAC signature',
          event_security: 'REJECTED',
        },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature.' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const result = await processRazorpayWebhook(payload);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}