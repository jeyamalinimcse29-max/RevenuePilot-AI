'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
} from 'lucide-react';
import { Checkout } from '@/lib/db/types';
import { RazorpayCheckoutModal } from '@/components/razorpay/RazorpayCheckoutModal';

export default function RecoveryCheckoutPage({
  params,
}: {
  params: { token: string };
}) {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get('opp') || undefined;
  const actionId = searchParams.get('action') || undefined;
  const discountParam = Number(searchParams.get('discount')) || 0;

  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Razorpay Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);
  const [recoveredPaymentData, setRecoveredPaymentData] = useState<any>(null);

  useEffect(() => {
    const fetchRecoveryData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/checkout/recover/${params.token}`);
        const data = await res.json();
        if (data.success && data.checkout) {
          setCheckout(data.checkout);
          if (data.checkout.status === 'RECOVERED') {
            setIsRecovered(true);
          }
        } else {
          setError(data.error || 'Invalid or expired recovery link.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load recovery checkout.');
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchRecoveryData();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Sparkles className="h-8 w-8 text-brand-400 animate-spin" />
          <h3 className="text-base font-bold text-white">Restoring Your Cart...</h3>
          <p className="text-xs text-slate-400">Loading saved items and courtesy discount.</p>
        </div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-rose-400">Recovery Link Expired or Invalid</h3>
          <p className="text-xs text-slate-400">{error || 'This recovery token could not be resolved.'}</p>
          <Link
            href="/store"
            className="inline-block rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const discountAmount = discountParam > 0 ? Math.round((checkout.subtotal * discountParam) / 100) : 0;
  const finalAmount = Math.max(0, checkout.subtotal - discountAmount);

  const handleStartPayment = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          checkoutId: checkout.id,
          opportunityId,
          actionId,
          customerId: checkout.customer_id,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setRazorpayOrderId(data.order.id);
        setCheckoutModalOpen(true);
      } else {
        alert(data.error || 'Failed to initialize Razorpay test order');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRecoverySuccess = (paymentData: any) => {
    setIsRecovered(true);
    setRecoveredPaymentData(paymentData);
    setCheckoutModalOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 sm:py-8 animate-in fade-in duration-300">
      {/* Recovery Brand Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-6 text-center space-y-2 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-xs text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Restored Cart Session • RevenuePilot Recovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome Back, {checkout.customer_name}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
          We saved your items. Complete your order in Razorpay Test Mode with full verified attribution.
        </p>
      </div>

      {/* Recovered Success Screen */}
      {isRecovered ? (
        <div className="rounded-3xl border border-emerald-500/50 bg-emerald-950/30 p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Order Successfully Recovered!</h2>
            <p className="text-xs sm:text-sm text-emerald-300">
              Payment was captured in Razorpay Test Mode and cryptographically verified.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-900/60 bg-slate-950/80 p-4 text-xs font-mono text-left space-y-1.5 max-w-md mx-auto">
            <div className="flex justify-between text-slate-400">
              <span>Checkout ID:</span>
              <span className="text-white">{checkout.id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Recovered Amount:</span>
              <span className="text-emerald-400 font-bold">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
            {opportunityId && (
              <div className="flex justify-between text-slate-400">
                <span>Attributed Opportunity:</span>
                <span className="text-brand-300">{opportunityId}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Signature Status:</span>
              <span className="text-emerald-400">HMAC-SHA256 VERIFIED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
            >
              Return to Merchant Dashboard
            </Link>
            <Link
              href="/audit"
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-3 text-xs font-semibold text-slate-200 transition-colors"
            >
              Inspect Audit Trail
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Summary & Payment Trigger */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Discount Banner if applied */}
          {discountParam > 0 && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Special Courtesy Loyalty Incentive Applied:</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                {discountParam}% OFF
              </span>
            </div>
          )}

          {/* Restored Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Restored Cart Items ({checkout.cart_items.length})
            </h3>

            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              {checkout.cart_items.map((item) => (
                <div key={item.product_id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">Quantity: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Original Subtotal</span>
              <span className="font-mono text-slate-200">₹{checkout.subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Courtesy Discount ({discountParam}%)</span>
                <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>Total to Pay</span>
              <span className="font-mono text-emerald-400 text-lg">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Complete Recovery Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleStartPayment}
              disabled={isInitializing}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              <span>{isInitializing ? 'Opening Razorpay Gateway...' : `Complete Recovery Checkout (₹${finalAmount.toLocaleString('en-IN')})`}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Razorpay Test Mode Sandbox • Instant HMAC verification</span>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Razorpay Test Modal */}
      {razorpayOrderId && (
        <RazorpayCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          orderId={razorpayOrderId}
          amount={finalAmount}
          customerName={checkout.customer_name}
          customerEmail={checkout.customer_email}
          opportunityId={opportunityId}
          actionId={actionId}
          checkoutId={checkout.id}
          onSuccess={handleRecoverySuccess}
        />
      )}
    </div>
  );
}
