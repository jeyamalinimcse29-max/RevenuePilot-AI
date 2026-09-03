export type CustomerSegment = 'NEW' | 'LOYAL' | 'HIGH_VALUE' | 'AT_RISK' | 'INACTIVE';

export type CheckoutStatus = 'IN_PROGRESS' | 'ABANDONED' | 'RECOVERED' | 'COMPLETED';
export type CheckoutStep = 'CART' | 'SHIPPING' | 'PAYMENT';

export type PaymentStatus = 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export type OpportunityType = 
  | 'ABANDONED_CHECKOUT' 
  | 'FAILED_PAYMENT' 
  | 'INACTIVE_VIP' 
  | 'UPSELL_OPPORTUNITY' 
  | 'CROSS_SELL' 
  | 'RE_ENGAGEMENT';

export type OpportunityStatus = 
  | 'DETECTED' 
  | 'ANALYZING' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ACTION_CREATED' 
  | 'RECOVERED' 
  | 'FAILED' 
  | 'DISMISSED';

export type OpportunityPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ActionType = 
  | 'RECOVERY_LINK' 
  | 'SMART_RETRY_LINK' 
  | 'DISCOUNT_INCENTIVE' 
  | 'CAMPAIGN_DRAFT' 
  | 'CROSS_SELL_OFFER';

export type ActionStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'EXPIRED';

export type AuditEventType =
  | 'AGENT_RUN_STARTED'
  | 'SIGNAL_DETECTED'
  | 'OPPORTUNITY_SCORED'
  | 'AI_REASONING_COMPLETED'
  | 'APPROVAL_REQUESTED'
  | 'MERCHANT_APPROVED'
  | 'MERCHANT_REJECTED'
  | 'POLICY_GATE_PASSED'
  | 'TOOL_INVOKED'
  | 'ACTION_EXECUTED'
  | 'RECOVERY_LINK_GENERATED'
  | 'CUSTOMER_RETURNED'
  | 'RAZORPAY_ORDER_CREATED'
  | 'PAYMENT_ATTEMPTED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFIED'
  | 'WEBHOOK_RECEIVED'
  | 'REVENUE_ATTRIBUTED';

export type ActorType = 'SYSTEM' | 'AI_AGENT' | 'MERCHANT' | 'CUSTOMER' | 'RAZORPAY_WEBHOOK';

export interface Merchant {
  id: string;
  name: string;
  email: string;
  currency: string;
  razorpay_key_id: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lifetime_spend: number;
  total_orders: number;
  last_purchase_at: string | null;
  segment: CustomerSegment;
  risk_score: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  image_url: string;
  description: string;
  inventory: number;
  order_count: number;
  total_revenue: number;
  created_at: string;
  ai_ready?: boolean;
  related_product_id?: string | null;
  related_product_name?: string | null;
  target_segment?: string | null;
  cross_sell_confidence?: number | null;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface Checkout {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  cart_items: CartItem[];
  subtotal: number;
  discount: number;
  total_amount: number;
  status: CheckoutStatus;
  step_reached: CheckoutStep;
  abandoned_at: string | null;
  recovery_token: string | null;
  recovery_discount_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  merchant_id: string;
  checkout_id: string | null;
  customer_id: string;
  customer_name?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failure_code: string | null;
  failure_reason: string | null;
  failure_description: string | null;
  payment_method: string | null;
  is_recovery_payment: boolean;
  opportunity_id: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface ScoreFactor {
  factor: string;
  points: number;
  max_points: number;
  description: string;
  signal_value: string;
}

export interface AIAnalysis {
  summary: string;
  signals: string[];
  rationale: string;
  recommended_action: {
    type: ActionType;
    title: string;
    description: string;
    incentive_details: string;
    discount_pct: number;
    channel: string;
  };
  expected_outcome: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'NORMAL';
  risk_assessment: string;
  confidence?: number;
}

export interface Opportunity {
  id: string;
  merchant_id: string;
  type: OpportunityType;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  target_id: string; // checkout_id, payment_id, customer_id, or product_id
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  amount_at_risk: number;
  potential_recovery_amount: number;
  opportunity_score: number;
  score_factors: ScoreFactor[];
  ai_analysis: AIAnalysis | null;
  active_action_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionConfig {
  discount_pct?: number;
  expiry_hours?: number;
  recovery_url?: string;
  message_template?: string;
  channel?: string;
  razorpay_order_id?: string;
  cross_sell_product_id?: string;
  campaign_id?: string;
}

export interface Action {
  id: string;
  opportunity_id: string;
  type: ActionType;
  title: string;
  description: string;
  config: ActionConfig;
  status: ActionStatus;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  response_payload: Record<string, any> | null;
  created_at: string;
}

export interface RevenueAttribution {
  id: string;
  opportunity_id: string;
  action_id: string;
  payment_id: string;
  checkout_id: string | null;
  amount: number;
  source: string;
  confidence_score: number;
  status: 'VERIFIED';
  attributed_at: string;
}

export interface AuditEvent {
  id: string;
  merchant_id: string;
  agent_run_id: string;
  opportunity_id: string | null;
  action_id: string | null;
  payment_id: string | null;
  event_type: AuditEventType;
  actor_type: ActorType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  target_segment: CustomerSegment;
  offer_type: string;
  discount_pct: number;
  estimated_reach: number;
  potential_revenue: number;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  agent_rationale: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_revenue: number;
  recovered_revenue: number;
  ai_attributed_revenue: number;
  revenue_at_risk: number;
  potential_growth_revenue: number;
  average_order_value: number;
  active_opportunities_count: number;
  recovery_rate_pct: number;
  failed_payment_count: number;
  abandoned_checkout_count: number;
  recovered_count: number;
}

