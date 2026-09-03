import Razorpay from 'razorpay';
import { isDemoCredentials } from './verification';

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && !isDemoCredentials()) {
    try {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (e) {
      console.warn('Could not initialize official Razorpay SDK client:', e);
    }
  }
  return null;
}

export function isRealRazorpayMode(): boolean {
  return Boolean(getRazorpayClient());
}

export interface CreateOrderParams {
  amount: number; // in INR (e.g., 4999)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, string>;
  is_simulated?: boolean;
}

export async function createTestOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const client = getRazorpayClient();
  const amountInPaise = Math.round(params.amount * 100);
  const currency = params.currency || 'INR';
  const receipt = params.receipt || 'rcpt_' + Math.random().toString(36).substring(2, 9);
  const notes = params.notes || {};

  if (client) {
    // Real credentials are configured: we must NOT silently fall back to the
    // simulator. If the Razorpay API call fails, surface the real error so the
    // merchant knows the order never existed in Razorpay.
    const order = await client.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    });
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || receipt,
      status: order.status,
      notes: (order.notes as Record<string, string>) || notes,
      is_simulated: false,
    };
  }

  // High-Fidelity Test Simulator Order
  const simOrderId = 'order_test_' + Math.random().toString(36).substring(2, 11);
  return {
    id: simOrderId,
    amount: amountInPaise,
    currency,
    receipt,
    status: 'created',
    notes,
    is_simulated: true,
  };
}
