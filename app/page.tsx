'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Target,
  Sparkles,
  Bot,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { DashboardMetrics, Opportunity, RevenueAttribution } from '@/lib/db/types';
import { OpportunityScoreBadge } from '@/components/opportunities/OpportunityScoreBadge';
import { OpportunityDetailModal } from '@/components/opportunities/OpportunityDetailModal';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [attributions, setAttributions] = useState<RevenueAttribution[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, oRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/opportunities?detect=true'),
      ]);

      const mData = await mRes.json();
      const oData = await oRes.json();

      if (mData.success) {
        setMetrics(mData.metrics);
        setAttributions(mData.attributions || []);
      }
      if (oData.success) {
        setOpportunities(oData.opportunities || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewOpp = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setModalOpen(true);
  };

  const handleApproveSuccess = (updatedOpp: Opportunity) => {
    setSelectedOpp(updatedOpp);
    fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Welcome & Agent Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-brand-950/40 to-slate-900/90 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              AI Revenue Agent Active • Razorpay Track 01
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>AI Growth Overview</span>
            <Sparkles className="h-6 w-6 text-brand-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            RevenuePilot AI finds revenue opportunities, recommends bounded actions, requests merchant approval, executes approved actions, and measures revenue impact.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/agent"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
          >
            <Bot className="h-4 w-4" />
            <span>AI Growth Agent Hub</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan Signals</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Captured Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Current Revenue</span>
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            ₹{metrics?.total_revenue ? metrics.total_revenue.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold">Captured</span> on Razorpay
          </p>
        </div>

        {/* AI-Attributed Revenue */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5 hover:border-emerald-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">AI Revenue</span>
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
            ₹{metrics?.ai_attributed_revenue ? metrics.ai_attributed_revenue.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] text-emerald-300/80">
            Attributed to agent actions
          </p>
        </div>

        {/* Potential Revenue */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-1.5 hover:border-indigo-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Potential Revenue</span>
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-300 font-mono">
            ₹{metrics?.potential_growth_revenue ? metrics.potential_growth_revenue.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] text-indigo-300/80">
            Across active AI opportunities
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-1.5 hover:border-cyan-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Avg Order Value</span>
            <Target className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono">
            ₹{metrics?.average_order_value ? metrics.average_order_value.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] text-cyan-300/80">
            Target AOV expansion active
          </p>
        </div>

        {/* Revenue at Risk */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-1.5 hover:border-rose-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Revenue at Risk</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">
            ₹{metrics?.revenue_at_risk ? metrics.revenue_at_risk.toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] text-rose-300/80">
            {metrics?.abandoned_checkout_count || 0} checkout, {metrics?.failed_payment_count || 0} failed pay
          </p>
        </div>

        {/* Active AI Opportunities */}
        <div className="rounded-2xl border border-brand-500/30 bg-brand-950/20 p-4 space-y-1.5 hover:border-brand-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-brand-300">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Active Opportunities</span>
            <Bot className="h-3.5 w-3.5 text-brand-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-300 font-mono">
            {opportunities.length} Active
          </div>
          <p className="text-[10px] text-brand-300/80">
            Awaiting merchant review
          </p>
        </div>
      </div>

      {/* Main Content Split: AI Growth Opportunities & Attribution Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): AI Growth Opportunities Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">AI Growth Opportunities</h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View All ({opportunities.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
              <Bot className="h-10 w-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">No active revenue growth opportunities detected right now.</p>
              <Link
                href="/demo-center"
                className="inline-block rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Go to Demo Center to Trigger Growth Signals
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const isRecovered = opp.status === 'RECOVERED' || opp.status === 'APPROVED' || opp.status === 'ACTION_CREATED';
                const confidencePct = opp.ai_analysis?.confidence || (opp.opportunity_score >= 80 ? 87 : 78);

                let badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-800';
                let labelText = 'REVENUE OPPORTUNITY';

                if (opp.type === 'CROSS_SELL') {
                  badgeStyle = 'bg-indigo-950/80 text-indigo-300 border-indigo-700';
                  labelText = 'AI CROSS-SELL';
                } else if (opp.type === 'RE_ENGAGEMENT') {
                  badgeStyle = 'bg-teal-950/80 text-teal-300 border-teal-700';
                  labelText = 'AI CAMPAIGN';
                } else if (opp.type === 'ABANDONED_CHECKOUT') {
                  badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-800';
                  labelText = 'ABANDONED CHECKOUT';
                } else if (opp.type === 'FAILED_PAYMENT') {
                  badgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-800';
                  labelText = 'FAILED PAYMENT';
                }

                return (
                  <div
                    key={opp.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isRecovered
                        ? 'border-emerald-800/40 bg-emerald-950/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Type, Customer & Description */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle}`}>
                            {labelText}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-950/60 text-brand-300 border border-brand-800/60">
                            Confidence: {confidencePct}%
                          </span>

                          <OpportunityScoreBadge score={opp.opportunity_score} size="sm" />

                          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                            isRecovered ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/50' : 'text-slate-400 bg-slate-800'
                          }`}>
                            Status: {opp.status === 'DETECTED' ? 'Awaiting merchant approval' : opp.status}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {opp.ai_analysis?.recommended_action?.title || (opp.type === 'CROSS_SELL' ? 'Create Cross-Sell Recommendation' : `Revenue Opportunity for ${opp.customer_name || 'Customer'}`)}
                        </h3>

                        <div className="text-xs text-slate-300 space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Estimated Revenue Impact:</span>
                            <span className="font-mono font-bold text-emerald-400">₹{opp.potential_recovery_amount.toLocaleString('en-IN')}{opp.type === 'CROSS_SELL' ? '/month' : ''}</span>
                          </div>
                          <p className="text-slate-400 line-clamp-2 text-[11px]">
                            <strong className="text-slate-300">Signal:</strong> {opp.ai_analysis?.summary || opp.score_factors[0]?.description || 'Engine detected high customer conversion probability.'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="flex items-center gap-2 flex-shrink-0 sm:self-center">
                        <button
                          onClick={() => handleReviewOpp(opp)}
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                            isRecovered
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-600/30 hover:scale-105'
                          }`}
                        >
                          {isRecovered ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          <span>{isRecovered ? 'View Action Details' : 'Review Action'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Attributed Revenue Ledger & Live Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Recovered Ledger</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Razorpay Verified</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            {attributions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <p>No recovered transactions yet.</p>
                <p className="text-[11px] text-slate-400">
                  Approve an opportunity and complete test checkout to witness instant revenue attribution!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {attributions.map((attr) => (
                  <div
                    key={attr.id}
                    className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 font-mono">
                        +₹{attr.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/80 px-1.5 py-0.2 rounded border border-emerald-700">
                        VERIFIED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Source: <span className="text-white font-medium">{attr.source.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Pay ID: {attr.payment_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Simulation Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Buildathon Demo Shortcuts</span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Trigger instant test scenarios in the demo center to evaluate all 10 agent loop stages.
            </p>
            <Link
              href="/demo-center"
              className="block text-center rounded-xl bg-amber-600 hover:bg-amber-500 py-2 text-xs font-bold text-white transition-colors"
            >
              Open Evaluation Demo Center
            </Link>
          </div>
        </div>
      </div>

      {/* Opportunity Detail & Approval Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpp}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onApproveSuccess={handleApproveSuccess}
      />
    </div>
  );
}
