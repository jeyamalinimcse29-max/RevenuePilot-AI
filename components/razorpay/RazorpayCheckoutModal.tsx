'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number; // in INR (e.g. 4999)
  customerName: string;
  customerEmail: string;
  opportunityId?: string;
  actionId?: string;
  checkoutId?: string;
  onSuccess: (paymentData: any) => void;
  onFailure?: (errorData: any) => void;
}

export function RazorpayCheckoutModal({
  isOpen,
  onClose,
  orderId,
  amount,
  customerName,
  customerEmail,
  opportunityId,
  actionId,
  checkoutId,
  onSuccess,
  onFailure,
}: RazorpayCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSimulateSuccess = async () => {
    setLoading(true);
    setPaymentStatus('processing');

    try {
      const simPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 10);
      const simSignature = 'sig_test_' + Math.random().toString(36).substring(2, 16);

      const res = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: simSignature,
          opportunityId,
          actionId,
          checkoutId,
          amount,
        }),
      });

      const data = await res.json();
      if (data.success && data.verified) {
        setPaymentStatus('success');
        setTimeout(() => {
          onSuccess(data);
        }, 1200);
      } else {
        setPaymentStatus('failed');
        setErrorMessage(data.error || 'Payment signature verification failed.');
        if (onFailure) onFailure(data);
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMessage(err.message || 'Payment processing error');
      if (onFailure) onFailure({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDecline = async () => {
    setLoading(true);
    setPaymentStatus('processing');

    try {
      const simPaymentId = 'pay_declined_' + Math.random().toString(36).substring(2, 10);

      const res = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED',
          razorpay_order_id: orderId,
          razorpay_payment_id: simPaymentId,
          amount,
          failure_reason: 'card_declined',
          failure_description: 'Card declined by issuing bank: insufficient funds / authorization limit reached.',
          opportunityId,
          actionId,
          checkoutId,
        }),
      });

      const data = await res.json();
      setPaymentStatus('failed');
      setErrorMessage('Card declined by issuing bank during 3DS security authorization.');
      if (onFailure) onFailure(data);
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Razorpay Brand Header */}
        <div className="flex items-center justify-between bg-razor-blue px-6 py-4 border-b border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-razor-cyan font-bold text-slate-950 text-xs">
              RZP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">Razorpay</span>
                <span className="rounded bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                  Test Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-300">Apex Electronics & Gear Checkout</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono">₹{amount.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-300 font-mono">Order: {orderId.slice(0, 14)}...</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {paymentStatus === 'idle' && (
            <>
              {/* Customer summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="text-white font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Email:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{customerEmail}</span>
                </div>
                {opportunityId && (
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                    <span>Recovery Session:</span>
                    <span>Active (Attribution Linked)</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Select Test Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      selectedMethod === 'upi'
                        ? 'border-brand-500 bg-brand-950/60 text-brand-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">UPI</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Instant Pay</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      selectedMethod === 'card'
                        ? 'border-brand-500 bg-brand-950/60 text-brand-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">Card</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Visa / MC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('netbanking')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      selectedMethod === 'netbanking'
                        ? 'border-brand-500 bg-brand-950/60 text-brand-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">NetBanking</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">All Banks</div>
                  </button>
                </div>
              </div>

              {/* Simulation Action Triggers */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Payment (₹{amount.toLocaleString('en-IN')})</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDecline}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/50 py-2.5 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <span>Simulate Payment Decline / Failure</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2">
                <Lock className="h-3 w-3 text-emerald-400" />
                <span>Razorpay 256-bit SSL Test Sandbox • No real money deducted</span>
              </div>
            </>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div className="py-8 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-white">Communicating with Razorpay Test Gateway...</h4>
              <p className="text-xs text-slate-400">Verifying cryptographic HMAC signature & attributing revenue...</p>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-white">Payment Succeeded!</h4>
              <p className="text-xs text-emerald-400">
                Razorpay signature verified. Revenue attribution recorded in database.
              </p>
            </div>
          )}

          {/* Failed State */}
          {paymentStatus === 'failed' && (
            <div className="py-6 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 border border-rose-500 text-rose-400 mx-auto">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Payment Declined</h4>
                <p className="text-xs text-rose-300/90 mt-1 max-w-xs mx-auto">
                  {errorMessage}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400 text-left">
                RevenuePilot AI agent has recorded this failure in the transaction ledger and flagged ₹{amount.toLocaleString('en-IN')} as Revenue at Risk.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentStatus('idle')}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Retry with Different Method
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-700 hover:bg-slate-800 py-2 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
