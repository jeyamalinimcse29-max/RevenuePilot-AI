'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Sparkles, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Customer } from '@/lib/db/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => segmentFilter === 'ALL' || c.segment === segmentFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-400" />
            <span>Customer Intelligence & Segmentation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            RFM deterministic segmentation and retention risk profiles evaluated by the agent.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Segment Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'High Value', segment: 'HIGH_VALUE', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20' },
          { label: 'Loyal Buyers', segment: 'LOYAL', color: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/20' },
          { label: 'At Risk / Churn', segment: 'AT_RISK', color: 'border-rose-500/40 text-rose-300 bg-rose-950/20' },
          { label: 'New Prospects', segment: 'NEW', color: 'border-amber-500/40 text-amber-300 bg-amber-950/20' },
          { label: 'Inactive', segment: 'INACTIVE', color: 'border-slate-700 text-slate-400 bg-slate-900/40' },
        ].map(s => {
          const count = customers.filter(c => c.segment === s.segment).length;
          return (
            <button
              key={s.segment}
              onClick={() => setSegmentFilter(segmentFilter === s.segment ? 'ALL' : s.segment)}
              className={`rounded-2xl border p-3.5 text-left transition-all ${s.color} ${
                segmentFilter === s.segment ? 'ring-2 ring-brand-400' : ''
              }`}
            >
              <div className="text-[11px] font-semibold uppercase">{s.label}</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Segment</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Last Purchase</th>
                <th className="p-4">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400">{c.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {c.segment}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-white">
                    ₹{c.lifetime_spend.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-mono">{c.total_orders}</td>
                  <td className="p-4 text-slate-400">
                    {c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4">
                    <span className={`font-mono text-xs font-semibold ${
                      c.risk_score > 60 ? 'text-rose-400' : c.risk_score > 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {c.risk_score}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
