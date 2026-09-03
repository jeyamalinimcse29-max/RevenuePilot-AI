import { ScoreFactor, OpportunityType } from '../db/types';

export interface ScoreInput {
  amount: number;
  customerLifetimeSpend: number;
  customerTotalOrders: number;
  customerSegment: string;
  minutesSinceEvent: number;
  checkoutStepReached: 'CART' | 'SHIPPING' | 'PAYMENT';
  type: OpportunityType;
}

export interface ScoreResult {
  totalScore: number;
  factors: ScoreFactor[];
}

/**
 * Deterministic Transparent Opportunity Scorer (0 - 100)
 * Calculates the merchant value and urgency of a detected signal.
 * NOT an AI probability estimate, but a deterministic priority index.
 */
export function calculateOpportunityScore(input: ScoreInput): ScoreResult {
  const factors: ScoreFactor[] = [];

  // Factor 1: Cart / Transaction Value (0 - 35 points)
  let valuePoints = 0;
  let valueDesc = '';
  if (input.amount >= 10000) {
    valuePoints = 35;
    valueDesc = `Tier 1 Premium Value (₹${input.amount.toLocaleString('en-IN')}) represents high single-order revenue.`;
  } else if (input.amount >= 5000) {
    valuePoints = 30;
    valueDesc = `High Cart Value (₹${input.amount.toLocaleString('en-IN')}) significantly exceeds store average order value.`;
  } else if (input.amount >= 2500) {
    valuePoints = 22;
    valueDesc = `Healthy Cart Value (₹${input.amount.toLocaleString('en-IN')}) well above merchant minimum margin.`;
  } else if (input.amount >= 1000) {
    valuePoints = 15;
    valueDesc = `Standard Cart Value (₹${input.amount.toLocaleString('en-IN')}) worthy of automated recovery.`;
  } else {
    valuePoints = 8;
    valueDesc = `Modest Cart Value (₹${input.amount.toLocaleString('en-IN')}).`;
  }
  factors.push({
    factor: 'Cart / Transaction Value',
    points: valuePoints,
    max_points: 35,
    description: valueDesc,
    signal_value: `₹${input.amount.toLocaleString('en-IN')}`,
  });

  // Factor 2: Customer Purchase History & Segment (0 - 25 points)
  let historyPoints = 0;
  let historyDesc = '';
  if (input.customerSegment === 'HIGH_VALUE' || input.customerLifetimeSpend >= 20000) {
    historyPoints = 25;
    historyDesc = `VIP Customer with ₹${input.customerLifetimeSpend.toLocaleString('en-IN')} lifetime spend across ${input.customerTotalOrders} past orders. High retention priority.`;
  } else if (input.customerSegment === 'LOYAL' || input.customerTotalOrders >= 2) {
    historyPoints = 20;
    historyDesc = `Repeat Buyer with ${input.customerTotalOrders} completed orders. Established brand trust.`;
  } else if (input.customerTotalOrders === 1) {
    historyPoints = 14;
    historyDesc = `Returning 2nd-time buyer. High conversion probability on recovery.`;
  } else {
    historyPoints = 10;
    historyDesc = `New Customer demonstrating initial acquisition interest.`;
  }
  factors.push({
    factor: 'Customer History & Trust',
    points: historyPoints,
    max_points: 25,
    description: historyDesc,
    signal_value: `${input.customerSegment} (${input.customerTotalOrders} orders, ₹${input.customerLifetimeSpend.toLocaleString('en-IN')} spend)`,
  });

  // Factor 3: Signal Recency & Urgency Window (0 - 20 points)
  let recencyPoints = 0;
  let recencyDesc = '';
  if (input.minutesSinceEvent <= 30) {
    recencyPoints = 20;
    recencyDesc = `Golden Recovery Window: Abandoned/failed only ${Math.round(input.minutesSinceEvent)} mins ago. Customer purchase intent is peaking right now.`;
  } else if (input.minutesSinceEvent <= 120) {
    recencyPoints = 16;
    recencyDesc = `High Recency: Signal occurred ${Math.round(input.minutesSinceEvent)} mins ago. Good window for high recovery conversion.`;
  } else if (input.minutesSinceEvent <= 1440) {
    recencyPoints = 11;
    recencyDesc = `Within 24-hour window (${Math.round(input.minutesSinceEvent / 60)}h ago). Moderate urgency.`;
  } else {
    recencyPoints = 5;
    recencyDesc = `Older than 24h. Lower urgency but recoverable via dedicated incentive.`;
  }
  factors.push({
    factor: 'Recency & Urgency Window',
    points: recencyPoints,
    max_points: 20,
    description: recencyDesc,
    signal_value: `${Math.round(input.minutesSinceEvent)} mins ago`,
  });

  // Factor 4: Intent Level & Step Reached (0 - 20 points)
  let intentPoints = 0;
  let intentDesc = '';
  if (input.type === 'FAILED_PAYMENT') {
    intentPoints = 20;
    intentDesc = `Maximum Purchase Intent: Customer clicked Pay & entered credentials in Razorpay checkout before encountering failure.`;
  } else if (input.checkoutStepReached === 'PAYMENT') {
    intentPoints = 20;
    intentDesc = `High Purchase Intent: Customer filled shipping details and reached payment gateway selector.`;
  } else if (input.checkoutStepReached === 'SHIPPING') {
    intentPoints = 12;
    intentDesc = `Moderate Intent: Customer initiated checkout and provided delivery address.`;
  } else {
    intentPoints = 7;
    intentDesc = `Cart stage reached with item selection.`;
  }
  factors.push({
    factor: 'Intent & Checkout Stage',
    points: intentPoints,
    max_points: 20,
    description: intentDesc,
    signal_value: input.type === 'FAILED_PAYMENT' ? 'Payment Gateway Step' : `${input.checkoutStepReached} Stage`,
  });

  const totalScore = Math.min(100, Math.max(0, factors.reduce((sum, f) => sum + f.points, 0)));

  return {
    totalScore,
    factors,
  };
}
