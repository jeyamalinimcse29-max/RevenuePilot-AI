'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Payment } from '@/lib/db/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const capturedTotal = payments
    .filter(p => p.status === 'CAPTURED')
    .reduce((sum, p) => sum + p.amount, 0);

  const failedTotal = payments
    .filter(p => p.status === 'FAILED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-brand-400" />
              <span>Razorpay Payment Intelligence</span>
            </h1>
            <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold uppercase">
              Test Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time transaction reconciliation, decline diagnostics, and recovered revenue attributions.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Total Captured
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{capturedTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-300/80">
            {payments.filter(p => p.status === 'CAPTURED').length} successful test payments
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-1">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
            Failed / At Risk
          </span>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            ₹{failedTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-rose-300/80">
            {payments.filter(p => p.status === 'FAILED').length} declined attempts
          </p>
        </div>

        <div className="rounded-2xl border border-brand-500/30 bg-brand-950/20 p-4 space-y-1">
          <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
            Signature Verification
          </span>
          <div className="text-lg font-bold text-white flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>HMAC-SHA256 Active</span>
          </div>
          <p className="text-[11px] text-slate-400">Zero unverified state transitions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'CAPTURED', 'FAILED', 'CREATED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {status} ({status === 'ALL' ? payments.length : payments.filter(p => p.status === status).length})
          </button>
        ))}
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Payment ID / Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Method & Diagnostics</th>
                <th className="p-4">Recovery Tag</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((pay) => {
                const isCaptured = pay.status === 'CAPTURED';
                const isFailed = pay.status === 'FAILED';

                return (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-semibold text-white">{pay.razorpay_payment_id || pay.id}</div>
                      <div className="font-mono text-[10px] text-slate-400">Order: {pay.razorpay_order_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{pay.customer_name || 'Demo Customer'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{pay.customer_id}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                        isCaptured
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : isFailed
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isCaptured ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : isFailed ? <XCircle className="h-3 w-3 text-rose-400" /> : null}
                        <span>{pay.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-medium capitalize">
                        {pay.payment_method || 'Razorpay Test Gateway'}
                      </div>
                      {isFailed && (
                        <div className="text-[11px] text-rose-400 font-sans mt-0.5">
                          Reason: {pay.failure_reason || 'Decline'} ({pay.failure_description || 'Card Issuer Limit'})
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {pay.is_recovery_payment ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                          <Sparkles className="h-3 w-3" />
                          <span>Recovered</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Standard</span>
                      )}
                    </td>
                    <td className="p-4 text-[11px] text-slate-400">
                      {new Date(pay.created_at).toLocaleDateString()} {new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
