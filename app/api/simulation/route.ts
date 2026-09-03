import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/db/seed';
import { detectOpportunities } from '@/lib/engine/detector';
import { runFullAgentCycle } from '@/lib/agent/core';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'reset_database') {
      seedDatabase(true);
      return NextResponse.json({
        success: true,
        message: 'Demo database reset to clean initial baseline state.',
      });
    }

    if (action === 'simulate_abandoned_checkout') {
      const checkoutId = 'chk_sim_abn_' + Math.random().toString(36).substring(2, 8);
      const products = db.getProducts();
      const product = products[0] || { id: 'prod_headphone_01', name: 'AeroSound Pro Wireless Headphones', price: 4999, image_url: '' };
      
      const customer = db.getOrCreateCustomer({
        id: 'cust_08',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
      });

      const checkout = db.createCheckout({
        id: checkoutId,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        cart_items: [{ product_id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }],
        subtotal: product.price,
        discount: 0,
        total_amount: product.price,
        status: 'ABANDONED',
        step_reached: 'PAYMENT',
        abandoned_at: new Date().toISOString(),
        recovery_token: null,
        recovery_discount_pct: 0,
      });

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'sim_abandon_trigger',
        opportunity_id: null,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'CUSTOMER',
        metadata: {
          simulation: true,
          checkout_id: checkout.id,
          customer: customer.name,
          amount: product.price,
        },
      });

      // Detect and run agent cycle
      detectOpportunities();

      return NextResponse.json({
        success: true,
        message: `Simulated Abandoned Checkout created for ${customer.name} (₹${product.price.toLocaleString('en-IN')}).`,
        checkout,
      });
    }

    if (action === 'simulate_failed_payment') {
      const paymentId = 'pay_sim_fail_' + Math.random().toString(36).substring(2, 8);
      const orderId = 'order_sim_fail_' + Math.random().toString(36).substring(2, 8);
      const amount = 7499;
      const customer = db.getOrCreateCustomer({
        id: 'cust_02',
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
      });

      const payment = db.createPayment({
        id: paymentId,
        merchant_id: 'mch_razor_pilot_01',
        checkout_id: null,
        customer_id: customer.id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: null,
        amount,
        currency: 'INR',
        status: 'FAILED',
        failure_code: 'BAD_REQUEST_ERROR',
        failure_reason: 'card_declined',
        failure_description: 'The bank declined the transaction due to temporary limit or card security restriction.',
        payment_method: 'card',
        is_recovery_payment: false,
        opportunity_id: null,
        verified_at: null,
      });

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'sim_failed_pay_trigger',
        opportunity_id: null,
        action_id: null,
        payment_id: payment.id,
        event_type: 'PAYMENT_FAILED',
        actor_type: 'RAZORPAY_WEBHOOK',
        metadata: {
          simulation: true,
          payment_id: payment.id,
          order_id: orderId,
          amount,
          failure_reason: 'card_declined',
        },
      });

      // Detect and run agent cycle
      detectOpportunities();

      return NextResponse.json({
        success: true,
        message: `Simulated Payment Failure recorded for ${customer.name} (₹${amount.toLocaleString('en-IN')}).`,
        payment,
      });
    }

    if (action === 'simulate_cross_sell') {
      const oppId = 'opp_cross_sim_' + Math.random().toString(36).substring(2, 8);
      const estRevenue = 8400;

      const opp = db.createOpportunity({
        id: oppId,
        merchant_id: 'mch_razor_pilot_01',
        type: 'CROSS_SELL',
        status: 'DETECTED',
        priority: 'HIGH',
        target_id: 'prod_headphone_01',
        customer_id: 'cust_08',
        customer_name: 'Priya Sharma',
        customer_email: 'priya.sharma@example.com',
        amount_at_risk: estRevenue,
        potential_recovery_amount: estRevenue,
        opportunity_score: 87,
        score_factors: [
          {
            factor: 'Product Affinity Signal',
            points: 35,
            max_points: 35,
            description: '34% of AeroSound Headphones buyers also purchase Nomad Backpack.',
            signal_value: 'Headphones -> Backpack',
          },
          {
            factor: 'AOV Expansion Potential',
            points: 25,
            max_points: 25,
            description: 'Estimated order value uplift of ₹8,400/month.',
            signal_value: '+₹8,400/mo',
          },
        ],
        ai_analysis: {
          summary: 'High cross-sell affinity detected between AeroSound Headphones and Nomad Backpack.',
          signals: [
            '34% co-purchase rate observed across completed store transactions.',
            'Target AOV expansion potential estimated at ₹8,400/month.',
            'Catalog AI Readiness confidence score calculated at 87%.',
          ],
          rationale: 'Promoting Nomad Backpack during headphone checkout increases AOV without additional acquisition spend.',
          recommended_action: {
            type: 'CROSS_SELL_OFFER',
            title: 'Create Cross-Sell Recommendation (Nomad Backpack)',
            description: 'Deploy automated cross-sell offer widget on checkout page.',
            incentive_details: '10% bundle discount when purchased together.',
            discount_pct: 10,
            channel: 'In-Checkout Recommendation Widget',
          },
          expected_outcome: 'Increase AOV and capture ₹8,400/month in incremental revenue.',
          urgency: 'HIGH',
          risk_assessment: 'Low risk. Non-intrusive bundle recommendation.',
          confidence: 87,
        },
      });

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'sim_cross_sell_trigger',
        opportunity_id: opp.id,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'SYSTEM',
        metadata: {
          simulation: true,
          opportunity_type: 'CROSS_SELL',
          estimated_revenue: estRevenue,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Simulated Cross-Sell Opportunity created (Nomad Backpack for Headphones buyers).',
        opportunity: opp,
      });
    }

    if (action === 'simulate_campaign_reengagement') {
      const oppId = 'opp_camp_sim_' + Math.random().toString(36).substring(2, 8);
      const estRevenue = 24600;

      const opp = db.createOpportunity({
        id: oppId,
        merchant_id: 'mch_razor_pilot_01',
        type: 'RE_ENGAGEMENT',
        status: 'DETECTED',
        priority: 'HIGH',
        target_id: 'target_campaign_inactive_vip',
        customer_id: 'cust_22',
        customer_name: 'Arjun Mehta',
        customer_email: 'arjun.mehta@example.com',
        amount_at_risk: estRevenue,
        potential_recovery_amount: estRevenue,
        opportunity_score: 88,
        score_factors: [
          {
            factor: 'Customer Churn Signal',
            points: 30,
            max_points: 30,
            description: '126 inactive high-value accounts with >30 days inactivity.',
            signal_value: '126 VIP Accounts',
          },
          {
            factor: 'Expected Campaign Revenue',
            points: 30,
            max_points: 30,
            description: 'Projected 8-12% conversion uplift yielding ₹24,600.',
            signal_value: '₹24,600',
          },
        ],
        ai_analysis: {
          summary: 'AI Campaign Opportunity: Re-engage 126 inactive high-value customers.',
          signals: [
            'Target segment of 126 dormant accounts with >30 days inactivity window.',
            'Historical cohort average spend exceeds ₹15,000 per customer.',
            'Projected conversion rate of 8-12% upon launching targeted offer campaign.',
          ],
          rationale: 'Targeting dormant high-value customers with a personalized 10% reactivation discount recaptures lost LTV.',
          recommended_action: {
            type: 'CAMPAIGN_DRAFT',
            title: 'Launch Inactive Customer Reactivation Campaign (10% Offer)',
            description: 'Orchestrate targeted reactivation campaign to 126 dormant accounts.',
            incentive_details: '10% promotional reactivation offer.',
            discount_pct: 10,
            channel: 'Multi-Channel Campaign Orchestrator',
          },
          expected_outcome: 'Recapture estimated ₹24,600 in incremental revenue.',
          urgency: 'NORMAL',
          risk_assessment: 'Controlled. Campaign remains in draft until merchant review.',
          confidence: 88,
        },
      });

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'sim_campaign_trigger',
        opportunity_id: opp.id,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'SYSTEM',
        metadata: {
          simulation: true,
          opportunity_type: 'RE_ENGAGEMENT',
          estimated_revenue: estRevenue,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Simulated Campaign Opportunity created (Re-engage 126 inactive customers).',
        opportunity: opp,
      });
    }

    if (action === 'simulate_failed_execution') {
      const opps = db.getOpportunities();
      const targetOpp = opps.find(o => o.status !== 'RECOVERED') || opps[0];

      if (targetOpp) {
        db.updateOpportunity(targetOpp.id, { status: 'FAILED' });
        db.recordAudit({
          merchant_id: 'mch_razor_pilot_01',
          agent_run_id: 'sim_failure_trigger',
          opportunity_id: targetOpp.id,
          action_id: targetOpp.active_action_id || null,
          payment_id: null,
          event_type: 'PAYMENT_FAILED',
          actor_type: 'SYSTEM',
          metadata: {
            simulation: true,
            status: 'FAILED',
            reason: 'Execution API limit exceeded. Action safely halted. Guardrails active.',
          },
        });

        return NextResponse.json({
          success: true,
          message: `Simulated Graceful Execution Failure for opportunity ${targetOpp.id}. Safe stop recorded in audit log.`,
        });
      }
    }

    if (action === 'generate_opportunities' || action === 'run_agent_cycle') {
      const cycleResult = await runFullAgentCycle();
      return NextResponse.json({
        success: true,
        message: `Agent analyzed signals and updated ${cycleResult.analyzed} opportunities with AI reasoning.`,
        cycleResult,
      });
    }

    return NextResponse.json({ error: `Unknown simulation action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error in simulation endpoint:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
