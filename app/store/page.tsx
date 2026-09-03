'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  X,
  Sparkles,
  CreditCard,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Product, CartItem } from '@/lib/db/types';
import { RazorpayCheckoutModal } from '@/components/razorpay/RazorpayCheckoutModal';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeCheckoutId, setActiveCheckoutId] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Customer Profile for Demo Store
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [customerEmail, setCustomerEmail] = useState('priya.sharma@example.com');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (prod: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === prod.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: 1,
          image_url: prod.image_url,
        },
      ];
    });
    setCartOpen(true);
  };

  const removeFromCart = (prodId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== prodId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleStartCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessingCheckout(true);

    try {
      // 1. Create Checkout in DB
      const chkRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          customer: {
            id: 'cust_08',
            name: customerName,
            email: customerEmail,
          },
          stepReached: 'PAYMENT',
          isAbandoned: false,
        }),
      });
      const chkData = await chkRes.json();
      const checkoutId = chkData.checkout.id;
      setActiveCheckoutId(checkoutId);

      // 2. Create Razorpay Test Order
      const rzpRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          checkoutId,
          customerId: 'cust_08',
        }),
      });
      const rzpData = await rzpRes.json();

      if (rzpData.success && rzpData.order) {
        setActiveOrderId(rzpData.order.id);
        setCheckoutModalOpen(true);
        setCartOpen(false);
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
      alert('Error starting checkout');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleSimulateAbandon = async () => {
    if (cart.length === 0) return;
    setIsProcessingCheckout(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          customer: {
            id: 'cust_08',
            name: customerName,
            email: customerEmail,
          },
          stepReached: 'PAYMENT',
          isAbandoned: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `ðŸ›’ Checkout Abandoned!\n\nRevenuePilot AI agent detected the abandoned cart (₹${subtotal.toLocaleString('en-IN')}) for ${customerName}.\n\nGo to the Merchant Dashboard or Agent Hub to review the opportunity and approve recovery!`
        );
        setCartOpen(false);
        setCart([]);
      }
    } catch (err: any) {
      alert('Error abandoning checkout: ' + err.message);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCheckoutModalOpen(false);
    setOrderSuccess(true);
    setCart([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Store Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold uppercase">
              Customer Storefront Demo
            </span>
            <span className="text-xs text-slate-400">Razorpay Test Mode</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Apex Electronics <span className="text-slate-500 font-semibold">&amp;</span> Gear
          </h1>
          <p className="text-xs sm:text-sm text-brand-300/90 font-mono">
            Customer Store &bull; Powered by RevenuePilot AI
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            Simulate realistic customer shopping journeys, intentional cart drop-offs, and test payment completions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>View Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {orderSuccess && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Razorpay Order Placed Successfully!</h3>
              <p className="text-xs text-emerald-300">
                Payment captured in Razorpay Test Mode and verified by the backend.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            Inspect in Dashboard
          </Link>
        </div>
      )}

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="h-48 w-full bg-slate-950 overflow-hidden relative">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-xs font-bold font-mono text-emerald-400 border border-slate-800">
                  ₹{p.price.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-brand-400 bg-brand-950/80 border border-brand-800 px-2 py-0.5 rounded">
                  {p.category}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => addToCart(p)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white py-2.5 text-xs font-bold text-slate-200 border border-slate-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl p-6 justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6 overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-bold text-white">Your Shopping Cart</h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Shopper identity */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-1">
                <div className="text-slate-400">Demo Customer Profile:</div>
                <div className="font-bold text-white">{customerName} ({customerEmail})</div>
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Your cart is empty. Click &quot;Add to Cart&quot; on any product above.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          ₹{item.price.toLocaleString('en-IN')} x {item.quantity}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer Actions */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span>Subtotal</span>
                  <span className="font-mono text-emerald-400">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Primary Checkout Button */}
                <button
                  onClick={handleStartCheckout}
                  disabled={isProcessingCheckout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{isProcessingCheckout ? 'Initializing Order...' : 'Pay via Razorpay Test Mode'}</span>
                </button>

                {/* Buildathon Special: Intentional Abandon Button */}
                <button
                  onClick={handleSimulateAbandon}
                  disabled={isProcessingCheckout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-800/60 bg-amber-950/40 hover:bg-amber-900/50 py-2.5 text-xs font-semibold text-amber-300 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Simulate Abandoning Checkout</span>
                </button>

                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-1">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span>Razorpay Test Sandbox • No live charges</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Razorpay Test Modal */}
      {activeOrderId && (
        <RazorpayCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          orderId={activeOrderId}
          amount={subtotal}
          customerName={customerName}
          customerEmail={customerEmail}
          checkoutId={activeCheckoutId || undefined}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
