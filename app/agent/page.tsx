'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Clock,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Opportunity } from '@/lib/db/types';
import { OpportunityScoreBadge } from '@/components/opportunities/OpportunityScoreBadge';
import { OpportunityDetailModal } from '@/components/opportunities/OpportunityDetailModal';

export default function AgentHubPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
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

  const handleRunCycle = async () => {
    setRunningAgent(true);
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleReview = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setModalOpen(true);
  };

  const pendingOpps = opportunities.filter(o => o.status !== 'RECOVERED' && o.status !== 'REJECTED');
  const recoveredOpps = opportunities.filter(o => o.status === 'RECOVERED');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Agent State Indicator */}
      <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-brand-950/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-950/60 px-3 py-1 text-xs text-brand-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-400 animate-spin" />
              <span>RevenuePilot AI Core Agent • Online</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Revenue Agent Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              RevenuePilot AI alternates between observing transaction signals, explaining each opportunity, recommending grounded actions, awaiting your explicit merchant approval, then carefully validating and executing before measuring and auditing the outcome.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRunCycle}
              disabled={runningAgent}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${runningAgent ? 'animate-spin' : ''}`} />
              <span>{runningAgent ? 'Analyzing Signals & Reasoning...' : 'Run Detection Cycle'}</span>
            </button>
          </div>
        </div>

        {/* Guardrail Policy Pill */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Human-in-the-Loop Policy Gate Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-400" />
            <span>6 Bounded Tools Registered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Razorpay Test Mode Verified</span>
          </div>
        </div>
      </div>

      {/* Active AI Reasoning Pipeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Revenue Opportunities Requiring Decision ({pendingOpps.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Sorted by Deterministic Priority Score</span>
        </div>

        {pendingOpps.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
            <Bot className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-400">No pending opportunities. All signals are processed.</p>
            <button
              onClick={handleRunCycle}
              className="rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Scan Storefront Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingOpps.map((opp) => {
              const ai = opp.ai_analysis;

              return (
                <div
                  key={opp.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-5 hover:border-slate-700 transition-all shadow-xl"
                >
                  {/* Top Bar: Opportunity Header & Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
                          opp.type === 'ABANDONED_CHECKOUT'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-rose-950 text-rose-300 border-rose-700'
                        }`}>
                          {opp.type === 'ABANDONED_CHECKOUT' ? '🔥 REVENUE OPPORTUNITY DETECTED' : '⚠️ PAYMENT FAILURE AT RISK'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Target: <span className="font-mono text-slate-300">{opp.target_id}</span>
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {opp.customer_name || 'Customer'} • Recoverable Amount: <span className="font-mono text-emerald-400 font-extrabold">₹{opp.amount_at_risk.toLocaleString('en-IN')}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <OpportunityScoreBadge
                        score={opp.opportunity_score}
                        factors={opp.score_factors}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* AI Structured Reasoning Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Left: Signals & Evidence */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                      <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Grounded Signal Evidence</span>
                      </h4>
                      <ul className="space-y-1.5 text-slate-300">
                        {ai?.signals ? (
                          ai.signals.map((sig, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{sig}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500">Signal analyzed via deterministic scoring model.</li>
                        )}
                      </ul>
                    </div>

                    {/* Right: AI Recommendation & Expected Outcome */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Recommended Strategy</span>
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                            {ai?.recommended_action?.type || 'RECOVERY_LINK'}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-1">
                          {ai?.recommended_action?.title || 'One-Click Cart Recovery Link'}
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                          {ai?.rationale || 'Grounded in customer history and high cart value.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-emerald-900/40 text-[11px] text-emerald-300 font-medium">
                        Expected Outcome: {ai?.expected_outcome || `Recovers ₹${opp.potential_recovery_amount.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-brand-400" />
                      <span>Bounded Policy: Requires merchant approval before link dispatch</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(opp)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Review Evidence & Approve</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recovered Section */}
      {recoveredOpps.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Successfully Recovered Revenue ({recoveredOpps.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recoveredOpps.map((opp) => (
              <div
                key={opp.id}
                className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-2 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                    RECOVERED & CAPTURED
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {opp.customer_name || 'Customer'} • <span className="font-mono text-emerald-400">+₹{opp.amount_at_risk.toLocaleString('en-IN')}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {opp.type === 'ABANDONED_CHECKOUT' ? 'Abandoned Cart Restored' : 'Payment Decline Resolved'}
                  </p>
                </div>

                <button
                  onClick={() => handleReview(opp)}
                  className="rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Inspect Trail
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpp}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onApproveSuccess={() => fetchOpportunities()}
      />
    </div>
  );
}
