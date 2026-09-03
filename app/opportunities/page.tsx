'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Zap,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Opportunity } from '@/lib/db/types';
import { OpportunityScoreBadge } from '@/components/opportunities/OpportunityScoreBadge';
import { OpportunityDetailModal } from '@/components/opportunities/OpportunityDetailModal';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities?detect=true');
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpps = opportunities.filter((o) => {
    const matchesSearch =
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.target_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && (o.status === 'DETECTED' || o.status === 'PENDING_APPROVAL')) ||
      (statusFilter === 'ACTIVE' && o.status === 'ACTION_CREATED') ||
      (statusFilter === 'RECOVERED' && o.status === 'RECOVERED');

    const matchesType = typeFilter === 'ALL' || o.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-brand-400" />
            <span>Revenue Opportunities</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Deterministic candidate events evaluated and scored for merchant recovery.
          </p>
        </div>

        <button
          onClick={fetchOpportunities}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, checkout ID, or opportunity ID..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="ACTIVE">Action Created</option>
            <option value="RECOVERED">Recovered</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="ABANDONED_CHECKOUT">Abandoned Checkout</option>
            <option value="FAILED_PAYMENT">Failed Payment</option>
          </select>
        </div>
      </div>

      {/* Opportunities Table / List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {filteredOpps.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <p>No opportunities match the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Type & ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Value at Risk</th>
                  <th className="p-4">Priority Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOpps.map((opp) => {
                  const isRecovered = opp.status === 'RECOVERED';
                  return (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {opp.type === 'ABANDONED_CHECKOUT' ? 'Abandoned Checkout' : 'Failed Payment'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{opp.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{opp.customer_name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{opp.customer_email || '—'}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        ₹{opp.amount_at_risk.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <OpportunityScoreBadge score={opp.opportunity_score} size="sm" />
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                          isRecovered
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : opp.status === 'ACTION_CREATED'
                            ? 'bg-blue-950 text-blue-300 border-blue-700'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}>
                          {opp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOpp(opp);
                            setModalOpen(true);
                          }}
                          className="rounded-lg bg-brand-600/20 border border-brand-500/30 hover:bg-brand-600 hover:text-white px-3 py-1.5 text-xs font-semibold text-brand-300 transition-all"
                        >
                          Review & Act
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OpportunityDetailModal
        opportunity={selectedOpp}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onApproveSuccess={() => fetchOpportunities()}
      />
    </div>
  );
}
