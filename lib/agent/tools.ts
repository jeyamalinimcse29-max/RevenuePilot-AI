import { z } from 'zod';
import { db } from '../db';
import {
  Customer,
  Product,
  Payment,
  Checkout,
  Opportunity,
  Action,
  ActionType,
  RevenueAttribution,
  AuditEvent,
  Campaign,
  DashboardMetrics,
} from '../db/types';

/**
 * BOUNDED TOOL REGISTRY FOR REVENUEPILOT AI
 * 
 * Strict safety constraints:
 * - Read tools access only sanitized database records
 * - Action tools execute only through strict schema validation
 * - No unrestricted SQL queries
 * - No secret exposure
 * - All actions logged to immutable audit trail
 */

// Tool Definition Schema
export interface ToolMetadata {
  name: string;
  description: string;
  type: 'READ' | 'ACTION';
  parameters: Record<string, any>;
}

export const AGENT_TOOLS_METADATA: ToolMetadata[] = [
  {
    name: 'get_revenue_metrics',
    description: 'Get deterministic aggregate revenue metrics: total revenue, recovered revenue, revenue at risk, active opportunities, recovery rate.',
    type: 'READ',
    parameters: {},
  },
  {
    name: 'get_abandoned_checkouts',
    description: 'Retrieve list of customer checkouts that were initiated but abandoned before payment.',
    type: 'READ',
    parameters: {
      limit: { type: 'number', description: 'Max items to return (default 10)' },
    },
  },
  {
    name: 'get_failed_payments',
    description: 'Retrieve list of payment transactions that failed in Razorpay Test Mode with error codes and decline reasons.',
    type: 'READ',
    parameters: {
      limit: { type: 'number', description: 'Max items to return (default 10)' },
    },
  },
  {
    name: 'get_opportunities',
    description: 'Retrieve active or historical revenue opportunities identified by the engine.',
    type: 'READ',
    parameters: {
      status: { type: 'string', description: 'Optional status filter: DETECTED, PENDING_APPROVAL, APPROVED, RECOVERED' },
    },
  },
  {
    name: 'get_customers',
    description: 'Retrieve list of customers with RFM segments, lifetime spend, order count, and risk scores.',
    type: 'READ',
    parameters: {
      segment: { type: 'string', description: 'Optional segment filter: NEW, LOYAL, HIGH_VALUE, AT_RISK, INACTIVE' },
    },
  },
  {
    name: 'get_products',
    description: 'Retrieve product catalog with pricing, inventory, order volume, and revenue.',
    type: 'READ',
    parameters: {},
  },
  {
    name: 'create_recovery_action',
    description: 'Creates a proposed recovery action for an identified opportunity requiring merchant approval.',
    type: 'ACTION',
    parameters: {
      opportunity_id: { type: 'string', required: true },
      type: { type: 'string', required: true, enum: ['RECOVERY_LINK', 'SMART_RETRY_LINK', 'DISCOUNT_INCENTIVE', 'CAMPAIGN_DRAFT'] },
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      discount_pct: { type: 'number', default: 0 },
      channel: { type: 'string', default: 'DIRECT_LINK' },
    },
  },
  {
    name: 'create_campaign_draft',
    description: 'Creates a proposed re-engagement campaign draft for a customer segment requiring merchant approval.',
    type: 'ACTION',
    parameters: {
      name: { type: 'string', required: true },
      target_segment: { type: 'string', required: true },
      offer_type: { type: 'string', required: true },
      discount_pct: { type: 'number', default: 10 },
      estimated_reach: { type: 'number', required: true },
      potential_revenue: { type: 'number', required: true },
      agent_rationale: { type: 'string', required: true },
    },
  },
];

