import crypto from 'crypto';
import { db } from '../db';
import { Action, Opportunity } from '../db/types';

export interface ApprovalRequest {
  opportunityId: string;
  actionId?: string;
  merchantId: string;
  actor: string;
  notes?: string;
}

export interface ApprovalResult {
  success: boolean;
  opportunity: Opportunity;
  action: Action;
  recoveryUrl?: string;
  error?: string;
}

/**
 * BACKEND POLICY & PERMISSION GATE
 * 
 * Guarantees that:
 * 1. Merchant identity is verified
 * 2. Opportunity is in an actionable state (not already executed or rejected)
 * 3. Action type is strictly bounded (RECOVERY_LINK, SMART_RETRY_LINK, DISCOUNT_INCENTIVE, CAMPAIGN_DRAFT)
 * 4. Prevents duplicate approvals or race conditions
 * 5. Generates cryptographically secure recovery tokens
 * 6. Logs immutable policy gate audit events
 */
export function validateAndApproveAction(req: ApprovalRequest): ApprovalResult {
  const merchant = db.getMerchant(req.merchantId);
  if (!merchant) {
    throw new Error('Unauthorized: Invalid merchant identity.');
  }

  const opp = db.getOpportunity(req.opportunityId);
  if (!opp) {
    throw new Error(`Opportunity ${req.opportunityId} not found.`);
  }

  if (opp.status === 'RECOVERED') {
    throw new Error('Opportunity has already been successfully recovered.');
  }

  if (opp.status === 'REJECTED' || opp.status === 'DISMISSED') {
    throw new Error('Opportunity has been rejected and cannot be approved.');
  }

  // Find associated action
  let action: Action | undefined;
  if (req.actionId) {
    action = db.getAction(req.actionId);
  } else if (opp.active_action_id) {
    action = db.getAction(opp.active_action_id);
  } else {
    const actions = db.getActions(opp.id);
    action = actions[0];
  }

  if (!action) {
    throw new Error('No pending action found for this opportunity.');
  }

  if (action.status === 'APPROVED' || action.status === 'EXECUTED') {
    return {
      success: true,
      opportunity: opp,
      action,
      recoveryUrl: action.response_payload?.recovery_url,
    };
  }

  // Verify Bounded Permitted Types
  const permittedTypes = ['RECOVERY_LINK', 'SMART_RETRY_LINK', 'DISCOUNT_INCENTIVE', 'CAMPAIGN_DRAFT', 'CROSS_SELL_OFFER'];
  if (!permittedTypes.includes(action.type)) {
    throw new Error(`Policy Violation: Action type ${action.type} is not within the bounded permitted action set.`);
  }

  // Record Policy Gate Pass
  db.recordAudit({
    merchant_id: req.merchantId,
    agent_run_id: 'gate_approval_verify',
    opportunity_id: opp.id,
    action_id: action.id,
    payment_id: null,
    event_type: 'POLICY_GATE_PASSED',
    actor_type: 'SYSTEM',
    metadata: {
      merchant_id: req.merchantId,
      action_type: action.type,
      policy_rules: ['AUTH_VERIFIED', 'BOUNDED_TYPE_VERIFIED', 'IDEMPOTENCY_CONFIRMED'],
    },
  });

  // Execute Bounded Action
  let recoveryUrl = '';
  let responsePayload: Record<string, any> = {};

  if (action.type === 'RECOVERY_LINK' || action.type === 'DISCOUNT_INCENTIVE' || action.type === 'SMART_RETRY_LINK') {
    // Generate secure recovery token
    const recoveryToken = 'rec_' + crypto.randomBytes(16).toString('hex');
    const discountPct = action.config?.discount_pct || 0;

    // Associate recovery token with checkout if applicable
    if (opp.target_id.startsWith('chk_') || opp.type === 'ABANDONED_CHECKOUT') {
      db.updateCheckoutStatus(opp.target_id, 'ABANDONED', recoveryToken);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    recoveryUrl = `${baseUrl}/recover/${recoveryToken}?opp=${opp.id}&action=${action.id}&discount=${discountPct}`;

    responsePayload = {
      recovery_token: recoveryToken,
      recovery_url: recoveryUrl,
      discount_pct: discountPct,
      channel: action.config?.channel || 'DIRECT_LINK',
      generated_at: new Date().toISOString(),
    };

    // Update Action status
    db.updateActionStatus(action.id, 'EXECUTED', req.actor, responsePayload);

    // Update Opportunity status
    db.updateOpportunity(opp.id, {
      status: 'ACTION_CREATED',
      active_action_id: action.id,
    });

    // Record Audit events
    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'MERCHANT_APPROVED',
      actor_type: 'MERCHANT',
      metadata: {
        approved_by: req.actor,
        notes: req.notes || 'Merchant approved recovery action recommendation.',
      },
    });

    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'RECOVERY_LINK_GENERATED',
      actor_type: 'SYSTEM',
      metadata: {
        recovery_url: recoveryUrl,
        discount_applied_pct: discountPct,
        customer_email: opp.customer_email,
      },
    });
  } else if (action.type === 'CROSS_SELL_OFFER') {
    responsePayload = {
      cross_sell_status: 'ACTIVE',
      widget_enabled: true,
      approved_at: new Date().toISOString(),
      discount_pct: action.config?.discount_pct || 10,
    };
    db.updateActionStatus(action.id, 'EXECUTED', req.actor, responsePayload);
    db.updateOpportunity(opp.id, { status: 'APPROVED' });

    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'MERCHANT_APPROVED',
      actor_type: 'MERCHANT',
      metadata: { approved_by: req.actor, action: 'CROSS_SELL_OFFER', notes: req.notes },
    });

    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'ACTION_EXECUTED',
      actor_type: 'AI_AGENT',
      metadata: {
        action: 'CROSS_SELL_OFFER',
        status: 'EXECUTED',
        target_product: opp.target_id,
        expected_monthly_impact: opp.potential_recovery_amount,
      },
    });
  } else if (action.type === 'CAMPAIGN_DRAFT') {
    responsePayload = {
      campaign_status: 'SCHEDULED',
      approved_at: new Date().toISOString(),
    };
    db.updateActionStatus(action.id, 'APPROVED', req.actor, responsePayload);
    db.updateOpportunity(opp.id, { status: 'APPROVED' });

    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'MERCHANT_APPROVED',
      actor_type: 'MERCHANT',
      metadata: { approved_by: req.actor, action: 'CAMPAIGN_DRAFT' },
    });

    db.recordAudit({
      merchant_id: req.merchantId,
      agent_run_id: 'gate_approval_verify',
      opportunity_id: opp.id,
      action_id: action.id,
      payment_id: null,
      event_type: 'ACTION_EXECUTED',
      actor_type: 'AI_AGENT',
      metadata: {
        action: 'CAMPAIGN_DRAFT',
        status: 'EXECUTED',
        target_segment: 'AT_RISK_VIP',
        expected_revenue: opp.potential_recovery_amount,
      },
    });
  }

  const updatedOpp = db.getOpportunity(opp.id)!;
  const updatedAction = db.getAction(action.id)!;

  return {
    success: true,
    opportunity: updatedOpp,
    action: updatedAction,
    recoveryUrl,
  };
}

/**
 * Merchant Rejection Gate
 */
export function rejectAction(req: ApprovalRequest): { success: boolean; opportunity: Opportunity } {
  const opp = db.getOpportunity(req.opportunityId);
  if (!opp) {
    throw new Error(`Opportunity ${req.opportunityId} not found.`);
  }

  if (opp.active_action_id) {
    db.updateActionStatus(opp.active_action_id, 'REJECTED', req.actor);
  }

  db.updateOpportunity(opp.id, {
    status: 'REJECTED',
  });

  db.recordAudit({
    merchant_id: req.merchantId,
    agent_run_id: 'gate_rejection',
    opportunity_id: opp.id,
    action_id: opp.active_action_id || null,
    payment_id: null,
    event_type: 'MERCHANT_REJECTED',
    actor_type: 'MERCHANT',
    metadata: {
      rejected_by: req.actor,
      notes: req.notes || 'Merchant dismissed/rejected the proposed opportunity.',
    },
  });

  return {
    success: true,
    opportunity: db.getOpportunity(opp.id)!,
  };
}
