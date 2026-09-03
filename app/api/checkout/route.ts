import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectOpportunities } from '@/lib/engine/detector';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'create';

    if (action === 'abandon') {
      const checkoutId = body.checkoutId;
      if (!checkoutId) {
        return NextResponse.json({ error: 'checkoutId is required' }, { status: 400 });
      }

      db.updateCheckoutStatus(checkoutId, 'ABANDONED');
      
      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'store_checkout_listener',
        opportunity_id: null,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'CUSTOMER',
        metadata: {
          event: 'CUSTOMER_ABANDONED_CHECKOUT',
          checkout_id: checkoutId,
          step_reached: 'PAYMENT',
        },
      });

      // Run detection
      detectOpportunities();

      return NextResponse.json({
        success: true,
        message: 'Checkout marked as abandoned. Detected by Opportunity Engine.',
        checkout: db.getCheckout(checkoutId),
      });
    }

    // Default: create / start checkout
    const checkoutId = 'chk_' + Math.random().toString(36).substring(2, 9);
    // Resolve to a real customer row so `checkouts.customer_id` always satisfies
    // the foreign key constraint (avoids "FOREIGN KEY constraint failed").
    const resolvedCustomer = db.getOrCreateCustomer(body?.customer);

    const cartItems = body.cartItems || [];
    const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const discount = body.discount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const checkout = db.createCheckout({
      id: checkoutId,
      customer_id: resolvedCustomer.id,
      customer_name: resolvedCustomer.name,
      customer_email: resolvedCustomer.email,
      cart_items: cartItems,
      subtotal,
      discount,
      total_amount: totalAmount,
      status: body.isAbandoned ? 'ABANDONED' : 'IN_PROGRESS',
      step_reached: body.stepReached || 'PAYMENT',
      abandoned_at: body.isAbandoned ? new Date().toISOString() : null,
      recovery_token: null,
      recovery_discount_pct: 0,
    });

    if (body.isAbandoned) {
      detectOpportunities();
    }

    return NextResponse.json({
      success: true,
      checkout,
    });
  } catch (error: any) {
    console.error('Error in checkout route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
