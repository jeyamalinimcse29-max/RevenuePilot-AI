'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  ShoppingCart,
  XCircle,
  Sparkles,
  RotateCcw,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
} from 'lucide-react';

export default function DemoCenterPage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const triggerSimulation = async (action: string) => {
    setLoadingAction(action);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackType('success');
        setFeedbackMessage(data.message || 'Simulation event executed successfully.');
      } else {
        setFeedbackType('error');
        setFeedbackMessage(data.error || 'Simulation trigger failed.');
      }
    } catch (err: any) {
      setFeedbackType('error');
      setFeedbackMessage(err.message || 'Connection error.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/60 px-3 py-1 text-xs text-amber-300">
            <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
            <span>Razorpay AI Buildathon Evaluation Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            RevenuePilot Demo & Simulation Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Trigger real domain events and backend signals to evaluate the entire 10-stage agent loop without manual checkout friction.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
          feedbackType === 'success'
            ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
            : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackType === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
            <span>{feedbackMessage}</span>
          </div>
          <Link
            href="/agent"
            className="flex items-center gap-1 font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs transition-colors flex-shrink-0"
          >
            <span>Open Agent Hub</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* 1-Click Evaluation Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario 1: Abandoned Cart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                SCENARIO 1: ABANDONED CART
              </span>
              <ShoppingCart className="h-5 w-5 text-amber-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Simulate High-Value Abandoned Checkout
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Creates an authentic database checkout event for <strong className="text-white">Priya Sharma</strong> (AeroSound Pro Headphones — <span className="font-mono text-emerald-400 font-bold">₹4,999</span>) left at payment step.
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-[11px] text-slate-400 space-y-1">
              <div>• Expected Score: <strong className="text-amber-400">87/100</strong> (High Cart Value + Repeat Buyer)</div>
              <div>• Agent Strategy: <strong>1-Click Direct Recovery Link</strong></div>
            </div>
          </div>

          <button
            onClick={() => triggerSimulation('simulate_abandoned_checkout')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loadingAction === 'simulate_abandoned_checkout' ? 'Generating Event...' : 'Trigger Abandoned Checkout Event'}</span>
          </button>
        </div>

        {/* Scenario 2: Failed Payment */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                SCENARIO 2: PAYMENT FAILURE
              </span>
              <XCircle className="h-5 w-5 text-rose-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Simulate Payment Failure / Decline
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Records a Razorpay Test Mode card decline event for <strong className="text-white">Rahul Verma</strong> (PulseTrack Ultra Smartwatch — <span className="font-mono text-rose-400 font-bold">₹7,499</span>).
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-[11px] text-slate-400 space-y-1">
              <div>• Decline Reason: <strong>Card security / Issuer limit decline</strong></div>
              <div>• Agent Strategy: <strong>Smart Retry Link (UPI / Failover)</strong></div>
            </div>
          </div>

          <button
            onClick={() => triggerSimulation('simulate_failed_payment')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loadingAction === 'simulate_failed_payment' ? 'Recording Failure...' : 'Trigger Payment Decline Event'}</span>
          </button>
        </div>

        {/* Scenario 3: Cross-Sell Growth Signal */}
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4 hover:border-indigo-500/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                SCENARIO 3: AI CROSS-SELL AGENT
              </span>
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Simulate Cross-Sell Opportunity Signal
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Detects product affinity correlation between <strong className="text-white">AeroSound Headphones</strong> and <strong className="text-white">Nomad Backpack</strong> (34% co-purchase rate, <span className="font-mono text-emerald-400 font-bold">₹8,400/mo</span> impact).
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-[11px] text-slate-400 space-y-1">
              <div>• Confidence Score: <strong className="text-indigo-300">87% Confidence</strong></div>
              <div>• Recommended Action: <strong>Checkout Bundle Recommendation Widget</strong></div>
            </div>
          </div>

          <button
            onClick={() => triggerSimulation('simulate_cross_sell')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loadingAction === 'simulate_cross_sell' ? 'Detecting Signal...' : 'Trigger Cross-Sell Opportunity'}</span>
          </button>
        </div>

        {/* Scenario 4: Re-engage Returning Customers Campaign */}
        <div className="rounded-3xl border border-teal-500/30 bg-teal-950/20 p-6 space-y-4 hover:border-teal-500/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700">
                SCENARIO 4: AI CAMPAIGN AGENT
              </span>
              <Layers className="h-5 w-5 text-teal-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Simulate Inactive Customer Campaign Signal
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Scans cohort of <strong className="text-white">126 inactive high-value accounts</strong> to orchestrate 10% reactivation offer (<span className="font-mono text-emerald-400 font-bold">₹24,600</span> estimated revenue).
            </p>

            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-[11px] text-slate-400 space-y-1">
              <div>• Target Reach: <strong>126 Accounts</strong> (8-12% expected uplift)</div>
              <div>• Agent Strategy: <strong>Multi-Channel Campaign Draft</strong></div>
            </div>
          </div>

          <button
            onClick={() => triggerSimulation('simulate_campaign_reengagement')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{loadingAction === 'simulate_campaign_reengagement' ? 'Drafting Campaign...' : 'Trigger Campaign Opportunity'}</span>
          </button>
        </div>

        {/* Scenario 5: Graceful Failure Handling */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 space-y-4 hover:border-rose-500/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                SCENARIO 5: FAILURE HANDLING
              </span>
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Simulate Graceful Action Execution Failure
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Triggers an intentional execution error to demonstrate safe stop guardrails, retry options, and immutable audit logging.
            </p>
          </div>

          <button
            onClick={() => triggerSimulation('simulate_failed_execution')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-700/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{loadingAction === 'simulate_failed_execution' ? 'Simulating Failure...' : 'Trigger Execution Failure State'}</span>
          </button>
        </div>

        {/* Scenario 6: Full Agent Reasoning Cycle */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                SCENARIO 6: AUTONOMOUS CYCLE
              </span>
              <Bot className="h-5 w-5 text-brand-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Execute Autonomous AI Reasoning Cycle
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Runs the full Observe → Analyze → Score → Reason → Recommend pipeline across all merchant signals and registers approvals in the queue.
            </p>
          </div>

          <button
            onClick={() => triggerSimulation('run_agent_cycle')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loadingAction === 'run_agent_cycle' ? 'Reasoning Cycle Active...' : 'Run Full Agent Cycle'}</span>
          </button>
        </div>

        {/* Scenario 7: Clean Database Reset */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                MAINTENANCE: DATASET RESET
              </span>
              <RotateCcw className="h-5 w-5 text-slate-400" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">
              Reset Demo Database to Initial Baseline
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Restores a fresh test dataset with products, seed customers, initial checkouts, and clean audit logs for a brand-new demo run.
            </p>
          </div>

          <button
            onClick={() => triggerSimulation('reset_database')}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 text-xs sm:text-sm font-bold text-slate-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{loadingAction === 'reset_database' ? 'Resetting Data...' : 'Reset Demo Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