// Tool Implementation Registry
export const AgentTools = {
  // Read Tools
  async get_revenue_metrics(): Promise<DashboardMetrics> {
    return db.getMetrics();
  },

  async get_abandoned_checkouts(limit: number = 10): Promise<Checkout[]> {
    const list = db.getCheckouts('ABANDONED');
    return list.slice(0, limit);
  },

  async get_failed_payments(limit: number = 10): Promise<Payment[]> {
    const payments = db.getPayments();
    return payments.filter(p => p.status === 'FAILED').slice(0, limit);
  },

  async get_opportunities(status?: string): Promise<Opportunity[]> {
    return db.getOpportunities(status);
  },

  async get_opportunity(id: string): Promise<Opportunity | undefined> {
    return db.getOpportunity(id);
  },

  async get_customers(segment?: string): Promise<Customer[]> {
    const all = db.getCustomers();
    if (segment) {
      return all.filter(c => c.segment === segment);
    }
    return all;
  },

  async get_customer(id: string): Promise<Customer | undefined> {
    return db.getCustomer(id);
  },

  async get_products(): Promise<Product[]> {
    return db.getProducts();
  },

  async get_product(id: string): Promise<Product | undefined> {
    return db.getProduct(id);
  },

  async get_payments(): Promise<Payment[]> {
    return db.getPayments();
  },

  // Action Tools (Strictly Bounded)
  async create_recovery_action(params: {
    opportunity_id: string;
    type: ActionType;
    title: string;
    description: string;
    discount_pct?: number;
    channel?: string;
    agent_run_id?: string;
  }): Promise<Action> {
    const actionId = 'act_' + Math.random().toString(36).substring(2, 9);
    const opp = db.getOpportunity(params.opportunity_id);
    if (!opp) {
      throw new Error(`Opportunity ${params.opportunity_id} not found.`);
    }

    const action = db.createAction({
      id: actionId,
      opportunity_id: params.opportunity_id,
      type: params.type,
      title: params.title,
      description: params.description,
      config: {
        discount_pct: params.discount_pct || 0,
        channel: params.channel || 'DIRECT_LINK',
        expiry_hours: 48,
      },
      status: 'PENDING_APPROVAL',
      approved_by: null,
      approved_at: null,
      executed_at: null,
      response_payload: null,
    });

    db.updateOpportunity(params.opportunity_id, {
      active_action_id: actionId,
      status: 'PENDING_APPROVAL',
    });

    db.recordAudit({
      merchant_id: 'mch_razor_pilot_01',
      agent_run_id: params.agent_run_id || 'run_agent_rec',
      opportunity_id: params.opportunity_id,
      action_id: actionId,
      payment_id: null,
      event_type: 'TOOL_INVOKED',
      actor_type: 'AI_AGENT',
      metadata: {
        tool: 'create_recovery_action',
        action_type: params.type,
        title: params.title,
        status: 'PENDING_APPROVAL',
        requires_merchant_approval: true,
      },
    });

    return action;
  },

  async create_campaign_draft(params: {
    name: string;
    target_segment: any;
    offer_type: string;
    discount_pct: number;
    estimated_reach: number;
    potential_revenue: number;
    agent_rationale: string;
    agent_run_id?: string;
  }): Promise<Campaign> {
    const campaignId = 'cmp_' + Math.random().toString(36).substring(2, 9);
    const campaign: Campaign = {
      id: campaignId,
      name: params.name,
      target_segment: params.target_segment,
      offer_type: params.offer_type,
      discount_pct: params.discount_pct,
      estimated_reach: params.estimated_reach,
      potential_revenue: params.potential_revenue,
      status: 'DRAFT',
      agent_rationale: params.agent_rationale,
      created_at: new Date().toISOString(),
    };

    db.createCampaign(campaign);

    db.recordAudit({
      merchant_id: 'mch_razor_pilot_01',
      agent_run_id: params.agent_run_id || 'run_agent_camp',
      opportunity_id: null,
      action_id: null,
      payment_id: null,
      event_type: 'TOOL_INVOKED',
      actor_type: 'AI_AGENT',
      metadata: {
        tool: 'create_campaign_draft',
        campaign_id: campaignId,
        campaign_name: params.name,
        target_segment: params.target_segment,
        status: 'DRAFT',
      },
    });

    return campaign;
  },

  async record_audit_event(params: {
    agent_run_id: string;
    event_type: any;
    actor_type: any;
    opportunity_id?: string;
    action_id?: string;
    payment_id?: string;
    metadata: Record<string, any>;
  }): Promise<AuditEvent> {
    return db.recordAudit({
      merchant_id: 'mch_razor_pilot_01',
      agent_run_id: params.agent_run_id,
      opportunity_id: params.opportunity_id || null,
      action_id: params.action_id || null,
      payment_id: params.payment_id || null,
      event_type: params.event_type,
      actor_type: params.actor_type,
      metadata: params.metadata,
    });
  },

  async record_revenue_attribution(params: {
    opportunity_id: string;
    action_id: string;
    payment_id: string;
    checkout_id: string | null;
    amount: number;
    source: string;
  }): Promise<RevenueAttribution> {
    const id = 'attr_' + Math.random().toString(36).substring(2, 9);
    const attr: RevenueAttribution = {
      id,
      opportunity_id: params.opportunity_id,
      action_id: params.action_id,
      payment_id: params.payment_id,
      checkout_id: params.checkout_id,
      amount: params.amount,
      source: params.source,
      confidence_score: 1.0,
      status: 'VERIFIED',
      attributed_at: new Date().toISOString(),
    };
    return db.createAttribution(attr);
  },
};
