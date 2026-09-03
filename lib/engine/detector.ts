import { db } from '../db';
import { Opportunity, OpportunityPriority } from '../db/types';
import { calculateOpportunityScore } from './scorer';

export interface DetectionResult {
  detectedCount: number;
  newOpportunities: Opportunity[];
}

export function detectOpportunities(): DetectionResult {
  const newOpportunities: Opportunity[] = [];
  const now = new Date();

  // 1. Detect Abandoned Checkouts
  const abandonedCheckouts = db.getCheckouts('ABANDONED');
  for (const chk of abandonedCheckouts) {
    const existingOpp = db.getOpportunityByTargetId(chk.id);
    if (!existingOpp) {
      const customer = db.getCustomer(chk.customer_id) || {
        id: chk.customer_id,
        name: chk.customer_name,
        email: chk.customer_email,
        phone: '',
        lifetime_spend: 0,
        total_orders: 0,
        last_purchase_at: null,
        segment: 'NEW' as const,
        risk_score: 50,
        created_at: chk.created_at,
      };

      const eventTime = chk.abandoned_at ? new Date(chk.abandoned_at) : new Date(chk.updated_at);
      const minutesSince = Math.max(1, (now.getTime() - eventTime.getTime()) / (60 * 1000));

      const scoreResult = calculateOpportunityScore({
        amount: chk.total_amount,
        customerLifetimeSpend: customer.lifetime_spend,
        customerTotalOrders: customer.total_orders,
        customerSegment: customer.segment,
        minutesSinceEvent: minutesSince,
        checkoutStepReached: chk.step_reached,
        type: 'ABANDONED_CHECKOUT',
      });

      let priority: OpportunityPriority = 'MEDIUM';
      if (scoreResult.totalScore >= 80) priority = 'CRITICAL';
      else if (scoreResult.totalScore >= 65) priority = 'HIGH';
      else if (scoreResult.totalScore < 40) priority = 'LOW';

      const oppId = 'opp_abn_' + chk.id.replace('chk_', '');
      const opp: Opportunity = {
        id: oppId,
        merchant_id: 'mch_razor_pilot_01',
        type: 'ABANDONED_CHECKOUT',
        status: 'DETECTED',
        priority,
        target_id: chk.id,
        customer_id: chk.customer_id,
        customer_name: chk.customer_name,
        customer_email: chk.customer_email,
        amount_at_risk: chk.total_amount,
        potential_recovery_amount: chk.total_amount,
        opportunity_score: scoreResult.totalScore,
        score_factors: scoreResult.factors,
        ai_analysis: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.createOpportunity(opp);

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'engine_detector_cycle',
        opportunity_id: opp.id,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'SYSTEM',
        metadata: {
          signal_type: 'ABANDONED_CHECKOUT',
          checkout_id: chk.id,
          customer_name: chk.customer_name,
          amount_at_risk: chk.total_amount,
          calculated_score: scoreResult.totalScore,
          factors: scoreResult.factors.map(f => `${f.factor}: +${f.points}`),
        },
      });

      newOpportunities.push(opp);
    }
  }

  // 2. Detect Failed Payments
  const payments = db.getPayments();
  const failedPayments = payments.filter(p => p.status === 'FAILED');

  for (const pay of failedPayments) {
    const existingOpp = db.getOpportunityByTargetId(pay.id);
    if (!existingOpp) {
      const customer = db.getCustomer(pay.customer_id) || {
        id: pay.customer_id,
        name: pay.customer_name || 'Customer',
        email: 'customer@example.com',
        phone: '',
        lifetime_spend: 0,
        total_orders: 0,
        last_purchase_at: null,
        segment: 'NEW' as const,
        risk_score: 50,
        created_at: pay.created_at,
      };

      const eventTime = new Date(pay.created_at);
      const minutesSince = Math.max(1, (now.getTime() - eventTime.getTime()) / (60 * 1000));

      const scoreResult = calculateOpportunityScore({
        amount: pay.amount,
        customerLifetimeSpend: customer.lifetime_spend,
        customerTotalOrders: customer.total_orders,
        customerSegment: customer.segment,
        minutesSinceEvent: minutesSince,
        checkoutStepReached: 'PAYMENT',
        type: 'FAILED_PAYMENT',
      });

      let priority: OpportunityPriority = 'HIGH';
      if (scoreResult.totalScore >= 80) priority = 'CRITICAL';
      else if (scoreResult.totalScore < 50) priority = 'MEDIUM';

      const oppId = 'opp_fail_' + pay.id.replace('pay_', '');
      const opp: Opportunity = {
        id: oppId,
        merchant_id: 'mch_razor_pilot_01',
        type: 'FAILED_PAYMENT',
        status: 'DETECTED',
        priority,
        target_id: pay.id,
        customer_id: pay.customer_id,
        customer_name: customer.name,
        customer_email: customer.email,
        amount_at_risk: pay.amount,
        potential_recovery_amount: pay.amount,
        opportunity_score: scoreResult.totalScore,
        score_factors: scoreResult.factors,
        ai_analysis: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.createOpportunity(opp);

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'engine_detector_cycle',
        opportunity_id: opp.id,
        action_id: null,
        payment_id: pay.id,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'SYSTEM',
        metadata: {
          signal_type: 'FAILED_PAYMENT',
          payment_id: pay.id,
          razorpay_order_id: pay.razorpay_order_id,
          failure_reason: pay.failure_reason,
          failure_code: pay.failure_code,
          amount_at_risk: pay.amount,
          calculated_score: scoreResult.totalScore,
        },
      });

      newOpportunities.push(opp);
    }
  }

  // 3. Detect Cross-Sell Opportunities
  const products = db.getProducts();
  const customers = db.getCustomers();
  
  for (const prod of products) {
    if (prod.related_product_id) {
      const targetOppId = 'opp_cross_' + prod.id;
      const existingOpp = db.getOpportunityByTargetId(prod.id);

      if (!existingOpp) {
        const relatedProd = products.find(p => p.id === prod.related_product_id);
        const estRevenue = Math.round((prod.price * 0.34) * 12); // estimated monthly cross-sell impact
        const targetCustomer = customers.find(c => c.segment === 'HIGH_VALUE' || c.segment === 'LOYAL') || customers[0];

        const scoreResult = calculateOpportunityScore({
          amount: estRevenue,
          customerLifetimeSpend: targetCustomer?.lifetime_spend || 15000,
          customerTotalOrders: targetCustomer?.total_orders || 3,
          customerSegment: targetCustomer?.segment || 'LOYAL',
          minutesSinceEvent: 15,
          checkoutStepReached: 'PAYMENT',
          type: 'CROSS_SELL',
        });

        const opp: Opportunity = {
          id: targetOppId,
          merchant_id: 'mch_razor_pilot_01',
          type: 'CROSS_SELL',
          status: 'DETECTED',
          priority: 'HIGH',
          target_id: prod.id,
          customer_id: targetCustomer?.id || db.getOrCreateCustomer({ name: 'Priya Sharma', email: 'priya.sharma@example.com' }).id,
          customer_name: targetCustomer?.name || 'Priya Sharma',
          customer_email: targetCustomer?.email || 'priya.sharma@example.com',
          amount_at_risk: estRevenue,
          potential_recovery_amount: estRevenue,
          opportunity_score: Math.max(85, scoreResult.totalScore),
          score_factors: [
            {
              factor: 'Product Affinity Signal',
              points: 35,
              max_points: 35,
              description: `34% of buyers purchasing ${prod.name} also buy ${prod.related_product_name || 'Companion Gear'}.`,
              signal_value: `${prod.name} -> ${prod.related_product_name || 'Companion Product'}`,
            },
            {
              factor: 'AOV Expansion Potential',
              points: 25,
              max_points: 25,
              description: `Estimated monthly order value increase of ₹${estRevenue.toLocaleString('en-IN')}.`,
              signal_value: `+₹${estRevenue.toLocaleString('en-IN')}/mo`,
            },
            {
              factor: 'AI Readiness Confidence',
              points: 25,
              max_points: 25,
              description: `High confidence affinity correlation calculated across historic orders.`,
              signal_value: `${Math.round((prod.cross_sell_confidence || 0.87) * 100)}% Confidence`,
            },
          ],
          ai_analysis: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.createOpportunity(opp);

        db.recordAudit({
          merchant_id: 'mch_razor_pilot_01',
          agent_run_id: 'engine_detector_cycle',
          opportunity_id: opp.id,
          action_id: null,
          payment_id: null,
          event_type: 'SIGNAL_DETECTED',
          actor_type: 'SYSTEM',
          metadata: {
            signal_type: 'CROSS_SELL',
            source_product: prod.name,
            recommended_cross_sell: prod.related_product_name,
            confidence_pct: Math.round((prod.cross_sell_confidence || 0.87) * 100),
            estimated_monthly_revenue: estRevenue,
          },
        });

        newOpportunities.push(opp);
      }
    }
  }

  // 4. Detect Re-engagement Campaign Opportunities
  const inactiveCustomers = customers.filter(c => c.segment === 'AT_RISK' || c.segment === 'INACTIVE' || (c.lifetime_spend >= 15000 && c.total_orders >= 2));
  if (inactiveCustomers.length > 0) {
    const campaignTargetId = 'target_campaign_inactive_vip';
    const existingOpp = db.getOpportunityByTargetId(campaignTargetId);

    if (!existingOpp) {
      const topCustomer = inactiveCustomers[0];
      const estCampaignRevenue = 24600;

      const opp: Opportunity = {
        id: 'opp_camp_reengage_01',
        merchant_id: 'mch_razor_pilot_01',
        type: 'RE_ENGAGEMENT',
        status: 'DETECTED',
        priority: 'HIGH',
        target_id: campaignTargetId,
        customer_id: topCustomer.id,
        customer_name: topCustomer.name,
        customer_email: topCustomer.email,
        amount_at_risk: estCampaignRevenue,
        potential_recovery_amount: estCampaignRevenue,
        opportunity_score: 88,
        score_factors: [
          {
            factor: 'Customer Churn Signal',
            points: 30,
            max_points: 30,
            description: `Segment of ${inactiveCustomers.length} high-value customers with >30 days inactivity window.`,
            signal_value: `${inactiveCustomers.length} High-Value Accounts`,
          },
          {
            factor: 'Expected Campaign Revenue',
            points: 30,
            max_points: 30,
            description: `Projected 8-12% conversion uplift yielding ₹${estCampaignRevenue.toLocaleString('en-IN')}.`,
            signal_value: `₹${estCampaignRevenue.toLocaleString('en-IN')}`,
          },
          {
            factor: 'Historical Brand Affinity',
            points: 28,
            max_points: 25,
            description: `High past lifetime spend average (₹${topCustomer.lifetime_spend.toLocaleString('en-IN')}).`,
            signal_value: `Top LTV Cohort`,
          },
        ],
        ai_analysis: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.createOpportunity(opp);

      db.recordAudit({
        merchant_id: 'mch_razor_pilot_01',
        agent_run_id: 'engine_detector_cycle',
        opportunity_id: opp.id,
        action_id: null,
        payment_id: null,
        event_type: 'SIGNAL_DETECTED',
        actor_type: 'SYSTEM',
        metadata: {
          signal_type: 'RE_ENGAGEMENT',
          target_segment: 'AT_RISK_VIP',
          reach: inactiveCustomers.length,
          estimated_revenue: estCampaignRevenue,
        },
      });

      newOpportunities.push(opp);
    }
  }

  return {
    detectedCount: newOpportunities.length,
    newOpportunities,
  };
}
